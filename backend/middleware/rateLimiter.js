const rateLimit = require('express-rate-limit');

// Disable rate limiting in test environment
const isTest = process.env.NODE_ENV === 'test';
const passThrough = (req, res, next) => next();
const makeLimit = (options) => isTest ? passThrough : rateLimit(options);

// ── General API limiter ───────────────────────────────────────────────────────
// Raised from 100 → 500 per 15 min per IP.
// The admin dashboard alone fires 7 parallel requests on mount.
// With React StrictMode double-invoking effects in dev that's 14 immediately.
// 30s auto-refresh adds ~7 requests every 30s = ~14/min for an active admin.
// 500 / 15min = ~33/min headroom — safe for a single active user session.
const apiLimiter = makeLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 500,
  message: { success: false, message: 'Too many requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for authenticated admin users on read routes
    // (they legitimately need more requests due to dashboard polling)
    return req.user?.role === 'admin' && req.method === 'GET';
  },
});

// ── Auth limiter — strict, protects login/register ────────────────────────────
const authLimiter = makeLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Support ticket submission ─────────────────────────────────────────────────
const supportLimiter = makeLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many support tickets submitted. Please wait an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Password reset ────────────────────────────────────────────────────────────
const passwordResetLimiter = makeLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many password reset attempts. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── KYC submission ────────────────────────────────────────────────────────────
const kycLimiter = makeLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many KYC submissions. Please wait an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { apiLimiter, authLimiter, supportLimiter, passwordResetLimiter, kycLimiter };