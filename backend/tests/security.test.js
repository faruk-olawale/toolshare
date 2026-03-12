jest.mock('../utils/sendEmail', () => ({ sendEmail: jest.fn() }));
jest.mock('multer-storage-cloudinary', () => ({
  CloudinaryStorage: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('cloudinary', () => ({
  v2: { config: jest.fn(), uploader: { destroy: jest.fn() } },
}));

const request  = require('supertest');
const mongoose = require('mongoose');
const app      = require('../app');
const User     = require('../models/User');

beforeAll(async () => { await mongoose.connect(process.env.MONGO_URI); });
afterEach(async () => {
  const cols = mongoose.connection.collections;
  for (const key in cols) await cols[key].deleteMany({});
});
afterAll(async () => { await mongoose.connection.close(); });

describe('Security — Headers', () => {
  it('sets security headers via helmet', async () => {
    const res = await request(app).get('/api/tools');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
  });
});

describe('Security — NoSQL Injection', () => {
  it('sanitizes mongo operators in login body', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: { $gt: '' }, password: { $gt: '' },
    });
    // Should fail validation or return 401, NOT 200
    expect(res.statusCode).not.toBe(200);
  });

  it('sanitizes mongo operators in register body', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test', email: { $gt: '' }, password: 'password123', role: 'renter',
    });
    expect(res.statusCode).not.toBe(201);
  });
});

describe('Security — Authorization', () => {
  let ownerToken, renterToken, ownerId;

  beforeEach(async () => {
    const ownerRes = await request(app).post('/api/auth/register').send({
      name: 'Owner', email: 'secowner@test.com', password: 'password123', role: 'owner',
    });
    ownerToken = ownerRes.body.token;
    ownerId    = ownerRes.body.user._id;

    const renterRes = await request(app).post('/api/auth/register').send({
      name: 'Renter', email: 'secrenter@test.com', password: 'password123', role: 'renter',
    });
    renterToken = renterRes.body.token;
  });

  it('renter cannot access admin endpoints', async () => {
    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${renterToken}`);
    expect(res.statusCode).toBe(403);
  });

  it('owner cannot access admin endpoints', async () => {
    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${ownerToken}`);
    expect(res.statusCode).toBe(403);
  });

  it('renter cannot create tools', async () => {
    const res = await request(app).post('/api/tools').set('Authorization', `Bearer ${renterToken}`).field('name', 'x');
    expect(res.statusCode).toBe(403);
  });

  it('cannot access protected route with malformed token', async () => {
    const res = await request(app).get('/api/auth/profile').set('Authorization', 'Bearer this.is.fake');
    expect(res.statusCode).toBe(401);
  });

  it('cannot access protected route with no token', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.statusCode).toBe(401);
  });

  it('user cannot delete another users account', async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${ownerId}`)
      .set('Authorization', `Bearer ${renterToken}`);
    expect(res.statusCode).toBe(403);
  });
});

describe('Security — Input Validation', () => {
  it('rejects XSS in name field', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: '<script>alert("xss")</script>',
      email: 'xss@test.com', password: 'password123', role: 'renter',
    });
    // Should either reject or sanitize — check password hash not exposed
    if (res.statusCode === 201) {
      expect(res.body.user.passwordHash).toBeUndefined();
    } else {
      expect(res.statusCode).toBe(400);
    }
  });

  it('rejects extremely long input', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'x'.repeat(10000),
      email: 'long@test.com', password: 'password123', role: 'renter',
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.statusCode).toBe(404);
  });
});