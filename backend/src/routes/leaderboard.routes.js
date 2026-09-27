// src/routes/leaderboard.routes.js
const express = require('express');
const { query } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const { getDistrictLeaderboard } = require('../controllers/leaderboard.controller');

const router = express.Router();

router.get('/', [
  query('district').trim().notEmpty()
], validate, getDistrictLeaderboard);

module.exports = router;
