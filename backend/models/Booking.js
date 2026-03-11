const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  toolId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Tool', required: true },
  renterId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ownerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  endDate:   { type: Date, required: true },
  totalAmount: { type: Number, required: true },
  notes: { type: String, default: null },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled', 'disputed', 'written_off'],
    default: 'pending',
  },

  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'partially_released', 'fully_released', 'refunded', 'refund_pending'],
    default: 'unpaid',
  },

  // Deposit / security
  deposit: {
    amount:         { type: Number, default: 0 },
    paid:           { type: Boolean, default: false },
    paidAt:         { type: Date, default: null },
    refunded:       { type: Boolean, default: false },
    refundedAt:     { type: Date, default: null },
    refundRef:      { type: String, default: null },
    forfeited:      { type: Boolean, default: false },
    forfeitReason:  { type: String, default: null },
  },

  // Cancellation
  cancellation: {
    cancelledAt:    { type: Date, default: null },
    cancelledBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cancelledByRole:{ type: String, default: null },
    reason:         { type: String, default: null },
    refundAmount:   { type: Number, default: 0 },
    refundPercent:  { type: Number, default: 0 },
    policy:         { type: String, default: null }, // 'full', 'partial', 'none'
  },

  // Refund tracking
  refund: {
    amount:    { type: Number, default: 0 },
    reference: { type: String, default: null },
    processedAt: { type: Date, default: null },
    reason:    { type: String, default: null },
  },

  // Escrow
  escrow: {
    renterConfirmedReceipt:   { type: Boolean, default: false },
    renterConfirmedReceiptAt: { type: Date, default: null },
    ownerConfirmedReturn:     { type: Boolean, default: false },
    ownerConfirmedReturnAt:   { type: Date, default: null },
    firstPayoutAmount:  { type: Number, default: 0 },
    firstPayoutRef:     { type: String, default: null },
    firstPayoutAt:      { type: Date, default: null },
    secondPayoutAmount: { type: Number, default: 0 },
    secondPayoutRef:    { type: String, default: null },
    secondPayoutAt:     { type: Date, default: null },
  },

  // Dispute
  dispute: {
    active:            { type: Boolean, default: false },
    raisedBy:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    raisedByRole:      { type: String, default: null },
    reason:            { type: String, default: null },
    raisedAt:          { type: Date, default: null },
    escalationLevel:   { type: Number, default: 0 }, // 0=reported, 1=3-day warning, 2=7-day writeoff
    escalatedAt:       { type: Date, default: null },
    writtenOffAt:      { type: Date, default: null },
    resolvedAt:        { type: Date, default: null },
    resolution:        { type: String, default: null },
    resolvedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    outcome:           { type: String, enum: ['tool_recovered', 'written_off', 'deceased', 'other', null], default: null },
  },

  // Owner response deadline (48h from creation)
  expiresAt: { type: Date, default: null },

  // Reminders sent flags
  reminderSent: {
    dayBefore:  { type: Boolean, default: false },
    dayOf:      { type: Boolean, default: false },
    returnDue:  { type: Boolean, default: false },
  },

}, { timestamps: true });

// ── Indexes for common query patterns ──────────────────────────────────────────
bookingSchema.index({ renterId: 1, status: 1, createdAt: -1 });
bookingSchema.index({ ownerId: 1, status: 1, createdAt: -1 });
bookingSchema.index({ toolId: 1, status: 1 });
bookingSchema.index({ status: 1, expiresAt: 1 });          // for expiry cron job
bookingSchema.index({ 'dispute.active': 1, status: 1 });   // for dispute escalation cron

module.exports = mongoose.model('Booking', bookingSchema);