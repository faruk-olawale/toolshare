jest.mock('../utils/sendEmail', () => ({ sendEmail: jest.fn() }));
jest.mock('multer-storage-cloudinary', () => ({
  CloudinaryStorage: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('cloudinary', () => ({
  v2: { config: jest.fn(), uploader: { destroy: jest.fn() } },
}));

const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../app');
const User = require('../models/User');
const Tool = require('../models/Tool');

let ownerToken;
let renterToken;
let ownerId;
let renterId;
let toolId;

function getDates() {
  const start = new Date();
  start.setDate(start.getDate() + 1);

  const end = new Date();
  end.setDate(end.getDate() + 3);

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    await collections[key].deleteMany({});
  }

  ownerToken = null;
  renterToken = null;
  ownerId = null;
  renterId = null;
  toolId = null;
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  // Register owner
  const ownerRes = await request(app).post('/api/auth/register').send({
    name: 'Owner',
    email: 'owner@test.com',
    password: 'pass123',
    role: 'owner',
  });

  ownerToken = ownerRes.body.token;
  ownerId = ownerRes.body.user._id;

  await User.findByIdAndUpdate(ownerId, {
    'kyc.status': 'approved',
  });

  // Register renter
  const renterRes = await request(app).post('/api/auth/register').send({
    name: 'Renter',
    email: 'renter@test.com',
    password: 'pass123',
    role: 'renter',
  });

  renterToken = renterRes.body.token;
  renterId = renterRes.body.user._id;

  await User.findByIdAndUpdate(renterId, {
    'kyc.status': 'approved',
  });

  // Create tool
  const tool = await Tool.create({
    ownerId,
    name: 'Booking Test Tool',
    category: 'Construction',
    description: 'Test tool',
    pricePerDay: 5000,
    location: 'Lagos',
    available: true,
    adminVerified: true,
    ownershipDocs: ['/doc.pdf'],
    coordinates: {
      type: 'Point',
      coordinates: [3.3792, 6.5244],
    },
  });

  toolId = tool._id;
});

describe('Bookings', () => {

  it('renter can create a booking', async () => {
    const { startDate, endDate } = getDates();

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${renterToken}`)
      .send({
        toolId,
        startDate,
        endDate,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.booking).toBeDefined();
    expect(res.body.booking.status).toBe('pending');
  });

  it('owner cannot book their own tool', async () => {
    const { startDate, endDate } = getDates();

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        toolId,
        startDate,
        endDate,
      });

    expect(res.statusCode).toBe(403);
  });

  it('owner can approve a booking', async () => {
    const { startDate, endDate } = getDates();

    const create = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${renterToken}`)
      .send({
        toolId,
        startDate,
        endDate,
      });

    const bookingId = create.body.booking._id;

    const res = await request(app)
      .put(`/api/bookings/${bookingId}/approve`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.booking.status).toBe('approved');
  });

  it('renter can view their bookings', async () => {
    const { startDate, endDate } = getDates();

    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${renterToken}`)
      .send({
        toolId,
        startDate,
        endDate,
      });

    const res = await request(app)
      .get('/api/bookings/user')
      .set('Authorization', `Bearer ${renterToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.bookings)).toBe(true);
  });

  it('rejects booking without authentication', async () => {
    const { startDate, endDate } = getDates();

    const res = await request(app)
      .post('/api/bookings')
      .send({
        toolId,
        startDate,
        endDate,
      });

    expect(res.statusCode).toBe(401);
  });

});