// src/controllers/marketplace.controller.js
const db = require('../db');
const ApiResponse = require('../utils/apiResponse');

const createListing = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { batch_id, price_per_kg, min_quantity_kg, available_kg } = req.body;

    // Verify batch ownership and active status
    const batchRes = await db.query('SELECT id FROM batches WHERE id = $1 AND farmer_id = $2 AND status = \'active\'', [batch_id, userId]);
    if (batchRes.rows.length === 0) return res.status(400).json(ApiResponse.error('Batch not eligible for listing'));

    const result = await db.query(`
      INSERT INTO marketplace_listings (batch_id, farmer_id, price_per_kg, min_quantity_kg, available_kg, expires_at)
      VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '30 days')
      RETURNING *
    `, [batch_id, userId, price_per_kg, min_quantity_kg, available_kg]);

    await db.query('UPDATE batches SET is_listed = TRUE WHERE id = $1', [batch_id]);

    res.status(201).json(ApiResponse.success(result.rows[0], 'Listing created successfully'));
  } catch (error) {
    next(error);
  }
};

const getListings = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT 
        m.id, m.batch_id, m.price_per_kg, m.min_quantity_kg, m.available_kg,
        m.listing_status, m.listed_at, m.expires_at,
        b.feed_type, b.district, b.state, b.quantity_kg, b.storage_type, b.date_stored,
        u.name AS farmer_name,
        COALESCE(tr.visual_score, 70) AS quality_score
      FROM marketplace_listings m
      JOIN batches b ON m.batch_id = b.id
      JOIN users u ON m.farmer_id = u.id
      LEFT JOIN test_results tr ON tr.batch_id = b.id
      WHERE m.listing_status = 'active'
        AND (m.expires_at IS NULL OR m.expires_at > NOW())
      ORDER BY quality_score DESC, m.listed_at DESC
    `);
    res.json(ApiResponse.success(result.rows));
  } catch (error) {
    next(error);
  }
};

const updateListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const { listing_status, available_kg, price_per_kg } = req.body;

    const result = await db.query(`
      UPDATE marketplace_listings
      SET listing_status = COALESCE($1, listing_status),
          available_kg = COALESCE($2, available_kg),
          price_per_kg = COALESCE($3, price_per_kg)
      WHERE id = $4 AND farmer_id = $5
      RETURNING *
    `, [listing_status, available_kg, price_per_kg, id, userId]);

    if (result.rows.length === 0) return res.status(404).json(ApiResponse.error('Listing not found'));

    res.json(ApiResponse.success(result.rows[0], 'Listing updated successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = { createListing, getListings, updateListing };
