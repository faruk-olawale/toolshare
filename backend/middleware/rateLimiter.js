'use strict';

const rateLimit = require('express-rate-limit');

const isTest = process.env.NODE_ENV === 'test';

// Passthrough in test env so Jest doesn't hit limits
const passThrough = (_req, _res, next) => next();

const makeLimit = (options) => {
  if (isTest) return passThrough;

  return rateLimit({
    // express-rate-limit v7+ is Node 22 compatible and uses
    // standardHeaders: 'draft-7' by default. We keep it explicit.
    standardHeaders: 'draft-7',
    legacyHeaders:   false,

    // keyGenerator uses req.ip which works correctly with app.set('trust proxy', 1)
    // set in app.js. Without trust proxy, Render's load balancer IP would be used
    // and ALL users would share one bucket.

    handler: (req, res) => {
      console.warn(`\x1b[33m[RateLimit] ${req.method} ${req.originalUrl} — IP: ${req.ip}\x1b[0m`);
      res.status(429).json({
        success: false,
        message: options.message?.message || 'Too many requests. Please try again later.',
      });
    },

    ...options,
  });
};

// ── API: general limiter (covers all /api/ routes not overridden below) ───────
// 500 req / 15 min per IP — generous enough for admin dashboard polling
// (admin makes 7 parallel requests × 60s refresh = ~7/min, well within limit)
const apiLimiter = makeLimit({
  windowMs: 15 * 60 * 1000,
  max:      500,
  message:  { success: false, message: 'Too many requests. Please try again in 15 minutes.' },
});

// ── Auth: strict limiter to slow down brute force ─────────────────────────────
const authLimiter = makeLimit({
  windowMs: 15 * 60 * 1000,
  max:      15,  // 15 login attempts per 15 min
  message:  { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
});

// ── Support ticket submission ─────────────────────────────────────────────────
const supportLimiter = makeLimit({
  windowMs: 60 * 60 * 1000,
  max:      10, // raised from 5 — admin reads tickets frequently
  message:  { success: false, message: 'Too many requests to support endpoints. Please wait.' },
});

// ── Password reset ────────────────────────────────────────────────────────────
const passwordResetLimiter = makeLimit({
  windowMs: 60 * 60 * 1000,
  max:      5,
  message:  { success: false, message: 'Too many password reset attempts. Try again in an hour.' },
});

// ── KYC submission ────────────────────────────────────────────────────────────
const kycLimiter = makeLimit({
  windowMs: 60 * 60 * 1000,
  max:      10,
  message:  { success: false, message: 'Too many KYC requests. Please wait an hour.' },
});

module.exports = {
  apiLimiter,
  authLimiter,
  supportLimiter,
  passwordResetLimiter,
  kycLimiter,
};