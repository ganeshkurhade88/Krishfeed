// src/middleware/rateLimiter.middleware.js
const rateLimit = require('express-rate-limit');
const ApiResponse = require('../utils/apiResponse');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: ApiResponse.error('Too many authentication attempts, please try again later.')
});

const testingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: ApiResponse.error('Too many testing requests, please try again later.')
});

const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: ApiResponse.error('Too many requests, please try again later.')
});

module.exports = {
  authLimiter,
  testingLimiter,
  publicLimiter
};
