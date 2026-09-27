// src/routes/advisory.routes.js
const express = require('express');
const { param } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { getAdvisory } = require('../controllers/advisory.controller');

const router = express.Router();

router.get('/:batchId', authenticate, [
  param('batchId').isUUID()
], validate, getAdvisory);

module.exports = router;
