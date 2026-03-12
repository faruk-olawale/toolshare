jest.mock('../utils/sendEmail', () => ({ sendEmail: jest.fn() }));

const request  = require('supertest');
const mongoose = require('mongoose');
const app      = require('../app');
const User     = require('../models/User');

let adminToken, userToken;

beforeAll(async () => { await mongoose.connect(process.env.MONGO_URI); });
afterEach(async () => {
  const cols = mongoose.connection.collections;
  for (const key in cols) await cols[key].deleteMany({});
});
afterAll(async () => { await mongoose.connection.close(); });

beforeEach(async () => {
  const admin = await User.create({
    name: 'Admin', email: 'sadmin@test.com', passwordHash: 'adminpass123',
    role: 'admin', verified: true,
  });
  const adminLogin = await request(app).post('/api/auth/login').send({ email: 'sadmin@test.com', password: 'adminpass123' });
  adminToken = adminLogin.body.token;

  const userRes = await request(app).post('/api/auth/register').send({
    name: 'User', email: 'suser@test.com', password: 'password123', role: 'renter',
  });
  userToken = userRes.body.token;
});

const validTicket = {
  name: 'Test User', email: 'test@example.com',
  subject: 'My issue', message: 'I have a problem that needs help',
  category: 'general',
};

describe('Support — Create Ticket', () => {
  it('anyone can submit a support ticket', async () => {
    const res = await request(app).post('/api/support/tickets').send(validTicket);
    expect(res.statusCode).toBe(201);
    expect(res.body.ticket.ticketNumber).toBeDefined();
  });

  it('sends confirmation email on ticket creation', async () => {
    const { sendEmail } = require('../utils/sendEmail');
    await request(app).post('/api/support/tickets').send(validTicket);
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ template: 'ticketCreated' }));
  });

  it('rejects ticket with missing subject', async () => {
    const { subject, ...noSubject } = validTicket;
    const res = await request(app).post('/api/support/tickets').send(noSubject);
    expect(res.statusCode).toBe(400);
  });

  it('rejects ticket with message too short', async () => {
    const res = await request(app).post('/api/support/tickets').send({ ...validTicket, message: 'short' });
    expect(res.statusCode).toBe(400);
  });

  it('rejects ticket with invalid category', async () => {
    const res = await request(app).post('/api/support/tickets').send({ ...validTicket, category: 'hacking' });
    expect(res.statusCode).toBe(400);
  });

  it('rejects ticket with invalid email', async () => {
    const res = await request(app).post('/api/support/tickets').send({ ...validTicket, email: 'notanemail' });
    expect(res.statusCode).toBe(400);
  });
});

describe('Support — Admin Actions', () => {
  let ticketId;
  beforeEach(async () => {
    const res = await request(app).post('/api/support/tickets').send(validTicket);
    ticketId = res.body.ticket._id;
  });

  it('admin can view all tickets', async () => {
    const res = await request(app)
      .get('/api/support/admin/tickets')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.tickets)).toBe(true);
  });

  it('non-admin cannot view all tickets', async () => {
    const res = await request(app)
      .get('/api/support/admin/tickets')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(403);
  });

  it('admin can reply to ticket', async () => {
    const res = await request(app)
      .post(`/api/support/admin/tickets/${ticketId}/reply`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ message: 'We are looking into your issue.' });
    expect(res.statusCode).toBe(200);
  });

  it('rejects reply with empty message', async () => {
    const res = await request(app)
      .post(`/api/support/admin/tickets/${ticketId}/reply`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ message: '' });
    expect(res.statusCode).toBe(400);
  });

  it('admin can update ticket status', async () => {
    const res = await request(app)
      .put(`/api/support/admin/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'resolved' });
    expect(res.statusCode).toBe(200);
  });

  it('rejects invalid ticket status', async () => {
    const res = await request(app)
      .put(`/api/support/admin/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'done' });
    expect(res.statusCode).toBe(400);
  });

  it('admin can delete a ticket', async () => {
    const res = await request(app)
      .delete(`/api/support/admin/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });
});