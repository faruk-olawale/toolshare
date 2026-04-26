const { validationResult } = require('express-validator');
const User          = require('../models/User');
const { generateToken } = require('../utils/generateToken');
const { sendEmail }     = require('../utils/sendEmail');

// ── Register ──────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const { name, email, password, phone, location } = req.body;

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ success: false, message: 'Email already registered.' });

    // New users: canRent true, canList false, onboarding not complete
    // Role defaults to 'renter' for legacy compat — will be synced by pre-save
    const user = await User.create({
      name, email, passwordHash: password, phone, location,
      type:               'user',
      canRent:            true,
      canList:            false,
      onboardingComplete: false,
      role:               'renter',
    });

    const token = generateToken(user._id);

    sendEmail({
      to:       email,
      subject:  'Welcome to ToolShare Africa! 🔧',
      template: 'welcome',
      data:     { name, role: 'user', loginUrl: process.env.CLIENT_URL },
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Account created!',
      token,
      user:    user.toJSON(),
      // Tell frontend to redirect to onboarding
      redirect: '/welcome',
    });
  } catch (error) { next(error); }
};

// ── Login ─────────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const token = generateToken(user._id);

    // Tell frontend where to send them:
    // - Incomplete onboarding → /welcome
    // - Admin → /admin
    // - Otherwise → /dashboard
    let redirect = '/dashboard';
    if (!user.onboardingComplete) redirect = '/welcome';
    else if (user.type === 'admin' || user.role === 'admin') redirect = '/admin';

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user:     user.toJSON(),
      redirect,
    });
  } catch (error) { next(error); }
};

// ── Get profile ───────────────────────────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, user });
  } catch (error) { next(error); }
};

// ── Update profile ────────────────────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, location } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, location },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, message: 'Profile updated.', user });
  } catch (error) { next(error); }
};

// ── Complete onboarding ───────────────────────────────────────────────────────
// PUT /api/auth/complete-onboarding
// Called from the /welcome page after user picks rent or list.
// intent: 'rent' | 'list'
const completeOnboarding = async (req, res, next) => {
  try {
    const { intent } = req.body;

    if (!['rent', 'list'].includes(intent)) {
      return res.status(400).json({
        success: false,
        message: 'intent must be "rent" or "list".',
      });
    }

    // Admins can't accidentally downgrade via this endpoint
    if (req.user.type === 'admin' || req.user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin accounts cannot use the onboarding flow.',
      });
    }

    const update = {
      onboardingComplete: true,
      canRent:            true,                    // always true
      canList:            intent === 'list',       // only if they chose to list
      role:               intent === 'list' ? 'owner' : 'renter', // legacy sync
    };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: update },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    const redirect = intent === 'list' ? '/kyc' : '/tools';

    res.status(200).json({
      success: true,
      message: intent === 'list'
        ? 'Great! Verify your identity to start listing tools.'
        : 'Welcome! Browse tools available near you.',
      user,
      redirect,
    });
  } catch (error) { next(error); }
};

// ── Upgrade to listing ────────────────────────────────────────────────────────
// PUT /api/auth/upgrade-listing
// Called from the dashboard "Start Listing Tools" CTA.
// No intent needed — this is always an upgrade to canList.
const upgradeListing = async (req, res, next) => {
  try {
    if (req.user.type === 'admin' || req.user.role === 'admin') {
      return res.status(200).json({
        success: true,
        message: 'Admin already has full access.',
        user:    req.user,
      });
    }

    if (req.user.canList) {
      return res.status(200).json({
        success: true,
        message: 'Listing already enabled.',
        user:    req.user,
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { canList: true, role: 'owner' } },
      { new: true }
    ).select('-passwordHash');

    res.status(200).json({
      success: true,
      message: 'Listing enabled! Complete identity verification to publish tools.',
      user,
      redirect: '/kyc',
    });
  } catch (error) { next(error); }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  completeOnboarding,
  upgradeListing,
  setActiveMode,
};

// ── Set active mode ───────────────────────────────────────────────────────────
// PUT /api/auth/active-mode
// Lightweight preference save — does NOT affect capabilities or security.
// Frontend calls this best-effort after localStorage update.
const setActiveMode = async (req, res, next) => {
  try {
    const { mode } = req.body;

    if (!['renter', 'owner'].includes(mode)) {
      return res.status(400).json({
        success: false,
        message: 'mode must be renter or owner.',
      });
    }

    if (
      mode === 'owner' &&
      !req.user.canList &&
      req.user.role !== 'owner' &&
      req.user.type !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'You do not have listing capability.',
      });
    }

    await User.findByIdAndUpdate(req.user._id, { activeMode: mode });

    res.status(200).json({
      success: true,
      message: `Mode set to ${mode}.`,
    });
  } catch (error) {
    next(error);
  }
};