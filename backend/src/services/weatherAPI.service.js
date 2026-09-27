// src/services/weatherAPI.service.js
const axios = require('axios');
const logger = require('../utils/logger');

async function getTemperature(lat, lon) {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) return 28; // default if not configured

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    const response = await axios.get(url);
    
    return response.data.main.temp;
  } catch (error) {
    logger.error('Weather API Error', { error: error.message });
    return 28; // Fallback temperature
  }
}

module.exports = { getTemperature };
