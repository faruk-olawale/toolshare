jest.mock('../utils/sendEmail', () => ({ sendEmail: jest.fn() }));
jest.mock('../utils/sms', () => ({ sendSMS: jest.fn() }));
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
const Tool     = require('../models/Tool');

let adminToken, ownerToken, renterToken, adminId, ownerId, renterId;

beforeAll(async () => { await mongoose.connect(process.env.MONGO_URI); });
afterEach(async () => {
  const cols = mongoose.connection.collections;
  for (const key in cols) await cols[key].deleteMany({});
});
afterAll(async () => { await mongoose.connection.close(); });

beforeEach(async () => {
  const admin = await User.create({
    name: 'Admin', email: 'admin@test.com', passwordHash: 'adminpass123',
    role: 'admin', verified: true,
  });
  adminId = admin._id;
  const adminLogin = await request(app).post('/api/auth/login').send({
    email: 'admin@test.com', password: 'adminpass123',
  });
  adminToken = adminLogin.body.token;

  const ownerRes = await request(app).post('/api/auth/register').send({
    name: 'Owner', email: 'aowner@test.com', password: 'password123', role: 'owner',
  });
  ownerToken = ownerRes.body.token;
  ownerId    = ownerRes.body.user._id;

  const renterRes = await request(app).post('/api/auth/register').send({
    name: 'Renter', email: 'arenter@test.com', password: 'password123', role: 'renter',
  });
  renterToken = renterRes.body.token;
  renterId    = renterRes.body.user._id;
});

// ACCESS CONTROL
describe('Admin - Access Control', () => {
  it('blocks non-admin from admin stats', async () => {
    const res = await request(app).get('/api/admin/stats').set('Authorization', 'Bearer ' + ownerToken);
    expect(res.statusCode).toBe(403);
  });

  it('blocks unauthenticated from admin stats', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.statusCode).toBe(401);
  });

  it('admin can access stats', async () => {
    const res = await request(app).get('/api/admin/stats').set('Authorization', 'Bearer ' + adminToken);
    expect(res.statusCode).toBe(200);
    expect(res.body.stats).toBeDefined();
  });
});

// TOOL VERIFICATION
describe('Admin - Tool Verification', () => {
  var toolId;
  beforeEach(async () => {
    const tool = await Tool.create({
      ownerId: ownerId, name: 'Pending Tool', category: 'Construction',
      description: 'A tool', pricePerDay: 3000, location: 'Lagos',
      adminVerified: false, ownershipDocs: ['/doc.pdf'],
    });
    toolId = tool._id;
  });

  it('admin can get pending tools', async () => {
    const res = await request(app).get('/api/admin/tools/pending').set('Authorization', 'Bearer ' + adminToken);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.tools)).toBe(true);
  });

  it('admin can verify a tool', async () => {
    const res = await request(app)
      .put('/api/admin/tools/' + toolId + '/verify')
      .set('Authorization', 'Bearer ' + adminToken);
    expect(res.statusCode).toBe(200);
    const tool = await Tool.findById(toolId);
    expect(tool.adminVerified).toBe(true);
  });

  it('admin can reject a tool with reason', async () => {
    const res = await request(app)
      .put('/api/admin/tools/' + toolId + '/reject')
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ reason: 'Images are unclear' });
    expect(res.statusCode).toBe(200);
  });

  it('rejects tool rejection without reason', async () => {
    const res = await request(app)
      .put('/api/admin/tools/' + toolId + '/reject')
      .set('Authorization', 'Bearer ' + adminToken)
      .send({});
    expect(res.statusCode).toBe(400);
  });

  it('admin can get all tools with pagination', async () => {
    const res = await request(app)
      .get('/api/admin/tools?page=1&limit=10')
      .set('Authorization', 'Bearer ' + adminToken);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('pages');
  });
});

// USER MANAGEMENT
describe('Admin - User Management', () => {
  it('admin can get all users with pagination', async () => {
    const res = await request(app)
      .get('/api/admin/users?page=1&limit=10')
      .set('Authorization', 'Bearer ' + adminToken);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body).toHaveProperty('total');
  });

  it('admin can suspend a user', async () => {
    const res = await request(app)
      .put('/api/admin/users/' + renterId + '/suspend')
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ reason: 'Repeated policy violations' });
    expect(res.statusCode).toBe(200);
    const user = await User.findById(renterId);
    expect(user.suspended).toBe(true);
  });

  it('rejects suspension without reason', async () => {
    const res = await request(app)
      .put('/api/admin/users/' + renterId + '/suspend')
      .set('Authorization', 'Bearer ' + adminToken)
      .send({});
    expect(res.statusCode).toBe(400);
  });

  it('admin can unsuspend a user', async () => {
    await User.findByIdAndUpdate(renterId, { suspended: true });
    const res = await request(app)
      .put('/api/admin/users/' + renterId + '/unsuspend')
      .set('Authorization', 'Bearer ' + adminToken);
    expect(res.statusCode).toBe(200);
    const user = await User.findById(renterId);
    expect(user.suspended).toBe(false);
  });

  it('admin cannot delete another admin', async () => {
    const res = await request(app)
      .delete('/api/admin/users/' + adminId)
      .set('Authorization', 'Bearer ' + adminToken);
    expect(res.statusCode).toBe(403);
  });

  it('admin can delete a regular user', async () => {
    const res = await request(app)
      .delete('/api/admin/users/' + renterId)
      .set('Authorization', 'Bearer ' + adminToken);
    expect(res.statusCode).toBe(200);
  });

  it('rejects invalid mongo id', async () => {
    const res = await request(app)
      .put('/api/admin/users/notanid/suspend')
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ reason: 'Test' });
    expect(res.statusCode).toBe(400);
  });
});

// BOOKINGS
describe('Admin - Bookings', () => {
  it('admin can get all bookings with pagination', async () => {
    const res = await request(app)
      .get('/api/admin/bookings?page=1&limit=10')
      .set('Authorization', 'Bearer ' + adminToken);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.bookings)).toBe(true);
  });

  it('admin can filter bookings by status', async () => {
    const res = await request(app)
      .get('/api/admin/bookings?status=pending')
      .set('Authorization', 'Bearer ' + adminToken);
    expect(res.statusCode).toBe(200);
  });
});