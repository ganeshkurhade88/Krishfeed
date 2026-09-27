// src/controllers/admin.controller.js
const ApiResponse = require('../utils/apiResponse');

const getAdminStats = (req, res) => {
  // Purposefully restricted to avoid exposing PII
  res.json(ApiResponse.success({
    message: 'Admin stats will be available here (Aggregate only, no PII).'
  }));
};

module.exports = { getAdminStats };
