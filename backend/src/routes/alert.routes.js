// src/routes/alert.routes.js
const express = require('express');
const { param } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { getAlerts, markAlertRead, dismissAlert } = require('../controllers/alert.controller');

const router = express.Router();

router.get('/', authenticate, getAlerts);

router.patch('/:id/read', authenticate, [
  param('id').isUUID()
], validate, markAlertRead);

router.patch('/:id/dismiss', authenticate, [
  param('id').isUUID()
], validate, dismissAlert);

module.exports = router;
