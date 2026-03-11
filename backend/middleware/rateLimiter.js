const rateLimit = require('express-rate-limit');

// General API limit — 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth routes — 10 attempts per 15 minutes (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Support tickets — 5 per hour (prevent spam)
const supportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many support tickets submitted, please wait an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Password reset — 3 per hour
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many password reset attempts, please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// KYC upload — 5 per hour
const kycLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many KYC submissions, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { apiLimiter, authLimiter, supportLimiter, passwordResetLimiter, kycLimiter };