// src/controllers/traceability.controller.js
const db = require('../db');
const ApiResponse = require('../utils/apiResponse');
const { triggerRecallIfEligible } = require('../services/recallEngine.service');

const getBuyerChain = async (req, res, next) => {
  try {
    const { batchId } = req.params;
    const result = await db.query(`
      SELECT bt.sale_date, bt.quantity_sold, bt.sale_status, u.name as buyer_name, u.district as buyer_district
      FROM batch_traceability bt
      JOIN users u ON bt.buyer_id = u.id
      WHERE bt.batch_id = $1
      ORDER BY bt.sale_date DESC
    `, [batchId]);
    res.json(ApiResponse.success(result.rows));
  } catch (error) {
    next(error);
  }
};

const submitIssueReport = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { batch_id, report_type, report_description } = req.body;

    const traceRes = await db.query('SELECT sale_date FROM batch_traceability WHERE batch_id = $1 AND buyer_id = $2 LIMIT 1', [batch_id, userId]);
    if (traceRes.rows.length === 0) return res.status(400).json(ApiResponse.error('No record of you purchasing this batch'));

    const sale_date = traceRes.rows[0].sale_date;

    const result = await db.query(`
      INSERT INTO batch_reports (batch_id, reported_by, report_type, report_description, sale_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [batch_id, userId, report_type, report_description, sale_date]);

    const reportId = result.rows[0].id;

    // Trigger recall engine asynchronously
    triggerRecallIfEligible(reportId, db).catch(console.error);

    res.status(201).json(ApiResponse.success(null, 'Report submitted successfully. Investigation initiated.'));
  } catch (error) {
    next(error);
  }
};

module.exports = { getBuyerChain, submitIssueReport };
