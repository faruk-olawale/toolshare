'use strict';

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Mongoose 7+ removed useNewUrlParser and useUnifiedTopology.
    // Passing them causes deprecation warnings on Mongoose 7 and errors on 8.
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`\x1b[32m✅ MongoDB connected: ${conn.connection.host}\x1b[0m`);
  } catch (error) {
    console.error(`\x1b[31m❌ MongoDB connection failed: ${error.message}\x1b[0m`);
    process.exit(1);
  }
};

// Reconnection events — useful for Render's free tier which idles
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected — attempting reconnect...');
});
mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err.message);
});

module.exports = connectDB;