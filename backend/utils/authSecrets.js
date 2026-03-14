const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET;

  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET (or SESSION_SECRET) must be set in production');
  }

  return secret || 'dev-jwt-secret';
};

module.exports = { getJwtSecret };
