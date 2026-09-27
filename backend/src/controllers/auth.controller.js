// src/controllers/auth.controller.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const ApiResponse = require('../utils/apiResponse');
const sanitize = require('../utils/sanitize');

const register = async (req, res, next) => {
  try {
    const { name, phone, email, password, role, language_pref, district, state, consent_given } = req.body;

    if (!consent_given) {
      return res.status(400).json(ApiResponse.error('Consent must be given to register.'));
    }

    const checkUser = await db.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json(ApiResponse.error('Phone number already registered.'));
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    await db.query('BEGIN');
    
    const result = await db.query(`
      INSERT INTO users (name, phone, email, password_hash, role, language_pref, district, state, consent_given, consent_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING id, name, phone, role, language_pref, district, state
    `, [sanitize(name), sanitize(phone), email ? sanitize(email) : null, password_hash, role || 'farmer', language_pref || 'mr', sanitize(district), sanitize(state), true]);
    
    const user = result.rows[0];

    await db.query(`
      INSERT INTO consent_log (user_id, consent_type, consent_given, ip_address, user_agent)
      VALUES ($1, 'registration', true, $2, $3)
    `, [user.id, req.ip, req.headers['user-agent']]);

    await db.query('COMMIT');

    res.status(201).json(ApiResponse.success(user, 'Registration successful'));
  } catch (error) {
    await db.query('ROLLBACK');
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    const result = await db.query('SELECT * FROM users WHERE phone = $1 AND data_erasure_requested = FALSE', [sanitize(phone)]);
    if (result.rows.length === 0) {
      return res.status(400).json(ApiResponse.error('Invalid credentials'));
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json(ApiResponse.error('Invalid credentials'));
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const userData = { id: user.id, name: user.name, role: user.role, language_pref: user.language_pref };
    res.json(ApiResponse.success({ token, user: userData }, 'Login successful'));
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  res.clearCookie('refreshToken');
  res.json(ApiResponse.success(null, 'Logout successful'));
};

const deleteAccount = async (req, res, next) => {
  try {
    const { userId } = req.user;
    
    await db.query(`
      UPDATE users 
      SET data_erasure_requested = TRUE, 
          name = 'Anonymized', 
          phone = gen_random_uuid()::text, 
          email = NULL,
          is_verified = FALSE
      WHERE id = $1
    `, [userId]);

    res.clearCookie('refreshToken');
    res.json(ApiResponse.success(null, 'Account data erasure requested successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, deleteAccount };
