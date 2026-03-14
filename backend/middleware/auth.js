const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { COOKIE_NAME, parseCookies } = require('../utils/authCookie');
const { getJwtSecret } = require('../utils/authSecrets');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      const cookies = parseCookies(req.headers.cookie);
      token = cookies[COOKIE_NAME];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
    }

    if (user.suspended) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.',
        suspended: true,
        reason: user.suspensionReason,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };