const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const path       = require('path');
const session    = require('express-session');
const passport   = require('./config/passport');
const { createSessionStore } = require('./utils/sessionStore');
const { getJwtSecret } = require('./utils/authSecrets');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter, authLimiter, supportLimiter, kycLimiter } = require('./middleware/rateLimiter');

const app = express();

const normalizeOrigin = (url = '') => url.trim().replace(/\/$/, '');

// ── Security headers ───────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow Cloudinary images to load
}));

// ── Compression ────────────────────────────────────────────────────────────────
app.use(compression());

// ── CORS — only allow our frontend ────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
]
  .map(normalizeOrigin)
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(normalizeOrigin(origin))) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ── Body parsing ───────────────────────────────────────────────────────────────
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── MongoDB injection sanitization ────────────────────────────────────────────
app.use(mongoSanitize());

// ── Session + Passport (Google OAuth) ─────────────────────────────────────────
const sessionSecret = process.env.SESSION_SECRET || getJwtSecret();

const sessionStore = createSessionStore({
  mongoUri: process.env.MONGODB_URI,
  ttlSeconds: 60 * 60 * 24 * 14,
});

app.use(session({
  secret: sessionSecret || 'dev-session-secret',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 14 * 24 * 60 * 60 * 1000,
  },
}));
app.use(passport.initialize());
app.use(passport.session());

// ── Static uploads ─────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Request logger (structured JSON + correlation ID) ─────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  req.requestId = logger.getRequestId(req);
  res.setHeader('x-request-id', req.requestId);

  res.on('finish', () => {
    logger.info('http_request', {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
    });
  });

  next();
});

// ── Rate limiting ──────────────────────────────────────────────────────────────
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/support/tickets', supportLimiter);
app.use('/api/kyc', kycLimiter);

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/tools',         require('./routes/toolRoutes'));
app.use('/api/bookings',      require('./routes/bookingRoutes'));
app.use('/api/payments',      require('./routes/paymentRoutes'));
app.use('/api/admin',         require('./routes/adminRoutes'));
app.use('/api/kyc',           require('./routes/kycRoutes'));
app.use('/api/escrow',        require('./routes/escrowRoutes'));
app.use('/api/support',       require('./routes/supportRoutes'));
app.use('/api/reviews',       require('./routes/reviewRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// ── 404 ────────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  logger.warn('route_not_found', {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
  });
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

app.use(errorHandler);

module.exports = app;
