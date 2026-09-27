// src/controllers/advisory.controller.js
const db = require('../db');
const ApiResponse = require('../utils/apiResponse');

const getAdvisory = async (req, res, next) => {
  try {
    const { batchId } = req.params;
    const { userId } = req.user;
    
    // Check if user owns batch
    const batchRes = await db.query('SELECT id FROM batches WHERE id = $1 AND farmer_id = $2', [batchId, userId]);
    if (batchRes.rows.length === 0) return res.status(404).json(ApiResponse.error('Batch not found'));

    const result = await db.query('SELECT * FROM advisories WHERE batch_id = $1 ORDER BY generated_at DESC LIMIT 1', [batchId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json(ApiResponse.error('Advisory not found for this batch'));
    }
    
    res.json(ApiResponse.success(result.rows[0]));
  } catch (error) {
    next(error);
  }
};

module.exports = { getAdvisory };
