// ============================================
// BLAZESTRIKE BACKEND — server.js
// ============================================
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { initSocketHandlers } = require('./services/socketService');
const logger = require('./utils/logger');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const tournamentRoutes = require('./routes/tournaments');
const walletRoutes = require('./routes/wallet');
const coinRoutes = require('./routes/coins');
const clanRoutes = require('./routes/clans');
const bountyRoutes = require('./routes/bounty');
const predictionRoutes = require('./routes/predictions');
const adminRoutes = require('./routes/admin');
const webhookRoutes = require('./routes/webhooks');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Make io accessible to routes
app.set('io', io);

// ============================================
// MIDDLEWARE
// ============================================
app.use(helmet());
app.use(cors({ origin: '*' }));

// Raw body for Razorpay webhooks
app.use('/api/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests, try again later' }
});
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many OTP requests' }
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// ============================================
// ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/coins', coinRoutes);
app.use('/api/clans', clanRoutes);
app.use('/api/bounty', bountyRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhookRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'BlazeStrike', version: '1.0.0' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    await connectRedis();
    initSocketHandlers(io);

    // Start cron jobs
    require('./services/cronService');

    server.listen(PORT, () => {
      logger.info(`🔥 BlazeStrike server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, io };
