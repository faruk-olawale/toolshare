'use strict';

// ── Load env vars FIRST — before any other require ───────────────────────────
require('dotenv').config();

const http       = require('http');
const mongoose   = require('mongoose');
const app        = require('./app');

// ── Validate critical env vars at startup ─────────────────────────────────────
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`\x1b[31m❌ Missing required env vars: ${missing.join(', ')}\x1b[0m`);
  console.error('   Add them in Render → Environment, then redeploy.');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

// ── Connect to MongoDB then start server ──────────────────────────────────────
async function start() {
  try {
    // Mongoose 7+ removed useNewUrlParser / useUnifiedTopology — don't pass them
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`\x1b[32m✅ MongoDB connected: ${mongoose.connection.host}\x1b[0m`);
  } catch (err) {
    console.error(`\x1b[31m❌ MongoDB connection failed: ${err.message}\x1b[0m`);
    process.exit(1);
  }

  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`\x1b[32m🚀 ToolShare Africa API running on port ${PORT}\x1b[0m`);
    console.log(`   Node.js ${process.version} | ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   MongoDB: ${mongoose.connection.host}`);

    // Start background jobs AFTER server is ready
    try {
      const { startEscrowExpiryJob } = require('./jobs/escrowExpiry');
      startEscrowExpiryJob();
    } catch (err) {
      console.warn('⚠️  escrowExpiry job failed to start:', err.message);
    }
  });

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  const shutdown = (signal) => {
    console.log(`\n${signal} received — shutting down gracefully`);
    server.close(async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  // ── Catch unhandled promise rejections ────────────────────────────────────
  process.on('unhandledRejection', (reason, promise) => {
    console.error('\x1b[31m❌ Unhandled Rejection:\x1b[0m', reason);
    // Don't exit — log and continue (Render will restart on crash anyway)
  });

  process.on('uncaughtException', (err) => {
    console.error('\x1b[31m❌ Uncaught Exception:\x1b[0m', err.message);
    console.error(err.stack);
    process.exit(1); // Uncaught exceptions leave the app in unknown state
  });
}

start();