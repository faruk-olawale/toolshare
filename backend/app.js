'use strict';

const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const compression  = require('compression');
const path         = require('path');
const session      = require('express-session');
const passport     = require('./config/passport');
const errorHandler = require('./middleware/errorHandler');
const {
  apiLimiter,
  authLimiter,
  supportLimiter,
  kycLimiter,
} = require('./middleware/rateLimiter');

const app = express();

// ── Trust Render's reverse proxy (needed for rate-limit IP detection) ─────────
app.set('trust proxy', 1);

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Cloudinary images
}));

// ── Compression ───────────────────────────────────────────────────────────────
app.use(compression());

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Postman / mobile / curl
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
// Webhook raw body MUST come before express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── MongoDB injection sanitization (Node 22 safe) ────────────────────────────
//
// REMOVED: express-mongo-sanitize
// WHY: In Node 18+, req.query is a getter-only property on
// IncomingMessage.prototype. express-mongo-sanitize does:
//   req.query = sanitize(req.query)   ← assignment throws TypeError on Node 22
// This crashed EVERY route before any handler ran → all 500 errors.
//
// REPLACEMENT: Sanitize req.body and req.params by deleting $-prefixed keys.
// For req.query, mutate individual values in-place (never reassign the object).
//
app.use((req, _res, next) => {
  const strip = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        strip(obj[key]);
      }
    }
  };

  // body and params are own properties — safe to mutate/delete
  strip(req.body);
  strip(req.params);

  // query is a prototype getter in Node 22 — mutate values in-place only
  if (req.query && typeof req.query === 'object') {
    const clean = (val) => {
      if (typeof val === 'string') return val.replace(/[$.]/g, '');
      if (Array.isArray(val))     return val.map(clean);
      if (val && typeof val === 'object') {
        for (const k of Object.keys(val)) val[k] = clean(val[k]);
      }
      return val;
    };
    try {
      for (const key of Object.keys(req.query)) {
        req.query[key] = clean(req.query[key]);
      }
    } catch (_) { /* if even value mutation fails, skip gracefully */ }
  }

  next();
});

// ── Session (Passport OAuth only — API auth uses JWT) ─────────────────────────
app.use(session({
  secret:            process.env.JWT_SECRET || 'toolshare-session-fallback',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    secure:   process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge:   10 * 60 * 1000, // 10 min — only needed for OAuth redirect
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
}));
app.use(passport.initialize());
app.use(passport.session());

// ── Static files ──────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Request logger ────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms    = Date.now() - start;
    const s     = res.statusCode;
    const color = s >= 500 ? '\x1b[31m' : s >= 400 ? '\x1b[33m' : '\x1b[32m';
    console.log(`${color}${req.method} ${req.originalUrl} → ${s} (${ms}ms)\x1b[0m`);
  });
  next();
});

// ── Health check (no auth, no rate limit) ────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({
  success: true,
  message: '🔧 ToolShare Africa API is healthy',
  node:    process.version,
  env:     process.env.NODE_ENV || 'development',
  time:    new Date().toISOString(),
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api/auth',    authLimiter);
app.use('/api/kyc',     kycLimiter);
app.use('/api/support', supportLimiter);
app.use('/api/',        apiLimiter);   // General limiter for everything else

// ── Routes ────────────────────────────────────────────────────────────────────
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
// app.use('/api/messages',      require('./routes/messageRoutes'));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;