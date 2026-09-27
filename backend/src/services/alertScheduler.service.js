// src/services/alertScheduler.service.js
const cron = require('node-cron');
const db = require('../db');
const logger = require('../utils/logger');

function startAlertScheduler() {
  cron.schedule('0 7 * * *', async () => {
    logger.info('[AlertScheduler] Running daily batch check...');
    
    try {
      const batches = await db.query(`
        SELECT b.id, b.farmer_id, b.date_stored, b.batch_code,
               rf.day_7_score, rf.day_15_score,
               tr.visual_score as current_score
        FROM batches b
        LEFT JOIN risk_forecasts rf ON rf.batch_id = b.id
        LEFT JOIN test_results tr ON tr.batch_id = b.id
        WHERE b.status = 'active'
        ORDER BY tr.tested_at DESC
      `);

      for (const batch of batches.rows) {
        const daysSinceStored = Math.floor(
          (Date.now() - new Date(batch.date_stored)) / (1000 * 60 * 60 * 24)
        );

        const condA = batch.day_7_score && batch.day_7_score < 70;
        const condB = daysSinceStored > 12 && batch.current_score < 75;
        const condC = batch.current_score < 65;

        if (condA || condB || condC) {
          const recent = await db.query(`
            SELECT id FROM batch_alerts
            WHERE batch_id = $1
            AND triggered_at > NOW() - INTERVAL '3 days'
            LIMIT 1
          `, [batch.id]);

          if (recent.rows.length === 0) {
            await db.query(`
              INSERT INTO batch_alerts
              (batch_id, farmer_id, alert_type, condition_triggered, 
               alert_reason, suggested_action)
              VALUES ($1, $2, 'early_warning', $3, $4, $5)
            `, [
              batch.id,
              batch.farmer_id,
              condA ? 'A' : condB ? 'B' : 'C',
              `Batch ${batch.batch_code}: Storage age ${daysSinceStored} days. Quality score at risk of dropping below safe threshold.`,
              'Inspect batch physically. Consider laboratory testing if abnormalities are found.'
            ]);
          }
        }
      }
    } catch (err) {
      logger.error('Alert scheduler failed', { error: err.message });
    }
  }, { timezone: 'Asia/Kolkata' });
}

module.exports = { startAlertScheduler };
