const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  toolId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool', required: true },
  renterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalAmount: { type: Number, required: true },
  notes: { type: String, default: null },

  // Booking status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled', 'disputed'],
    default: 'pending',
  },

  // Payment status
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'partially_released', 'fully_released', 'refunded'],
    default: 'unpaid',
  },

  // Escrow confirmation
  escrow: {
    // Step 1: Renter confirms tool received
    renterConfirmedReceipt: { type: Boolean, default: false },
    renterConfirmedReceiptAt: { type: Date, default: null },

    // Step 2: Owner confirms tool returned
    ownerConfirmedReturn: { type: Boolean, default: false },
    ownerConfirmedReturnAt: { type: Date, default: null },

    // Payout tracking
    firstPayoutAmount: { type: Number, default: 0 },   // 50% to owner on receipt
    firstPayoutRef: { type: String, default: null },
    firstPayoutAt: { type: Date, default: null },

    secondPayoutAmount: { type: Number, default: 0 },  // 50% to owner on return
    secondPayoutRef: { type: String, default: null },
    secondPayoutAt: { type: Date, default: null },
  },

  // Dispute
  dispute: {
    active: { type: Boolean, default: false },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    raisedByRole: { type: String, default: null },
    reason: { type: String, default: null },
    raisedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    resolution: { type: String, default: null },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },

}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);