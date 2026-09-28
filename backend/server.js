// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./src/utils/logger');
const errorHandler = require('./src/middleware/errorHandler.middleware');
const { startAlertScheduler } = require('./src/services/alertScheduler.service');

const authRoutes = require('./src/routes/auth.routes');
const batchRoutes = require('./src/routes/batch.routes');
const testingRoutes = require('./src/routes/testing.routes');
const advisoryRoutes = require('./src/routes/advisory.routes');
const marketplaceRoutes = require('./src/routes/marketplace.routes');
const traceabilityRoutes = require('./src/routes/traceability.routes');
const alertRoutes = require('./src/routes/alert.routes');
const adminRoutes = require('./src/routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security and middleware
app.use(helmet());
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Start background schedulers
startAlertScheduler();

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/testing', testingRoutes);
app.use('/api/advisory', advisoryRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/traceability', traceabilityRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
