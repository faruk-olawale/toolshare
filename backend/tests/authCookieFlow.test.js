const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterEach(async () => {
  const cols = mongoose.connection.collections;
  for (const key in cols) {
    await cols[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Auth cookie flow integration', () => {
  it('supports login -> profile -> logout using HttpOnly cookie', async () => {
    const registerRes = await request(app).post('/api/auth/register').send({
      name: 'Cookie User',
      email: 'cookie@example.com',
      password: 'password123',
      role: 'renter',
    });

    expect(registerRes.statusCode).toBe(201);
    expect(registerRes.headers['set-cookie']).toBeDefined();

    const agent = request.agent(app);

    const loginRes = await agent.post('/api/auth/login').send({
      email: 'cookie@example.com',
      password: 'password123',
    });

    expect(loginRes.statusCode).toBe(200);
    expect((loginRes.headers['set-cookie'] || []).join(';')).toContain('tsa_token=');

    const profileRes = await agent.get('/api/auth/profile');
    expect(profileRes.statusCode).toBe(200);
    expect(profileRes.body.user.email).toBe('cookie@example.com');

    const logoutRes = await agent.post('/api/auth/logout');
    expect(logoutRes.statusCode).toBe(200);

    const afterLogoutProfile = await agent.get('/api/auth/profile');
    expect(afterLogoutProfile.statusCode).toBe(401);
  });
});
