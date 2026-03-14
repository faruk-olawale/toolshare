const rateLimit = require('express-rate-limit');

// Enable limiter only when explicitly turned on (e.g. production env).
// Example:
//   ENABLE_RATE_LIMITER=true  -> limiter active
//   ENABLE_RATE_LIMITER=false -> limiter bypassed
const limiterEnabled = process.env.ENABLE_RATE_LIMITER === 'true' || process.env.NODE_ENV === 'production';

const passThrough = (req, res, next) => next();
const makeLimit = (options) => (limiterEnabled ? rateLimit(options) : passThrough);

const apiLimiter = makeLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = makeLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const supportLimiter = makeLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many support tickets submitted. Please wait an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = makeLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many password reset attempts. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const kycLimiter = makeLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many KYC submissions. Please wait an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { apiLimiter, authLimiter, supportLimiter, passwordResetLimiter, kycLimiter };
