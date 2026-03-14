const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('./authSecrets');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = { generateToken };