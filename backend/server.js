const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const logger = require('./utils/logger');
const app = require('./app');

const PORT = process.env.PORT || 5000;


if (typeof connectDB !== 'function') {
  throw new Error('connectDB is not defined. Check backend/config/db.js exports a function.');
}

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    logger.info('server_started', {
      port: PORT,
      storage: 'Cloudinary',
      environment: process.env.NODE_ENV || 'development',
    });

    const { startEscrowExpiryJob } = require('./jobs/escrowExpiry');
    startEscrowExpiryJob();
  });
};

startServer().catch((error) => {
  logger.error('server_start_failed', { error: error.message });
  process.exit(1);
});
