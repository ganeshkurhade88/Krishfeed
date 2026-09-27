// src/db/migrate.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./index');
const logger = require('../utils/logger');

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  
  try {
    const files = fs.readdirSync(migrationsDir).sort();
    
    for (const file of files) {
      if (file.endsWith('.sql')) {
        logger.info(`Running migration: ${file}`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        await pool.query(sql);
        logger.info(`Successfully ran migration: ${file}`);
      }
    }
    
    logger.info('All migrations completed successfully.');
  } catch (error) {
    logger.error('Migration failed', { error: error.message });
  } finally {
    await pool.end();
  }
}

runMigrations();
