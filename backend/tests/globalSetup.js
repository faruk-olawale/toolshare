const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.NODE_ENV   = 'test';
  // Store instance so globalTeardown can stop it
  global.__MONGOD__ = mongod;
};