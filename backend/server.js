require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const authRoutes = require('./src/routes/authRoutes');
const teamRoutes = require('./src/routes/teamRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const announcementRoutes = require('./src/routes/announcementRoutes');
const submissionRoutes = require('./src/routes/submissionRoutes');
const contactRoutes = require('./src/routes/contactRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// Reflect any request origin. This API is protected by JWT bearer tokens
// (not cookies), so allowing all origins is safe and avoids "Failed to fetch"
// when the frontend is served from a different domain (apex vs www, Vercel
// preview URLs, etc.).
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp({ whitelist: ['amount', 'round'] }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/contact', contactRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is healthy', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server };