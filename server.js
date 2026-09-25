const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Supabase Postgres pool (lazy — connects on first query)
const { pool } = require('./src/config/db');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://innovators-arena-tau.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // Allow any Vercel preview deployment for this project
    const vercelPreviewRegex = /^https:\/\/innovators-arena-[a-z0-9-]+\.vercel\.app$/;
    
    if (!origin || allowedOrigins.includes(origin) || vercelPreviewRegex.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Verify Supabase Postgres connectivity (non-fatal — pool connects lazily per query)
(async () => {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not set — database queries will fail until configured');
    return;
  }
  try {
    await pool.query('SELECT 1');
    console.log('Supabase Postgres connected successfully');
  } catch (error) {
    console.error('Postgres connection check failed (will retry per query):', error.message);
  }
})();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Innovators Arena 2.0 Backend'
  });
});

// Temporary DB connectivity diagnostic (no secrets exposed)
app.get('/api/debug/db', async (req, res) => {
  try {
    const r = await pool.query('SELECT version()');
    res.json({ success: true, db: r.rows[0].version.slice(0, 80) });
  } catch (e) {
    res.json({ success: false, error: e.message, code: e.code });
  }
});

// API Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/teams', require('./src/routes/teamRoutes'));
app.use('/api/announcements', require('./src/routes/announcementRoutes'));
app.use('/api/payments', require('./src/routes/paymentRoutes'));
app.use('/api/submissions', require('./src/routes/submissionRoutes'));
app.use('/api/contact', require('./src/routes/contactRoutes'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ── Ping self every 5 minutes to keep Render free tier alive ──
const SELF_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
  setInterval(async () => {
    try {
      const res = await fetch(`${SELF_URL}/health`);
      console.log(`[PING] ${new Date().toISOString()} — status: ${res.status}`);
    } catch (err) {
      console.error(`[PING] Failed: ${err.message}`);
    }
  }, 5 * 60 * 1000); // every 5 minutes
  console.log(`Keep-alive pinger started (every 5 min) → ${SELF_URL}/health`);
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;