const cron = require('node-cron');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { sendEmail } = require('../utils/sendEmail');
const axios = require('axios');

const PAYSTACK_BASE = 'https://api.paystack.co';
const paystackHeaders = () => ({
  Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  'Content-Type': 'application/json',
});

const PENDING_EXPIRY_HOURS  = 48; // Auto-cancel pending bookings after 48hrs
const RECEIPT_EXPIRY_DAYS   = 3;  // Auto-confirm receipt after 3 days
const RETURN_EXPIRY_DAYS    = 2;  // Auto-confirm return after 2 days past endDate

const runEscrowExpiry = async () => {
  console.log('⏰ Running escrow expiry job...');
  const now = new Date();

  // ── 1. Auto-cancel PENDING bookings older than 48 hours ──────────────────
  try {
    const expiredPending = await Booking.find({
      status: 'pending',
      createdAt: { $lt: new Date(now - PENDING_EXPIRY_HOURS * 60 * 60 * 1000) },
    }).populate('toolId', 'name').populate('renterId', 'name email').populate('ownerId', 'name email');

    for (const booking of expiredPending) {
      booking.status = 'cancelled';
      await booking.save();

      sendEmail({
        to: booking.renterId.email,
        subject: `⏰ Booking Expired — ${booking.toolId?.name}`,
        template: 'bookingExpired',
        data: {
          renterName: booking.renterId.name,
          toolName:   booking.toolId?.name,
          reason:     'The owner did not respond within 48 hours.',
          browseUrl:  process.env.CLIENT_URL + '/tools',
        },
      });

      sendEmail({
        to: booking.ownerId.email,
        subject: `⚠️ Booking Request Expired — ${booking.toolId?.name}`,
        template: 'bookingExpiredOwner',
        data: {
          ownerName:   booking.ownerId.name,
          toolName:    booking.toolId?.name,
          renterName:  booking.renterId.name,
          dashboardUrl: process.env.CLIENT_URL + '/booking-requests',
        },
      });

      console.log(`❌ Pending booking expired: ${booking._id}`);
    }
  } catch (err) {
    console.error('Pending expiry error:', err.message);
  }

  // ── 2. Auto-confirm RECEIPT if renter hasn't confirmed after 3 days ───────
  try {
    const receiptExpiry = new Date(now - RECEIPT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const awaitingReceipt = await Booking.find({
      status: 'approved',
      paymentStatus: 'paid',
      'escrow.renterConfirmedReceipt': false,
      startDate: { $lt: receiptExpiry },
    }).populate('toolId', 'name').populate('renterId', 'name email').populate('ownerId', 'name email bankDetails');

    for (const booking of awaitingReceipt) {
      const Payment_model = require('../models/Payment');
      const payment = await Payment_model.findOne({ bookingId: booking._id, status: 'success' });
      if (!payment) continue;

      booking.escrow.renterConfirmedReceipt = true;
      booking.escrow.renterConfirmedReceiptAt = now;
      booking.escrow.firstPayoutAmount = Math.floor(payment.ownerAmount * 0.5);
      booking.paymentStatus = 'partially_released';
      await booking.save();

      // Release 50% to owner
      if (booking.ownerId.bankDetails?.recipientCode) {
        try {
          await axios.post(`${PAYSTACK_BASE}/transfer`, {
            source: 'balance',
            amount: Math.floor(payment.ownerAmount * 0.5),
            recipient: booking.ownerId.bankDetails.recipientCode,
            reason: `ToolShare auto-release 50% - ${booking.toolId?.name}`,
          }, { headers: paystackHeaders() });
        } catch (e) { console.error('Auto payout failed:', e.message); }
      }

      sendEmail({
        to: booking.renterId.email,
        subject: `⏰ Receipt Auto-Confirmed — ${booking.toolId?.name}`,
        template: 'autoReceiptConfirmed',
        data: { renterName: booking.renterId.name, toolName: booking.toolId?.name, endDate: booking.endDate },
      });

      console.log(`✅ Auto receipt confirmed: ${booking._id}`);
    }
  } catch (err) {
    console.error('Receipt expiry error:', err.message);
  }

  // ── 3. Auto-confirm RETURN if owner hasn't confirmed after 2 days past end ─
  try {
    const returnExpiry = new Date(now - RETURN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const awaitingReturn = await Booking.find({
      status: 'approved',
      paymentStatus: 'partially_released',
      'escrow.renterConfirmedReceipt': true,
      'escrow.ownerConfirmedReturn': false,
      endDate: { $lt: returnExpiry },
    }).populate('toolId', 'name').populate('renterId', 'name email').populate('ownerId', 'name email bankDetails');

    for (const booking of awaitingReturn) {
      const Payment_model = require('../models/Payment');
      const payment = await Payment_model.findOne({ bookingId: booking._id, status: 'success' });
      if (!payment) continue;

      const secondPayout = payment.ownerAmount - booking.escrow.firstPayoutAmount;

      booking.escrow.ownerConfirmedReturn = true;
      booking.escrow.ownerConfirmedReturnAt = now;
      booking.escrow.secondPayoutAmount = secondPayout;
      booking.paymentStatus = 'fully_released';
      booking.status = 'completed';
      await booking.save();

      // Release remaining 50%
      if (booking.ownerId.bankDetails?.recipientCode && secondPayout > 0) {
        try {
          await axios.post(`${PAYSTACK_BASE}/transfer`, {
            source: 'balance',
            amount: secondPayout,
            recipient: booking.ownerId.bankDetails.recipientCode,
            reason: `ToolShare auto final payout - ${booking.toolId?.name}`,
          }, { headers: paystackHeaders() });
        } catch (e) { console.error('Auto final payout failed:', e.message); }
      }

      // Make tool available again
      const Tool = require('../models/Tool');
      await Tool.findByIdAndUpdate(booking.toolId._id, { available: true });

      sendEmail({
        to: booking.ownerId.email,
        subject: `⏰ Return Auto-Confirmed — Final Payout Sent`,
        template: 'autoReturnConfirmed',
        data: { ownerName: booking.ownerId.name, toolName: booking.toolId?.name },
      });

      console.log(`✅ Auto return confirmed: ${booking._id}`);
    }
  } catch (err) {
    console.error('Return expiry error:', err.message);
  }

  console.log('⏰ Escrow expiry job complete.');
};

// Schedule: runs every hour
const startEscrowExpiryJob = () => {
  cron.schedule('0 * * * *', runEscrowExpiry);
  console.log('⏰ Escrow expiry job scheduled (runs every hour)');
};

module.exports = { startEscrowExpiryJob, runEscrowExpiry };