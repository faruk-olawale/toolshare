const logger = require('./logger');
const MongoSessionStore = require('./mongoSessionStore');

const createSessionStore = ({ mongoUri, ttlSeconds }) => {
  if (!mongoUri) {
    return undefined;
  }

  try {
    // Prefer battle-tested store when available.
    // eslint-disable-next-line global-require
    const MongoStore = require('connect-mongo');

    return MongoStore.create({
      mongoUrl: mongoUri,
      ttl: ttlSeconds,
      autoRemove: 'native',
    });
  } catch (error) {
    logger.warn('connect-mongo unavailable, falling back to custom MongoSessionStore', {
      reason: error.message,
    });

    return new MongoSessionStore({ ttlSeconds });
  }
};

module.exports = { createSessionStore };
