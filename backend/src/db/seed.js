require('dotenv').config();
const { pool } = require('./index');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');

async function seedData() {
  try {
    logger.info('Starting database seed...');
    await pool.query('BEGIN');

    // 1. Create a dummy user
    const passwordHash = await bcrypt.hash('password123', 10);
    const userRes = await pool.query(`
      INSERT INTO users (name, phone, password_hash, district, state, role)
      VALUES ('Demo Farmer', '9876543210', $1, 'Akola', 'Maharashtra', 'farmer')
      ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `, [passwordHash]);
    const userId = userRes.rows[0].id;
    logger.info(`User created with ID: ${userId}`);

    // 2. Clear existing batches for this user (to avoid duplicates on re-run)
    await pool.query('DELETE FROM batches WHERE farmer_id = $1', [userId]);

    // 3. Insert some batches
    const batch1Res = await pool.query(`
      INSERT INTO batches (farmer_id, batch_code, feed_type, quantity_kg, date_stored, storage_type, moisture_feel, colour, smell, temperature_c)
      VALUES ($1, 'SIL-2026-84729', 'maize_silage', 2500, '2026-08-15', 'pit', 'moist', 'olive_green', 'normal_slightly_acidic', 28)
      RETURNING id;
    `, [userId]);
    const batch1Id = batch1Res.rows[0].id;

    const batch2Res = await pool.query(`
      INSERT INTO batches (farmer_id, batch_code, feed_type, quantity_kg, date_stored, storage_type, moisture_feel, colour, smell, temperature_c)
      VALUES ($1, 'SIL-2026-39281', 'sorghum_silage', 1200, '2026-09-02', 'bag', 'wet', 'golden_brown', 'strongly_acidic', 31)
      RETURNING id;
    `, [userId]);
    const batch2Id = batch2Res.rows[0].id;

    // 4. Insert test results
    await pool.query(`
      INSERT INTO test_results (batch_id, visual_score, overall_risk_level, crude_protein_min, crude_protein_max, moisture_min, moisture_max)
      VALUES 
      ($1, 84, 'low', 8.2, 9.6, 64.0, 68.5),
      ($2, 72, 'medium', 7.5, 8.5, 70.0, 75.0);
    `, [batch1Id, batch2Id]);

    // 5. Insert Alerts
    await pool.query('DELETE FROM batch_alerts WHERE farmer_id = $1', [userId]);
    await pool.query(`
      INSERT INTO batch_alerts (farmer_id, batch_id, alert_type, alert_reason, suggested_action, is_read)
      VALUES ($1, $2, 'early_warning', 'High moisture detected. Risk of Clostridial fermentation.', 'Check pit drainage and apply salt layer to exposed face.', false);
    `, [userId, batch2Id]);

    await pool.query('COMMIT');
    logger.info('Database seeded successfully! You can login with phone: 9876543210 and password: password123');
  } catch (error) {
    await pool.query('ROLLBACK');
    logger.error('Seeding failed', { error: error.message });
  } finally {
    await pool.end();
  }
}

seedData();
