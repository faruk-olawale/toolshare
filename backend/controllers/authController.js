const { validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');
const { sendEmail } = require('../utils/sendEmail');
const { setAuthCookie, clearAuthCookie } = require('../utils/authCookie');

// @desc    Register
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const { name, email, password, phone, location, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ success: false, message: 'Email already registered.' });

    const user = await User.create({ name, email, passwordHash: password, phone, location, role });
    const token = generateToken(user._id);
    setAuthCookie(res, token);

    // Welcome email
    sendEmail({
      to: email,
      subject: 'Welcome to ToolShare Africa! 🔧',
      template: 'welcome',
      data: { name, role, loginUrl: process.env.CLIENT_URL },
    });

    res.status(201).json({ success: true, message: 'Registration successful!', token, user });
  } catch (error) { next(error); }
};

// @desc    Login
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const token = generateToken(user._id);
    setAuthCookie(res, token);
    res.status(200).json({ success: true, message: 'Login successful.', token, user: user.toJSON() });
  } catch (error) { next(error); }
};

// @desc    Google OAuth callback — create/find user and return JWT
const googleAuthCallback = async (req, res) => {
  try {
    const token = generateToken(req.user._id);
    setAuthCookie(res, token);
    res.redirect(`${process.env.CLIENT_URL}/auth/google/success`);
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
  }
};


// @desc    Logout
const logout = async (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

// @desc    Get profile
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, user });
  } catch (error) { next(error); }
};

// @desc    Update profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, location } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, phone, location }, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: 'Profile updated.', user });
  } catch (error) { next(error); }
};

module.exports = { register, login, logout, googleAuthCallback, getProfile, updateProfile };