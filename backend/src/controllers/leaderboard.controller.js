// src/controllers/leaderboard.controller.js
const db = require('../db');
const ApiResponse = require('../utils/apiResponse');

const getDistrictLeaderboard = async (req, res, next) => {
  try {
    const { district } = req.query;
    if (!district) return res.status(400).json(ApiResponse.error('District is required'));

    // Assuming we want the current month's leaderboard
    const currentMonth = new Date().toISOString().slice(0, 7);

    const result = await db.query(`
      SELECT l.district_rank, l.avg_score, l.batch_count, u.name as farmer_name
      FROM leaderboard_scores l
      JOIN users u ON l.farmer_id = u.id
      WHERE l.district = $1 AND l.month = $2
      ORDER BY l.district_rank ASC
      LIMIT 10
    `, [district, currentMonth]);

    res.json(ApiResponse.success(result.rows));
  } catch (error) {
    next(error);
  }
};

module.exports = { getDistrictLeaderboard };
