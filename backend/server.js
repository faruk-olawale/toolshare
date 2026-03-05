const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const connectDB = require('./config/db');
const passport = require('./config/passport');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'https://toolshare-kuv1.vercel.app', process.env.CLIENT_URL].filter(Boolean),
  credentials: true,
}));

app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(session({ secret: process.env.JWT_SECRET || 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => res.status(200).json({ success: true, message: '🔧 ToolShare Africa API is running!' }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tools', require('./routes/toolRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/kyc', require('./routes/kycRoutes'));
app.use('/api/escrow', require('./routes/escrowRoutes'));

app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 ToolShare Africa API running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});