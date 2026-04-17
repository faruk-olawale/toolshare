'use strict';

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ── protect ───────────────────────────────────────────────────────────────────
// Verifies JWT and attaches req.user. Used on all protected routes.
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    // JWT_SECRET missing at runtime → tell developer clearly
    if (!process.env.JWT_SECRET) {
      console.error('\x1b[31m❌ JWT_SECRET is not set in environment variables\x1b[0m');
      return res.status(500).json({
        success: false,
        message: 'Server misconfiguration. Please contact support.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      // Distinguish expired vs malformed — helpful for frontend UX
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please sign in again.',
          code:    'TOKEN_EXPIRED',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please sign in again.',
        code:    'TOKEN_INVALID',
      });
    }

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account not found. It may have been deleted.',
      });
    }

    if (user.suspended) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Contact support.',
        code:    'ACCOUNT_SUSPENDED',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    // Catch Mongoose errors (DB down, timeout, etc.)
    console.error(`\x1b[31m[auth] protect() error on ${req.method} ${req.originalUrl}:\x1b[0m`, error.message);
    return res.status(500).json({
      success: false,
      message: 'Authentication check failed. Please try again.',
    });
  }
};

// ── authorize ─────────────────────────────────────────────────────────────────
// Role-based access control. Must be used AFTER protect().
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    // Defensive: protect() should always run first
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Role '${req.user.role}' is not authorized for this action.`,
    });
  }
  next();
};

module.exports = { protect, authorize };