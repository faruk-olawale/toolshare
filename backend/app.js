const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const session  = require('express-session');
const passport = require('./config/passport');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Request logger (shows every incoming request in terminal) ─────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const color = res.statusCode >= 500 ? '\x1b[31m'   // red
                : res.statusCode >= 400 ? '\x1b[33m'   // yellow
                : res.statusCode >= 200 ? '\x1b[32m'   // green
                : '\x1b[36m';                           // cyan
    console.log(`${color}${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)\x1b[0m`);
  });
  next();
});

app.use(cors({ origin: '*', credentials: true }));
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(session({ secret: process.env.JWT_SECRET || 'testsecret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/tools',    require('./routes/toolRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/admin',    require('./routes/adminRoutes'));
app.use('/api/kyc',      require('./routes/kycRoutes'));
app.use('/api/escrow',   require('./routes/escrowRoutes'));
app.use('/api/support',        require('./routes/supportRoutes'));
app.use('/api/reviews',        require('./routes/reviewRoutes'));
app.use('/api/notifications',  require('./routes/notificationRoutes'));

app.use((req, res) => {
  console.warn(`\x1b[33m⚠️  404 Not Found: ${req.method} ${req.originalUrl}\x1b[0m`);
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});
app.use(errorHandler);

module.exports = app;