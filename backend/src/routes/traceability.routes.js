// src/routes/traceability.routes.js
const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { getBuyerChain, submitIssueReport } = require('../controllers/traceability.controller');

const router = express.Router();

router.get('/:batchId', authenticate, [
  param('batchId').isUUID()
], validate, getBuyerChain);

router.post('/reports', authenticate, [
  body('batch_id').isUUID(),
  body('report_type').trim().notEmpty(),
  body('report_description').trim().notEmpty()
], validate, submitIssueReport);

module.exports = router;
