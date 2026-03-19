const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const passport = require('../config/passport');
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const { forgotPassword, resetPassword } = require('../controllers/passwordController');
const { protect } = require('../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { generateToken } = require('../utils/generateToken');

router.post('/register', authLimiter, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn(['owner', 'renter']).withMessage('Role must be owner or renter'),
], register);

router.post('/login', authLimiter, [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
], login);

// ── DEBUG: show env vars at startup ─────────────────────────────────────────
console.log('[OAuth Config]', {
  API_URL:    process.env.API_URL    || '❌ NOT SET',
  CLIENT_URL: process.env.CLIENT_URL || '❌ NOT SET',
  GOOGLE_CLIENT_ID:     process.env.GOOGLE_CLIENT_ID     ? '✅ set' : '❌ NOT SET',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '✅ set' : '❌ NOT SET',
  callbackURL: `${process.env.API_URL || 'http://localhost:5000'}/api/auth/google/callback`,
});

// ── Google OAuth: initiate ───────────────────────────────────────────────────
router.get('/google', (req, res, next) => {
  console.log('[Google OAuth] /google hit — initiating OAuth flow');
  console.log('[Google OAuth] Will redirect to callback:', `${process.env.API_URL || 'http://localhost:5000'}/api/auth/google/callback`);
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// ── Google OAuth: callback ───────────────────────────────────────────────────
router.get('/google/callback',
  (req, res, next) => {
    console.log('[Google OAuth] /google/callback hit');
    console.log('[Google OAuth] query params:', req.query);
    console.log('[Google OAuth] has error?', req.query.error || 'none');
    next();
  },
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google`,
    failWithError: true,
  }),
  (req, res) => {
    console.log('[Google OAuth] ✅ passport.authenticate succeeded');
    console.log('[Google OAuth] user:', req.user ? { id: req.user._id, email: req.user.email } : '❌ NO USER');

    if (!req.user) {
      console.log('[Google OAuth] ❌ No user on req — redirecting to failure');
      return res.redirect(`${process.env.CLIENT_URL}/login?error=google`);
    }

    const token = generateToken(req.user._id);
    console.log('[Google OAuth] token generated:', token ? '✅' : '❌');

    const userPayload = {
      _id:    req.user._id,
      name:   req.user.name,
      email:  req.user.email,
      role:   req.user.role,
      avatar: req.user.avatar,
    };

    const userEncoded = encodeURIComponent(JSON.stringify(userPayload));
    const redirectTo  = `${process.env.CLIENT_URL}/auth/google/success?token=${token}&user=${userEncoded}`;

    console.log('[Google OAuth] redirecting to:', redirectTo.split('?')[0]); // don't log the token
    res.redirect(redirectTo);
  },
  // ── Error handler (failWithError: true means errors land here) ──────────────
  (err, req, res, next) => {
    console.error('[Google OAuth] ❌ Passport error:', err?.message || err);
    console.error('[Google OAuth] Error details:', err);
    res.redirect(`${process.env.CLIENT_URL}/login?error=google`);
  }
);

// ── Debug endpoint: check config without touching Google ─────────────────────
router.get('/google/debug', (req, res) => {
  res.json({
    API_URL:    process.env.API_URL    || '❌ NOT SET — will use localhost fallback',
    CLIENT_URL: process.env.CLIENT_URL || '❌ NOT SET',
    GOOGLE_CLIENT_ID:     process.env.GOOGLE_CLIENT_ID     ? '✅ set' : '❌ NOT SET',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '✅ set' : '❌ NOT SET',
    callbackURL: `${process.env.API_URL || 'http://localhost:5000'}/api/auth/google/callback`,
    passportStrategies: Object.keys(passport._strategies || {}),
  });
});

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password',  passwordResetLimiter, resetPassword);

module.exports = router;