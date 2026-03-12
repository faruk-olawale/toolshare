// Runs before each test file
process.env.NODE_ENV    = 'test';
process.env.CLIENT_URL  = 'http://localhost:5173';
process.env.JWT_SECRET  = 'test-secret-key-for-jest';