// src/routes/admin.routes.js
const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { getAdminStats } = require('../controllers/admin.controller');

const router = express.Router();

router.get('/stats', authenticate, authorize(['admin']), getAdminStats);

module.exports = router;
