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
const Tool     = require('../models/Tool');

let ownerToken, renterToken, ownerId;

beforeAll(async () => { await mongoose.connect(process.env.MONGO_URI); });
afterEach(async () => {
  const cols = mongoose.connection.collections;
  for (const key in cols) await cols[key].deleteMany({});
});
afterAll(async () => { await mongoose.connection.close(); });

beforeEach(async () => {
  const ownerRes = await request(app).post('/api/auth/register').send({
    name: 'Owner', email: 'toolowner@test.com', password: 'password123', role: 'owner',
  });
  ownerToken = ownerRes.body.token;
  ownerId    = ownerRes.body.user._id;
  await User.findByIdAndUpdate(ownerId, { 'kyc.status': 'approved' });

  const renterRes = await request(app).post('/api/auth/register').send({
    name: 'Renter', email: 'toolrenter@test.com', password: 'password123', role: 'renter',
  });
  renterToken = renterRes.body.token;
});

// BROWSE
describe('Tools - Browse', () => {
  it('returns tools list', async () => {
    const res = await request(app).get('/api/tools');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.tools)).toBe(true);
  });

  it('paginates results', async () => {
    const res = await request(app).get('/api/tools?page=1&limit=5');
    expect(res.statusCode).toBe(200);
    expect(res.body.currentPage || res.body.page).toBe(1);
    expect(res.body).toHaveProperty('pages');
    expect(res.body).toHaveProperty('total');
  });

  it('filters by category', async () => {
    const res = await request(app).get('/api/tools?category=Construction');
    expect(res.statusCode).toBe(200);
  });

  it('returns 400 for invalid mongo id', async () => {
    const res = await request(app).get('/api/tools/notanid');
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 for valid but non-existent tool id', async () => {
    const res = await request(app).get('/api/tools/000000000000000000000000');
    expect(res.statusCode).toBe(404);
  });
});

// CREATE
describe('Tools - Create', () => {
  it('blocks tool creation without auth', async () => {
    const res = await request(app).post('/api/tools').field('name', 'Test').field('pricePerDay', '5000');
    expect(res.statusCode).toBe(401);
  });

  it('blocks renter from creating tools', async () => {
    const res = await request(app)
      .post('/api/tools')
      .set('Authorization', 'Bearer ' + renterToken)
      .field('name', 'Test Tool');
    expect(res.statusCode).toBe(403);
  });

  it('blocks tool creation without KYC approval', async () => {
    const noKycRes = await request(app).post('/api/auth/register').send({
      name: 'No KYC', email: 'nokyc@test.com', password: 'password123', role: 'owner',
    });
    const res = await request(app)
      .post('/api/tools')
      .set('Authorization', 'Bearer ' + noKycRes.body.token)
      .field('name', 'Test Tool').field('pricePerDay', '5000');
    expect([400, 403]).toContain(res.statusCode);
  });

  it('rejects tool with missing required fields', async () => {
    const res = await request(app)
      .post('/api/tools')
      .set('Authorization', 'Bearer ' + ownerToken)
      .field('name', 'Test Tool');
    expect(res.statusCode).toBe(400);
  });

  it('rejects invalid category', async () => {
    const res = await request(app)
      .post('/api/tools')
      .set('Authorization', 'Bearer ' + ownerToken)
      .field('name', 'Test Tool')
      .field('category', 'InvalidCategory')
      .field('description', 'A test tool')
      .field('pricePerDay', '5000')
      .field('location', 'Lagos');
    expect(res.statusCode).toBe(400);
  });

  it('rejects negative price', async () => {
    const res = await request(app)
      .post('/api/tools')
      .set('Authorization', 'Bearer ' + ownerToken)
      .field('name', 'Test Tool')
      .field('category', 'Construction')
      .field('description', 'A test tool')
      .field('pricePerDay', '-100')
      .field('location', 'Lagos');
    expect(res.statusCode).toBe(400);
  });
});

// UPDATE / DELETE
describe('Tools - Update and Delete', () => {
  var toolId;
  beforeEach(async () => {
    var tool = await Tool.create({
      ownerId: ownerId, name: 'My Tool', category: 'Construction',
      description: 'Test tool', pricePerDay: 5000, location: 'Lagos',
      adminVerified: true, ownershipDocs: ['/doc.pdf'],
    });
    toolId = tool._id;
  });

  it('owner can update their tool', async () => {
    const res = await request(app)
      .put('/api/tools/' + toolId)
      .set('Authorization', 'Bearer ' + ownerToken)
      .field('name', 'Updated Tool Name')
      .field('pricePerDay', '5000');
    expect(res.statusCode).toBe(200);
    expect(res.body.tool.name).toBe('Updated Tool Name');
  });

  it('renter cannot update a tool', async () => {
    const res = await request(app)
      .put('/api/tools/' + toolId)
      .set('Authorization', 'Bearer ' + renterToken)
      .field('name', 'Hacked Name')
      .field('pricePerDay', '5000');
    expect(res.statusCode).toBe(403);
  });

  it('owner can delete their tool', async () => {
    const res = await request(app)
      .delete('/api/tools/' + toolId)
      .set('Authorization', 'Bearer ' + ownerToken);
    expect(res.statusCode).toBe(200);
  });

  it('renter cannot delete a tool', async () => {
    const res = await request(app)
      .delete('/api/tools/' + toolId)
      .set('Authorization', 'Bearer ' + renterToken);
    expect(res.statusCode).toBe(403);
  });

  it('rejects invalid mongo id on update', async () => {
    const res = await request(app)
      .put('/api/tools/notanid')
      .set('Authorization', 'Bearer ' + ownerToken)
      .field('name', 'Test')
      .field('pricePerDay', '5000');
    expect(res.statusCode).toBe(400);
  });
});