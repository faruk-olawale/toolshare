jest.mock('../utils/sendEmail', () => ({ sendEmail: jest.fn() }));
jest.mock('../utils/sms',       () => ({ sendSMS:   jest.fn() }));
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
const Booking  = require('../models/Booking');

let ownerToken, renterToken, ownerId, renterId, toolId;

beforeAll(async () => { await mongoose.connect(process.env.MONGO_URI); });
afterEach(async () => {
  const cols = mongoose.connection.collections;
  for (const key in cols) await cols[key].deleteMany({});
});
afterAll(async () => { await mongoose.connection.close(); });

beforeEach(async () => {
  const ownerRes = await request(app).post('/api/auth/register').send({
    name: 'Owner', email: 'bowner@test.com', password: 'password123', role: 'owner',
  });
  ownerToken = ownerRes.body.token;
  ownerId    = ownerRes.body.user._id;
  await User.findByIdAndUpdate(ownerId, { 'kyc.status': 'approved' });

  const renterRes = await request(app).post('/api/auth/register').send({
    name: 'Renter', email: 'brenter@test.com', password: 'password123', role: 'renter',
  });
  renterToken = renterRes.body.token;
  renterId    = renterRes.body.user._id;
  await User.findByIdAndUpdate(renterId, { 'kyc.status': 'approved' });

  const tool = await Tool.create({
    ownerId, name: 'Booking Test Tool', category: 'Construction',
    description: 'Test', pricePerDay: 5000, location: 'Lagos',
    adminVerified: true, available: true, ownershipDocs: ['/doc.pdf'],
  });
  toolId = tool._id;
});

const futureDate = (daysFromNow) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
};

// ── CREATE BOOKING ────────────────────────────────────────────────────────────
describe('Bookings - Create', () => {
  it('renter can create a booking', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', 'Bearer ' + renterToken)
      .send({ toolId, startDate: futureDate(2), endDate: futureDate(5) });
    expect(res.statusCode).toBe(201);
    expect(res.body.booking.status).toBe('pending');
  });

  it('calculates total amount correctly', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', 'Bearer ' + renterToken)
      .send({ toolId, startDate: futureDate(2), endDate: futureDate(4) });
    expect(res.statusCode).toBe(201);
    expect(res.body.booking.totalAmount).toBe(10000);
  });

  it('blocks booking without auth', async () => {
    const res = await request(app).post('/api/bookings')
      .send({ toolId, startDate: futureDate(2), endDate: futureDate(5) });
    expect(res.statusCode).toBe(401);
  });

  it('owner cannot book their own tool', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', 'Bearer ' + ownerToken)
      .send({ toolId, startDate: futureDate(2), endDate: futureDate(5) });
    expect([400, 403]).toContain(res.statusCode);
  });

  it('rejects end date before start date', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', 'Bearer ' + renterToken)
      .send({ toolId, startDate: futureDate(5), endDate: futureDate(2) });
    expect(res.statusCode).toBe(400);
  });

  it('rejects past start date', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', 'Bearer ' + renterToken)
      .send({ toolId, startDate: yesterday.toISOString(), endDate: futureDate(5) });
    expect(res.statusCode).toBe(400);
  });

  it('rejects invalid toolId', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', 'Bearer ' + renterToken)
      .send({ toolId: 'notanid', startDate: futureDate(2), endDate: futureDate(5) });
    expect(res.statusCode).toBe(400);
  });

  it('rejects booking on unavailable tool', async () => {
    await Tool.findByIdAndUpdate(toolId, { available: false });
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', 'Bearer ' + renterToken)
      .send({ toolId, startDate: futureDate(2), endDate: futureDate(5) });
    expect(res.statusCode).toBe(400);
  });

  it('rejects notes over 500 characters', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', 'Bearer ' + renterToken)
      .send({ toolId, startDate: futureDate(2), endDate: futureDate(5), notes: 'x'.repeat(501) });
    expect(res.statusCode).toBe(400);
  });
});

// ── APPROVE / REJECT ──────────────────────────────────────────────────────────
describe('Bookings - Approve and Reject', () => {
  let bookingId;
  beforeEach(async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', 'Bearer ' + renterToken)
      .send({ toolId, startDate: futureDate(2), endDate: futureDate(5) });
    bookingId = res.body.booking._id;
  });

  it('owner can approve booking', async () => {
    const res = await request(app)
      .put('/api/bookings/' + bookingId + '/approve')
      .set('Authorization', 'Bearer ' + ownerToken);
    expect(res.statusCode).toBe(200);
    expect(res.body.booking.status).toBe('approved');
  });

  it('renter cannot approve booking', async () => {
    const res = await request(app)
      .put('/api/bookings/' + bookingId + '/approve')
      .set('Authorization', 'Bearer ' + renterToken);
    expect(res.statusCode).toBe(403);
  });

  it('owner can reject booking', async () => {
    const res = await request(app)
      .put('/api/bookings/' + bookingId + '/reject')
      .set('Authorization', 'Bearer ' + ownerToken);
    expect(res.statusCode).toBe(200);
    expect(res.body.booking.status).toBe('rejected');
  });

  it('cannot approve already rejected booking', async () => {
    await request(app).put('/api/bookings/' + bookingId + '/reject').set('Authorization', 'Bearer ' + ownerToken);
    const res = await request(app).put('/api/bookings/' + bookingId + '/approve').set('Authorization', 'Bearer ' + ownerToken);
    expect(res.statusCode).toBe(400);
  });

  it('rejects invalid booking id', async () => {
    const res = await request(app)
      .put('/api/bookings/notanid/approve')
      .set('Authorization', 'Bearer ' + ownerToken);
    expect(res.statusCode).toBe(400);
  });
});

// ── CANCEL ────────────────────────────────────────────────────────────────────
describe('Bookings - Cancel', () => {
  let bookingId;
  beforeEach(async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', 'Bearer ' + renterToken)
      .send({ toolId, startDate: futureDate(10), endDate: futureDate(13) });
    bookingId = res.body.booking._id;
  });

  it('renter can cancel their booking', async () => {
    const res = await request(app)
      .put('/api/bookings/' + bookingId + '/cancel')
      .set('Authorization', 'Bearer ' + renterToken)
      .send({ reason: 'Change of plans' });
    expect(res.statusCode).toBe(200);
    expect(res.body.booking.status).toBe('cancelled');
  });

  it('unauthenticated user cannot cancel', async () => {
    const res = await request(app).put('/api/bookings/' + bookingId + '/cancel');
    expect(res.statusCode).toBe(401);
  });
});

// ── VIEW ──────────────────────────────────────────────────────────────────────
describe('Bookings - View', () => {
  it('renter can view their bookings', async () => {
    const res = await request(app)
      .get('/api/bookings/my-bookings')
      .set('Authorization', 'Bearer ' + renterToken);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.bookings)).toBe(true);
    expect(res.body.total || res.body.count).toBeDefined();
  });

  it('owner can view their booking requests', async () => {
    const res = await request(app)
      .get('/api/bookings/owner-bookings')
      .set('Authorization', 'Bearer ' + ownerToken);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.bookings)).toBe(true);
  });

  it('unauthenticated user cannot view bookings', async () => {
    const res = await request(app).get('/api/bookings/my-bookings');
    expect(res.statusCode).toBe(401);
  });
});