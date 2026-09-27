// src/routes/marketplace.routes.js
const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { createListing, getListings, updateListing } = require('../controllers/marketplace.controller');

const router = express.Router();

router.post('/', authenticate, [
  body('batch_id').isUUID(),
  body('price_per_kg').isNumeric(),
  body('min_quantity_kg').isNumeric(),
  body('available_kg').isNumeric()
], validate, createListing);

router.get('/', getListings);

router.patch('/:id', authenticate, [
  param('id').isUUID(),
  body('listing_status').optional().isIn(['active','sold','expired','recalled','removed']),
  body('available_kg').optional().isNumeric(),
  body('price_per_kg').optional().isNumeric()
], validate, updateListing);

module.exports = router;
