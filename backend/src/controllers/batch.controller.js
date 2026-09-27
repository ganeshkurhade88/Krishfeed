// src/controllers/batch.controller.js
const db = require('../db');
const ApiResponse = require('../utils/apiResponse');
const sanitize = require('../utils/sanitize');
const { getTemperature } = require('../services/weatherAPI.service');

const createBatch = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { feed_type, quantity_kg, district, state, storage_type, date_stored, opening_freq, moisture_feel, colour, smell, image_url, image_consent } = req.body;

    const batchCode = `SIL-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const temp_c = await getTemperature(20, 77); // Default coords, ideally from user profile or request

    const result = await db.query(`
      INSERT INTO batches (batch_code, farmer_id, feed_type, quantity_kg, district, state, storage_type, date_stored, opening_freq, moisture_feel, colour, smell, image_url, image_consent, temperature_c)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [batchCode, userId, sanitize(feed_type), quantity_kg, sanitize(district), sanitize(state), sanitize(storage_type), date_stored, sanitize(opening_freq), sanitize(moisture_feel), sanitize(colour), sanitize(smell), image_url ? sanitize(image_url) : null, image_consent || false, temp_c]);

    res.status(201).json(ApiResponse.success(result.rows[0], 'Batch created successfully'));
  } catch (error) {
    next(error);
  }
};

const getBatches = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const result = await db.query('SELECT * FROM batches WHERE farmer_id = $1 AND status != \'deleted\' ORDER BY created_at DESC', [userId]);
    res.json(ApiResponse.success(result.rows));
  } catch (error) {
    next(error);
  }
};

const getBatchById = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const result = await db.query('SELECT * FROM batches WHERE id = $1 AND farmer_id = $2 AND status != \'deleted\'', [id, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json(ApiResponse.error('Batch not found'));
    }
    res.json(ApiResponse.success(result.rows[0]));
  } catch (error) {
    next(error);
  }
};

const updateBatchStatus = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await db.query(`
      UPDATE batches SET status = $1, updated_at = NOW() 
      WHERE id = $2 AND farmer_id = $3 
      RETURNING id, status
    `, [sanitize(status), id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json(ApiResponse.error('Batch not found'));
    }
    res.json(ApiResponse.success(result.rows[0], 'Status updated'));
  } catch (error) {
    next(error);
  }
};

const deleteBatch = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    
    const result = await db.query(`
      UPDATE batches SET status = 'deleted', updated_at = NOW() 
      WHERE id = $1 AND farmer_id = $2 
      RETURNING id
    `, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json(ApiResponse.error('Batch not found'));
    }
    res.json(ApiResponse.success(null, 'Batch deleted'));
  } catch (error) {
    next(error);
  }
};

const getPublicPassport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT b.batch_code, b.feed_type, b.district, b.state, b.date_stored, b.status, tr.overall_risk_level, tr.fermentation_quality
      FROM batches b
      LEFT JOIN test_results tr ON tr.batch_id = b.id
      WHERE b.id = $1 AND b.status IN ('active', 'listed')
      ORDER BY tr.tested_at DESC LIMIT 1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json(ApiResponse.error('Public passport not found or unavailable'));
    }
    res.json(ApiResponse.success(result.rows[0]));
  } catch (error) {
    next(error);
  }
};

module.exports = { createBatch, getBatches, getBatchById, updateBatchStatus, deleteBatch, getPublicPassport };
