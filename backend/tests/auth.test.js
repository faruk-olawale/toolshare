jest.mock('../utils/sendEmail', () => ({ sendEmail: jest.fn() }));

const request  = require('supertest');
const mongoose = require('mongoose');
const app      = require('../app');
const User     = require('../models/User');
const { sendEmail } = require('../utils/sendEmail');

beforeAll(async () => { await mongoose.connect(process.env.MONGO_URI); });
afterEach(async () => {
  const cols = mongoose.connection.collections;
  for (const key in cols) await cols[key].deleteMany({});
  jest.clearAllMocks();
});
afterAll(async () => { await mongoose.connection.close(); });

// ── REGISTER ──────────────────────────────────────────────────────────────────
describe('Auth — Register', () => {
  const valid = { name: 'Test User', email: 'test@example.com', password: 'password123', role: 'renter' };

  it('registers a new user and returns token', async () => {
    const res = await request(app).post('/api/auth/register').send(valid);
    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.passwordHash).toBeUndefined(); // never expose hash
  });

  it('sends welcome email on register', async () => {
    await request(app).post('/api/auth/register').send(valid);
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ template: 'welcome' }));
  });

  it('rejects duplicate email', async () => {
    await request(app).post('/api/auth/register').send(valid);
    const res = await request(app).post('/api/auth/register').send(valid);
    expect(res.statusCode).toBe(409);
  });

  it('rejects password shorter than 8 characters', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...valid, password: 'short' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/8 characters/i);
  });

  it('rejects invalid email format', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...valid, email: 'notanemail' });
    expect(res.statusCode).toBe(400);
  });

  it('rejects invalid role', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...valid, role: 'superadmin' });
    expect(res.statusCode).toBe(400);
  });

  it('rejects missing name', async () => {
    const { name, ...noName } = valid;
    const res = await request(app).post('/api/auth/register').send(noName);
    expect(res.statusCode).toBe(400);
  });
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
describe('Auth — Login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Login User', email: 'login@example.com', password: 'password123', role: 'renter',
    });
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com', password: 'password123',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com', password: 'wrongpassword',
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejects non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com', password: 'password123',
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejects invalid email format', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'notvalid', password: 'password123',
    });
    expect(res.statusCode).toBe(400);
  });
});

// ── PROFILE ───────────────────────────────────────────────────────────────────
describe('Auth — Profile', () => {
  let token;
  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Profile User', email: 'profile@example.com', password: 'password123', role: 'renter',
    });
    token = res.body.token;
  });

  it('returns profile for authenticated user', async () => {
    const res = await request(app).get('/api/auth/profile').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('profile@example.com');
  });

  it('rejects unauthenticated profile request', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.statusCode).toBe(401);
  });

  it('rejects invalid token', async () => {
    const res = await request(app).get('/api/auth/profile').set('Authorization', 'Bearer faketoken');
    expect(res.statusCode).toBe(401);
  });

  it('updates profile fields', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name', phone: '08012345678', location: 'Abuja' });
    expect(res.statusCode).toBe(200);
    expect(res.body.user.name).toBe('Updated Name');
  });
});

// ── FORGOT / RESET PASSWORD ───────────────────────────────────────────────────
describe('Auth — Forgot/Reset Password', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Reset User', email: 'reset@example.com', password: 'oldpassword', role: 'renter',
    });
  });

  it('returns generic message for known email (no user enumeration)', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'reset@example.com' });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/if an account/i);
  });

  it('returns same generic message for unknown email', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'unknown@example.com' });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/if an account/i);
  });

  it('sends reset email for known user', async () => {
    await request(app).post('/api/auth/forgot-password').send({ email: 'reset@example.com' });
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ template: 'forgotPassword' }));
  });

  it('resets password with valid token', async () => {
    await request(app).post('/api/auth/forgot-password').send({ email: 'reset@example.com' });
    const user = await User.findOne({ email: 'reset@example.com' }).select('+resetPasswordToken +resetPasswordExpires');
    expect(user.resetPasswordToken).toBeDefined();

    // Simulate raw token by bypassing hash — set token directly
    const crypto = require('crypto');
    const rawToken = 'testrawtoken123456789012345678901234';
    const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
    await User.findOneAndUpdate(
      { email: 'reset@example.com' },
      { resetPasswordToken: hashed, resetPasswordExpires: new Date(Date.now() + 30 * 60 * 1000) }
    );

    const res = await request(app).post('/api/auth/reset-password').send({
      token: rawToken, password: 'newpassword123',
    });
    expect(res.statusCode).toBe(200);

    // Verify new password works
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'reset@example.com', password: 'newpassword123',
    });
    expect(loginRes.statusCode).toBe(200);
  });

  it('rejects expired reset token', async () => {
    const crypto = require('crypto');
    const rawToken = 'expiredtoken1234567890123456789012345';
    const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
    await User.findOneAndUpdate(
      { email: 'reset@example.com' },
      { resetPasswordToken: hashed, resetPasswordExpires: new Date(Date.now() - 1000) } // already expired
    );
    const res = await request(app).post('/api/auth/reset-password').send({
      token: rawToken, password: 'newpassword123',
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects reset password shorter than 8 characters', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({
      token: 'sometoken', password: 'short',
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects missing email on forgot password', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({});
    expect(res.statusCode).toBe(400);
  });
});

// ── SUSPENDED USER ────────────────────────────────────────────────────────────
describe('Auth — Suspended user', () => {
  it('blocks login for suspended user', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      name: 'Suspended', email: 'suspended@example.com', password: 'password123', role: 'renter',
    });
    await User.findByIdAndUpdate(reg.body.user._id, { suspended: true, suspensionReason: 'Policy violation' });

    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${reg.body.token}`);
    expect(res.statusCode).toBe(403);
    expect(res.body.suspended).toBe(true);
  });
});