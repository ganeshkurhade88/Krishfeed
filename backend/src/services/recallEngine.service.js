// src/services/recallEngine.service.js

async function triggerRecallIfEligible(reportId, db) {
  const report = await db.query(
    'SELECT * FROM batch_reports WHERE id = $1', [reportId]
  );
  const r = report.rows[0];

  if (!r.recall_eligible) {
    return {
      triggered: false,
      reason: 'Report filed more than 10 days after sale. Cannot determine if issue is from original batch or post-purchase storage.'
    };
  }

  const buyers = await db.query(`
    SELECT bt.buyer_id, u.name, bt.sale_date, bt.quantity_sold
    FROM batch_traceability bt
    JOIN users u ON u.id = bt.buyer_id
    WHERE bt.batch_id = $1
    AND bt.buyer_id != $2
    AND bt.sale_status = 'active'
  `, [r.batch_id, r.reported_by]);

  for (const buyer of buyers.rows) {
    await db.query(`
      INSERT INTO batch_alerts
      (batch_id, farmer_id, alert_type, alert_reason, suggested_action)
      VALUES ($1, $2, 'recall', $3, $4)
    `, [
      r.batch_id,
      buyer.buyer_id,
      `RECALL ALERT: A quality concern was reported for batch you purchased on ${buyer.sale_date}. Report filed within 10 days of sale.`,
      'Inspect your stock immediately. Stop feeding if abnormalities found. Contact the seller.'
    ]);
  }

  await db.query(
    'UPDATE batches SET status = $1 WHERE id = $2',
    ['recalled', r.batch_id]
  );

  await db.query(
    'UPDATE batch_traceability SET sale_status = $1 WHERE batch_id = $2',
    ['recalled', r.batch_id]
  );

  await db.query(
    'UPDATE batch_reports SET is_recall_triggered = TRUE WHERE id = $1',
    [reportId]
  );

  return { triggered: true, buyers_alerted: buyers.rows.length };
}

module.exports = { triggerRecallIfEligible };
