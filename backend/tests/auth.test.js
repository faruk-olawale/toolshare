jest.mock('../utils/sendEmail', () => ({ sendEmail: jest.fn() }));

const request  = require('supertest');
const mongoose = require('mongoose');
const app      = require('../app');

beforeAll(async () => { await mongoose.connect(process.env.MONGO_URI); });
afterEach(async () => {
  const cols = mongoose.connection.collections;
  for (const key in cols) await cols[key].deleteMany({});
});
afterAll(async () => { await mongoose.connection.close(); });

describe('Auth — Register', () => {
  it('registers a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User', email: 'test@example.com', password: 'password123', role: 'renter',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeDefined();
  });

it('rejects duplicate email', async () => {
  const payload = { name: 'User', email: 'duplicate@test.com', password: 'pass123', role: 'renter' };
  await request(app).post('/api/auth/register').send(payload);
  const res = await request(app).post('/api/auth/register').send(payload);

  expect(res.statusCode).toBe(409); // <-- updated
});

  it('rejects missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@x.com' });
    expect(res.statusCode).toBe(400);
  });
});

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
  });

  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com', password: 'wrongpass',
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejects non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com', password: 'password123',
    });
    expect(res.statusCode).toBe(401);
  });
});