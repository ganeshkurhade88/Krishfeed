// src/middleware/errorHandler.middleware.js
const logger = require('../utils/logger');
const ApiResponse = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled Error', { error: err.message, stack: err.stack, path: req.path });
  
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json(ApiResponse.error(err.message, err.stack));
  }
  
  return res.status(500).json(ApiResponse.error('Internal Server Error'));
};

module.exports = errorHandler;
