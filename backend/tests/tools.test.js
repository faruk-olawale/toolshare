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

let ownerToken, ownerId;

beforeAll(async () => { await mongoose.connect(process.env.MONGO_URI); });
afterEach(async () => {
  const cols = mongoose.connection.collections;
  for (const key in cols) await cols[key].deleteMany({});
});
afterAll(async () => { await mongoose.connection.close(); });

beforeEach(async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Owner', email: 'toolowner@test.com', password: 'pass123', role: 'owner',
  });
  ownerToken = res.body.token;
  ownerId    = res.body.user._id;
  await User.findByIdAndUpdate(ownerId, { 'kyc.status': 'approved' });
});

describe('Tools', () => {
  it('blocks tool creation without KYC', async () => {
    const noKycRes = await request(app).post('/api/auth/register').send({
      name: 'No KYC', email: 'nokyc@test.com', password: 'pass123', role: 'owner',
    });
    const res = await request(app)
      .post('/api/tools')
      .set('Authorization', `Bearer ${noKycRes.body.token}`)
      .field('name', 'Test Tool').field('pricePerDay', '5000');
    expect(res.statusCode).toBe(403);
  });

  it('fetches tools list', async () => {
    const res = await request(app).get('/api/tools');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.tools)).toBe(true);
  });

  it('filters tools by category', async () => {
    const res = await request(app).get('/api/tools?category=Construction');
    expect(res.statusCode).toBe(200);
  });

  it('returns 404 for invalid tool id', async () => {
    const res = await request(app).get('/api/tools/000000000000000000000000');
    expect(res.statusCode).toBe(404);
  });
});