// src/routes/testing.routes.js
const express = require('express');
const { param } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { testingLimiter } = require('../middleware/rateLimiter.middleware');
const { submitTestInputs, getTestHistory } = require('../controllers/testing.controller');

const router = express.Router();

router.post('/:batchId', authenticate, testingLimiter, [
  param('batchId').isUUID()
], validate, submitTestInputs);

router.get('/:batchId', authenticate, [
  param('batchId').isUUID()
], validate, getTestHistory);

module.exports = router;
