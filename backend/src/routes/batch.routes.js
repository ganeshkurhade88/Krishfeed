// src/routes/batch.routes.js
const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { publicLimiter } = require('../middleware/rateLimiter.middleware');
const { createBatch, getBatches, getBatchById, updateBatchStatus, deleteBatch, getPublicPassport } = require('../controllers/batch.controller');

const router = express.Router();

router.post('/', authenticate, [
  body('feed_type').trim().notEmpty(),
  body('quantity_kg').isNumeric(),
  body('district').trim().notEmpty(),
  body('state').trim().notEmpty(),
  body('storage_type').isIn(['pit','bunker','bag','open','shed']),
  body('date_stored').isISO8601(),
  body('opening_freq').isIn(['daily','every_2_3_days','weekly']),
  body('moisture_feel').isIn(['dry','moist','wet','waterlogged'])
], validate, createBatch);

router.get('/', authenticate, getBatches);

router.get('/:id', authenticate, [
  param('id').isUUID()
], validate, getBatchById);

router.patch('/:id', authenticate, [
  param('id').isUUID(),
  body('status').isIn(['active','sold','recalled','expired','deleted'])
], validate, updateBatchStatus);

router.delete('/:id', authenticate, [
  param('id').isUUID()
], validate, deleteBatch);

router.get('/:id/public', publicLimiter, [
  param('id').isUUID()
], validate, getPublicPassport);

module.exports = router;
