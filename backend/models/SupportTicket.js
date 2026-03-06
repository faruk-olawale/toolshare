const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['user', 'admin'], required: true },
  message: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
});

const supportTicketSchema = new mongoose.Schema({
  ticketNumber: { type: String, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  category: {
    type: String,
    enum: ['general', 'booking', 'payment', 'kyc', 'safety', 'privacy', 'terms', 'dispute', 'other'],
    default: 'general',
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved'],
    default: 'open',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  messages: [messageSchema],
  resolvedAt: { type: Date, default: null },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  source: { type: String, enum: ['contact', 'help_center', 'safety', 'privacy', 'terms'], default: 'contact' },
}, { timestamps: true });

// Auto-generate ticket number before saving
supportTicketSchema.pre('save', async function (next) {
  if (!this.ticketNumber) {
    const count = await mongoose.model('SupportTicket').countDocuments();
    this.ticketNumber = `TSA-${String(count + 1001).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);