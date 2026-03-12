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
const Booking  = require('../models/Booking');

let ownerToken, renterToken, ownerId, renterId, toolId, bookingId;

beforeAll(async () => { await mongoose.connect(process.env.MONGO_URI); });
afterEach(async () => {
  const cols = mongoose.connection.collections;
  for (const key in cols) await cols[key].deleteMany({});
});
afterAll(async () => { await mongoose.connection.close(); });

beforeEach(async () => {
  const ownerRes = await request(app).post('/api/auth/register').send({
    name: 'Owner', email: 'rowner@test.com', password: 'password123', role: 'owner',
  });
  ownerToken = ownerRes.body.token;
  ownerId    = ownerRes.body.user._id;

  const renterRes = await request(app).post('/api/auth/register').send({
    name: 'Renter', email: 'rrenter@test.com', password: 'password123', role: 'renter',
  });
  renterToken = renterRes.body.token;
  renterId    = renterRes.body.user._id;

  const tool = await Tool.create({
    ownerId, name: 'Review Test Tool', category: 'Construction',
    description: 'Test', pricePerDay: 5000, location: 'Lagos',
    adminVerified: true, ownershipDocs: ['/doc.pdf'],
  });
  toolId = tool._id;

  const booking = await Booking.create({
    toolId, renterId, ownerId,
    startDate: new Date('2024-01-01'), endDate: new Date('2024-01-03'),
    totalAmount: 10000, status: 'completed', paymentStatus: 'fully_released',
  });
  bookingId = booking._id;
});

describe('Reviews', () => {
  it('renter can submit a review after completed booking', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${renterToken}`)
      .send({
        bookingId, overallRating: 5,
        ratings: { professionalism: 5, toolCondition: 4, communication: 5 },
        comment: 'Great experience!',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.review.overallRating).toBe(5);
  });

  it('prevents duplicate review from same user', async () => {
    const payload = { bookingId, overallRating: 5, ratings: { professionalism: 5, toolCondition: 4, communication: 5 } };
    await request(app).post('/api/reviews').set('Authorization', `Bearer ${renterToken}`).send(payload);
    const res = await request(app).post('/api/reviews').set('Authorization', `Bearer ${renterToken}`).send(payload);
    expect(res.statusCode).toBe(400);
  });

  it('owner can also review the renter', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        bookingId, overallRating: 4,
        ratings: { punctuality: 4, toolCare: 5, communication: 4 },
      });
    expect(res.statusCode).toBe(201);
  });

  it('returns tool reviews', async () => {
    await request(app).post('/api/reviews').set('Authorization', `Bearer ${renterToken}`)
      .send({ bookingId, overallRating: 5, ratings: { professionalism: 5, toolCondition: 5, communication: 5 } });
    const res = await request(app).get(`/api/reviews/tool/${toolId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBeGreaterThan(0);
  });

  it('blocks review on non-completed booking', async () => {
    const pending = await Booking.create({
      toolId, renterId, ownerId,
      startDate: new Date(), endDate: new Date(),
      totalAmount: 5000, status: 'pending',
    });
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${renterToken}`)
      .send({ bookingId: pending._id, overallRating: 3, ratings: {} });
    expect(res.statusCode).toBe(400);
  });
});