// src/controllers/testing.controller.js
const db = require('../db');
const ApiResponse = require('../utils/apiResponse');
const { estimateNutrition } = require('../services/nutritionEstimator.service');
const { calculateDecay } = require('../services/decayModel.service');
const { generateAdvisory } = require('../services/advisoryEngine.service');

const submitTestInputs = async (req, res, next) => {
  try {
    const { batchId } = req.params;
    const { userId } = req.user;
    const inputs = req.body;

    const batchRes = await db.query('SELECT * FROM batches WHERE id = $1 AND farmer_id = $2', [batchId, userId]);
    if (batchRes.rows.length === 0) return res.status(404).json(ApiResponse.error('Batch not found'));
    
    const batch = batchRes.rows[0];
    const durationDays = Math.floor((Date.now() - new Date(batch.date_stored)) / (1000 * 60 * 60 * 24));
    let storage_duration = '1_4_weeks';
    if (durationDays < 7) storage_duration = 'fresh';
    else if (durationDays > 90) storage_duration = '3_months_plus';
    else if (durationDays > 28) storage_duration = '1_3_months';

    const mergedInputs = {
      feed_type: batch.feed_type,
      storage_duration,
      moisture_feel: batch.moisture_feel,
      colour: batch.colour,
      smell: batch.smell,
      ...inputs
    };

    const nutrition = estimateNutrition(mergedInputs);
    
    const visual_score = inputs.visual_score || 70; // Basic mock score logic if not provided directly
    
    const forecast = calculateDecay({
      storage_type: batch.storage_type,
      moisture_feel: batch.moisture_feel,
      opening_freq: batch.opening_freq,
      temperature_c: batch.temperature_c,
      base_score: visual_score
    });

    await db.query('BEGIN');

    const testRes = await db.query(`
      INSERT INTO test_results 
      (batch_id, visual_score, crude_protein_min, crude_protein_max, moisture_min, moisture_max, 
       fiber_ndf_min, fiber_ndf_max, energy_me_min, energy_me_max, aflatoxin_risk, urea_risk, sand_risk, ph_estimate_min, ph_estimate_max, overall_risk_level)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [
      batchId, visual_score, nutrition.crude_protein[0], nutrition.crude_protein[1], nutrition.moisture[0], nutrition.moisture[1],
      nutrition.fiber_ndf[0], nutrition.fiber_ndf[1], nutrition.energy_me[0], nutrition.energy_me[1], nutrition.aflatoxin_risk,
      nutrition.urea_risk, nutrition.sand_risk, nutrition.ph_estimate[0], nutrition.ph_estimate[1],
      nutrition.aflatoxin_risk === 'high' ? 'high' : 'medium' // Simplified overall logic
    ]);

    await db.query(`
      INSERT INTO risk_forecasts (batch_id, base_score, day_7_score, day_15_score, day_30_score, decay_rate, aflatoxin_day7, aflatoxin_day15, aflatoxin_day30)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [batchId, forecast.base_score, forecast.day_7, forecast.day_15, forecast.day_30, forecast.decay_rate, forecast.aflatoxin_day7, forecast.aflatoxin_day15, forecast.aflatoxin_day30]);

    const advisory = generateAdvisory(testRes.rows[0], forecast, mergedInputs);

    await db.query(`
      INSERT INTO advisories (batch_id, feed_decision, feed_days_safe, nutritional_gap, nutritional_action, storage_fix, advisory_mr, advisory_hi, advisory_en)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [batchId, advisory.feed_decision, advisory.feed_days_safe, advisory.nutritional_gap, advisory.nutritional_action, advisory.storage_fix, advisory.advisory_mr, advisory.advisory_hi, advisory.advisory_en]);

    await db.query('COMMIT');

    res.status(201).json(ApiResponse.success({ testResult: testRes.rows[0], forecast, advisory }, 'Test submitted and processed successfully'));
  } catch (error) {
    await db.query('ROLLBACK');
    next(error);
  }
};

const getTestHistory = async (req, res, next) => {
  try {
    const { batchId } = req.params;
    const { userId } = req.user;
    
    const batchRes = await db.query('SELECT id FROM batches WHERE id = $1 AND farmer_id = $2', [batchId, userId]);
    if (batchRes.rows.length === 0) return res.status(404).json(ApiResponse.error('Batch not found'));

    const result = await db.query('SELECT * FROM test_results WHERE batch_id = $1 ORDER BY tested_at DESC', [batchId]);
    res.json(ApiResponse.success(result.rows));
  } catch (error) {
    next(error);
  }
};

module.exports = { submitTestInputs, getTestHistory };
