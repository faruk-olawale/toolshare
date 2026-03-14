const mongoose = require('mongoose');
const session = require('express-session');

const sessionSchema = new mongoose.Schema(
  {
    sid: { type: String, required: true, unique: true, index: true },
    data: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { collection: 'sessions' }
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const SessionModel = mongoose.models.Session || mongoose.model('Session', sessionSchema);

class MongoSessionStore extends session.Store {
  constructor(options = {}) {
    super();
    this.ttlSeconds = options.ttlSeconds || 60 * 60 * 24 * 14;
  }

  get(sid, callback) {
    SessionModel.findOne({ sid })
      .lean()
      .then((record) => {
        if (!record) return callback(null, null);
        if (record.expiresAt <= new Date()) return this.destroy(sid, () => callback(null, null));

        try {
          return callback(null, JSON.parse(record.data));
        } catch {
          return this.destroy(sid, () => callback(null, null));
        }
      })
      .catch((error) => callback(error));
  }

  set(sid, sessionData, callback) {
    const expiresAt = sessionData?.cookie?.expires
      ? new Date(sessionData.cookie.expires)
      : new Date(Date.now() + this.ttlSeconds * 1000);

    SessionModel.findOneAndUpdate(
      { sid },
      { sid, data: JSON.stringify(sessionData), expiresAt },
      { upsert: true, setDefaultsOnInsert: true }
    )
      .then(() => callback?.())
      .catch((error) => callback?.(error));
  }

  destroy(sid, callback) {
    SessionModel.deleteOne({ sid })
      .then(() => callback?.())
      .catch((error) => callback?.(error));
  }

  touch(sid, sessionData, callback) {
    const expiresAt = sessionData?.cookie?.expires
      ? new Date(sessionData.cookie.expires)
      : new Date(Date.now() + this.ttlSeconds * 1000);

    SessionModel.updateOne({ sid }, { expiresAt })
      .then(() => callback?.())
      .catch((error) => callback?.(error));
  }
}

module.exports = MongoSessionStore;
