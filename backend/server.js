const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const app = require('./app');

// const app  = require('./app');
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\n🚀 ToolShare Africa API running on port ${PORT}`);
    console.log(`☁️  Storage: Cloudinary`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}\n`);

    const { startEscrowExpiryJob } = require('./jobs/escrowExpiry');
    startEscrowExpiryJob();
  });
};

  startServer().catch((error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});