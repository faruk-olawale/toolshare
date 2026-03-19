const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const passport = require('../config/passport');
const { register, login, googleAuthCallback, getProfile, updateProfile } = require('../controllers/authController');
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

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth routes
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login?error=google` }),
  (req, res) => {
    const token = generateToken(req.user._id);
    const user  = encodeURIComponent(JSON.stringify({
      _id:    req.user._id,
      name:   req.user.name,
      email:  req.user.email,
      role:   req.user.role,
      avatar: req.user.avatar,
    }));
    res.redirect(`${process.env.CLIENT_URL}/auth/google/success?token=${token}&user=${user}`);
  }
);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Forgot / Reset password
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password',  passwordResetLimiter, resetPassword);

module.exports = router;