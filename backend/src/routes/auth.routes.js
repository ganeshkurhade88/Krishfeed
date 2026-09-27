// src/routes/auth.routes.js
const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const { authLimiter } = require('../middleware/rateLimiter.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { register, login, logout, deleteAccount } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', authLimiter, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().isLength({ min: 10, max: 15 }).withMessage('Valid phone number required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['farmer', 'buyer', 'admin']).withMessage('Invalid role'),
  body('language_pref').optional().isIn(['mr', 'hi', 'en']).withMessage('Invalid language preference'),
  body('consent_given').isBoolean().equals('true').withMessage('Consent must be true')
], validate, register);

router.post('/login', authLimiter, [
  body('phone').trim().notEmpty(),
  body('password').notEmpty()
], validate, login);

router.post('/logout', authenticate, logout);

router.delete('/account', authenticate, deleteAccount);

module.exports = router;
