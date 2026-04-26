const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');
const passport = require('../config/passport');
const {
  register, login, getProfile, updateProfile,
  completeOnboarding, upgradeListing, setActiveMode,
} = require('../controllers/authController');
const { forgotPassword, resetPassword } = require('../controllers/passwordController');
const { protect }                        = require('../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { generateToken }                  = require('../utils/generateToken');

// ── Register ──────────────────────────────────────────────────────────────────
router.post('/register', authLimiter, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], register);

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', authLimiter, [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
], login);

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google`,
  }),
  (req, res) => {
    const token = generateToken(req.user._id);
    const payload = {
      _id:               req.user._id,
      name:              req.user.name,
      email:             req.user.email,
      type:              req.user.type,
      canRent:           req.user.canRent,
      canList:           req.user.canList,
      onboardingComplete: req.user.onboardingComplete,
      avatar:            req.user.avatar,
      createdAt:         req.user.createdAt,
      // Legacy
      role:              req.user.role,
    };
    const user = encodeURIComponent(JSON.stringify(payload));
    res.redirect(`${process.env.CLIENT_URL}/auth/google/success?token=${token}&user=${user}`);
  }
);

// ── Profile ───────────────────────────────────────────────────────────────────
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// ── Onboarding ────────────────────────────────────────────────────────────────
// Called once from /welcome screen: { intent: 'rent' | 'list' }
router.put('/complete-onboarding', protect, [
  body('intent').isIn(['rent', 'list']).withMessage('intent must be rent or list'),
], completeOnboarding);

// ── Upgrade to listing ────────────────────────────────────────────────────────
// Called from dashboard upgrade banner — no body needed
router.put('/upgrade-listing', protect, upgradeListing);

// ── Active mode (UI preference only) ─────────────────────────────────────────
router.put('/active-mode', protect, setActiveMode);

// ── Password reset ────────────────────────────────────────────────────────────
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password',  passwordResetLimiter, resetPassword);

module.exports = router;