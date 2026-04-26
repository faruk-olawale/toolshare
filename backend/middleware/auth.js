'use strict';

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ── protect ───────────────────────────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = header.split(' ')[1];

    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET not set');
      return res.status(500).json({ success: false, message: 'Server misconfiguration.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ success: false, message: 'Invalid token.', code: 'TOKEN_INVALID' });
    }

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Account not found.' });
    }
    if (user.suspended) {
      return res.status(403).json({ success: false, message: 'Your account has been suspended. Contact support.', code: 'ACCOUNT_SUSPENDED' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error(`[auth] protect() error on ${req.method} ${req.originalUrl}:`, err.message);
    return res.status(500).json({ success: false, message: 'Authentication check failed.' });
  }
};

// ── authorize ─────────────────────────────────────────────────────────────────
// Usage:
//   authorize('admin')          → type === 'admin'
//   authorize('canList')        → user.canList === true
//   authorize('canRent')        → user.canRent === true
//   authorize('admin','canList')→ admin OR canList (OR logic)
const authorize = (...checks) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }

  const user = req.user;

  const pass = checks.some(check => {
    if (check === 'admin')   return user.type === 'admin' || user.role === 'admin';
    if (check === 'canList') return user.canList === true  || user.role === 'owner' || user.type === 'admin';
    if (check === 'canRent') return user.canRent === true  || user.role === 'renter' || user.type === 'admin';
    // Legacy role checks still work during transition
    if (['owner', 'renter'].includes(check)) return user.role === check || user.type === 'admin';
    return false;
  });

  if (!pass) {
    return res.status(403).json({
      success: false,
      message: `You don't have permission to perform this action.`,
    });
  }

  next();
};

module.exports = { protect, authorize };