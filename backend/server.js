const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
connectDB();

const app  = require('./app');
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 ToolShare Africa API running on port ${PORT}`);
  console.log(`☁️  Storage: Cloudinary`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}\n`);

  const { startEscrowExpiryJob } = require('./jobs/escrowExpiry');
  startEscrowExpiryJob();
});