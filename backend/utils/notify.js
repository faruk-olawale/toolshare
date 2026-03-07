const Notification = require('../models/Notification');

/**
 * Create an in-app notification for a user
 * @param {Object} opts
 * @param {string} opts.userId
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {string} opts.type
 * @param {string} [opts.link]
 * @param {Object} [opts.meta]
 */
const notify = async ({ userId, title, message, type = 'system', link = null, meta = {} }) => {
  try {
    await Notification.create({ userId, title, message, type, link, meta });
  } catch (err) {
    console.error('notify error:', err.message);
  }
};

module.exports = notify;