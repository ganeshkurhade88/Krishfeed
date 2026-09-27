// src/middleware/validate.middleware.js
const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(ApiResponse.error('Validation failed', errors.array()));
  }
  next();
};

module.exports = validate;
