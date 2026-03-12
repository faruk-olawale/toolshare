const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Set both — app uses MONGODB_URI, some tests use MONGO_URI
  process.env.MONGO_URI     = uri;
  process.env.MONGODB_URI   = uri;
  process.env.JWT_SECRET    = 'test-secret-key-for-jest';
  process.env.NODE_ENV      = 'test';
  process.env.CLIENT_URL    = 'http://localhost:5173';
  process.env.RESEND_API_KEY = 'test-key'; // prevents real emails

  global.__MONGOD__ = mongod;
};