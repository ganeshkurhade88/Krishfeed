// src/controllers/alert.controller.js
const db = require('../db');
const ApiResponse = require('../utils/apiResponse');

const getAlerts = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const result = await db.query(`
      SELECT * FROM batch_alerts 
      WHERE farmer_id = $1 AND is_dismissed = FALSE 
      ORDER BY triggered_at DESC
    `, [userId]);
    res.json(ApiResponse.success(result.rows));
  } catch (error) {
    next(error);
  }
};

const markAlertRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    await db.query('UPDATE batch_alerts SET is_read = TRUE, read_at = NOW() WHERE id = $1 AND farmer_id = $2', [id, userId]);
    res.json(ApiResponse.success(null, 'Alert marked as read'));
  } catch (error) {
    next(error);
  }
};

const dismissAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    await db.query('UPDATE batch_alerts SET is_dismissed = TRUE, dismissed_at = NOW() WHERE id = $1 AND farmer_id = $2', [id, userId]);
    res.json(ApiResponse.success(null, 'Alert dismissed'));
  } catch (error) {
    next(error);
  }
};

module.exports = { getAlerts, markAlertRead, dismissAlert };
