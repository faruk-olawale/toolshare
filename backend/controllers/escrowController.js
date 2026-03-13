const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { sendEmail } = require('../utils/sendEmail');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const PAYSTACK_BASE = 'https://api.paystack.co';
const paystackHeaders = () => ({
  Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  'Content-Type': 'application/json',
});

const fmt = (date) => new Date(date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

// Helper: send payout to owner
const sendPayout = async (amount, recipientCode, reason) => {
  const ref = `TSA-ESC-${uuidv4().split('-')[0].toUpperCase()}-${Date.now()}`;
  await axios.post(`${PAYSTACK_BASE}/transfer`, {
    source: 'balance',
    amount, // in kobo
    recipient: recipientCode,
    reason,
    reference: ref,
  }, { headers: paystackHeaders() });
  return ref;
};

// ── STEP 1: Renter confirms tool received ────────────────────────────────────
// POST /api/escrow/:bookingId/confirm-receipt
const confirmReceipt = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('toolId', 'name')
      .populate('renterId', 'name email')
      .populate('ownerId', 'name email phone bankDetails');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.renterId._id.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Only the renter can confirm receipt.' });
    if (booking.paymentStatus !== 'paid')
      return res.status(400).json({ success: false, message: 'Booking must be paid first.' });
    if (booking.escrow.renterConfirmedReceipt)
      return res.status(400).json({ success: false, message: 'Receipt already confirmed.' });
    if (booking.dispute.active)
      return res.status(400).json({ success: false, message: 'Cannot confirm while dispute is active.' });

    // Calculate 50% of owner's share (90% of total)
    const payment = await Payment.findOne({ bookingId: booking._id, status: 'success' });
    if (!payment) return res.status(400).json({ success: false, message: 'Payment record not found.' });

    const firstPayoutAmount = Math.floor(payment.ownerAmount * 0.5); // 50% of owner's 90%

    // Update escrow status
    booking.escrow.renterConfirmedReceipt = true;
    booking.escrow.renterConfirmedReceiptAt = new Date();
    booking.escrow.firstPayoutAmount = firstPayoutAmount;
    booking.paymentStatus = 'partially_released';
    await booking.save();

    // Send 50% to owner if bank details exist
    let payoutRef = null;
    if (booking.ownerId.bankDetails?.recipientCode) {
      try {
        payoutRef = await sendPayout(firstPayoutAmount, booking.ownerId.bankDetails.recipientCode, `ToolShare 50% payout - ${booking.toolId.name}`);
        booking.escrow.firstPayoutRef = payoutRef;
        booking.escrow.firstPayoutAt = new Date();
        await booking.save();

        // Email owner
        sendEmail({
          to: booking.ownerId.email,
          subject: '💰 50% Payout Released — Tool Received by Renter',
          template: 'escrowFirstPayout',
          data: {
            ownerName: booking.ownerId.name,
            toolName: booking.toolId.name,
            amount: firstPayoutAmount / 100,
            renterName: booking.renterId.name,
            reference: payoutRef,
          },
        });
      } catch (err) {
        console.error('First payout failed:', err.message);
      }
    }

    // Email renter confirmation
    sendEmail({
      to: booking.renterId.email,
      subject: `✅ Receipt Confirmed — ${booking.toolId.name}`,
      template: 'escrowReceiptConfirmed',
      data: {
        renterName: booking.renterId.name,
        toolName: booking.toolId.name,
        ownerPhone: booking.ownerId.phone,
        endDate: fmt(booking.endDate),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Receipt confirmed! 50% has been released to the owner.',
      booking,
    });
  } catch (error) { next(error); }
};

// ── STEP 2: Owner confirms tool returned ─────────────────────────────────────
// POST /api/escrow/:bookingId/confirm-return
const confirmReturn = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('toolId', 'name')
      .populate('renterId', 'name email')
      .populate('ownerId', 'name email bankDetails');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.ownerId._id.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Only the owner can confirm return.' });
    if (!booking.escrow.renterConfirmedReceipt)
      return res.status(400).json({ success: false, message: 'Renter must confirm receipt first.' });
    if (booking.escrow.ownerConfirmedReturn)
      return res.status(400).json({ success: false, message: 'Return already confirmed.' });
    if (booking.dispute.active)
      return res.status(400).json({ success: false, message: 'Cannot confirm while dispute is active.' });

    const payment = await Payment.findOne({ bookingId: booking._id, status: 'success' });
    if (!payment) return res.status(400).json({ success: false, message: 'Payment record not found.' });

    const secondPayoutAmount = payment.ownerAmount - booking.escrow.firstPayoutAmount; // remaining 50%

    // Update escrow
    booking.escrow.ownerConfirmedReturn = true;
    booking.escrow.ownerConfirmedReturnAt = new Date();
    booking.escrow.secondPayoutAmount = secondPayoutAmount;
    booking.paymentStatus = 'fully_released';
    booking.status = 'completed';
    await booking.save();

    // Send remaining 50% to owner
    let payoutRef = null;
    if (booking.ownerId.bankDetails?.recipientCode) {
      try {
        payoutRef = await sendPayout(secondPayoutAmount, booking.ownerId.bankDetails.recipientCode, `ToolShare final payout - ${booking.toolId.name}`);
        booking.escrow.secondPayoutRef = payoutRef;
        booking.escrow.secondPayoutAt = new Date();
        await booking.save();

        sendEmail({
          to: booking.ownerId.email,
          subject: '💰 Final Payout Released — Rental Complete!',
          template: 'escrowFinalPayout',
          data: {
            ownerName: booking.ownerId.name,
            toolName: booking.toolId.name,
            amount: secondPayoutAmount / 100,
            totalEarned: payment.ownerAmount / 100,
            reference: payoutRef,
          },
        });
      } catch (err) {
        console.error('Final payout failed:', err.message);
      }
    }

    // Email renter
    sendEmail({
      to: booking.renterId.email,
      subject: `✅ Rental Complete — ${booking.toolId.name}`,
      template: 'escrowRentalComplete',
      data: {
        renterName: booking.renterId.name,
        toolName: booking.toolId.name,
      },
    });

    // Make tool available again
    const Tool = require('../models/Tool');
    await Tool.findByIdAndUpdate(booking.toolId._id, { available: true });

    res.status(200).json({
      success: true,
      message: 'Return confirmed! Final payout sent to owner. Rental complete.',
      booking,
    });
  } catch (error) { next(error); }
};

// ── RAISE DISPUTE ─────────────────────────────────────────────────────────────
// POST /api/escrow/:bookingId/dispute
const raiseDispute = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Please describe the issue.' });

    const booking = await Booking.findById(req.params.bookingId)
      .populate('toolId', 'name')
      .populate('renterId', 'name email')
      .populate('ownerId', 'name email');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const isRenter = booking.renterId._id.toString() === req.user._id.toString();
    const isOwner = booking.ownerId._id.toString() === req.user._id.toString();
    if (!isRenter && !isOwner) return res.status(403).json({ success: false, message: 'Not authorized.' });
    if (booking.dispute.active) return res.status(400).json({ success: false, message: 'Dispute already active.' });
    if (booking.paymentStatus !== 'paid' && booking.paymentStatus !== 'partially_released')
      return res.status(400).json({ success: false, message: 'No active payment to dispute.' });

    booking.dispute = {
      active: true,
      raisedBy: req.user._id,
      raisedByRole: isRenter ? 'renter' : 'owner',
      reason,
      raisedAt: new Date(),
    };
    booking.status = 'disputed';
    await booking.save();

    // Email admin
    sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `🚨 Dispute Raised — ${booking.toolId.name}`,
      template: 'disputeRaised',
      data: {
        raisedBy: req.user.name,
        raisedByRole: isRenter ? 'renter' : 'owner',
        toolName: booking.toolId.name,
        reason,
        bookingId: booking._id,
        renterName: booking.renterId.name,
        ownerName: booking.ownerId.name,
        adminUrl: `${process.env.CLIENT_URL}/admin`,
      },
    });

    // Email other party
    const otherParty = isRenter ? booking.ownerId : booking.renterId;
    sendEmail({
      to: otherParty.email,
      subject: `⚠️ Dispute Raised on Your Booking — ${booking.toolId.name}`,
      template: 'disputeNotification',
      data: {
        name: otherParty.name,
        toolName: booking.toolId.name,
        reason,
        raisedByRole: isRenter ? 'renter' : 'owner',
      },
    });

    res.status(200).json({ success: true, message: 'Dispute raised. Admin will review within 24 hours.', booking });
  } catch (error) { next(error); }
};

// ── ADMIN: RESOLVE DISPUTE ────────────────────────────────────────────────────
// PUT /api/escrow/:bookingId/resolve
const resolveDispute = async (req, res, next) => {
  try {
    const { resolution, action } = req.body;
    // action: 'refund_renter' | 'release_owner' | 'split'

    if (!resolution || !action)
      return res.status(400).json({ success: false, message: 'Resolution and action required.' });

    const booking = await Booking.findById(req.params.bookingId)
      .populate('toolId', 'name')
      .populate('renterId', 'name email')
      .populate('ownerId', 'name email bankDetails');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (!booking.dispute.active) return res.status(400).json({ success: false, message: 'No active dispute.' });

    const payment = await Payment.findOne({ bookingId: booking._id, status: 'success' });

    // Calculate remaining unreleased amount
    const released = booking.escrow.firstPayoutAmount || 0;
    const remaining = payment.ownerAmount - released;

    if (action === 'release_owner' && booking.ownerId.bankDetails?.recipientCode) {
      // Release remaining funds to owner
      const ref = await sendPayout(remaining, booking.ownerId.bankDetails.recipientCode, `ToolShare dispute resolved - owner`);
      booking.escrow.secondPayoutRef = ref;
      booking.escrow.secondPayoutAt = new Date();
      booking.paymentStatus = 'fully_released';

      sendEmail({
        to: booking.ownerId.email,
        subject: '✅ Dispute Resolved — Funds Released to You',
        template: 'disputeResolved',
        data: { name: booking.ownerId.name, toolName: booking.toolId.name, resolution, favour: 'you' },
      });
      sendEmail({
        to: booking.renterId.email,
        subject: `Dispute Resolved — ${booking.toolId.name}`,
        template: 'disputeResolved',
        data: { name: booking.renterId.name, toolName: booking.toolId.name, resolution, favour: 'owner' },
      });
    } else if (action === 'refund_renter') {
      // Mark as refunded — manual Paystack refund
      booking.paymentStatus = 'refunded';
      sendEmail({
        to: booking.renterId.email,
        subject: '✅ Dispute Resolved — Refund Approved',
        template: 'disputeResolved',
        data: { name: booking.renterId.name, toolName: booking.toolId.name, resolution, favour: 'you' },
      });
      sendEmail({
        to: booking.ownerId.email,
        subject: `Dispute Resolved — ${booking.toolId.name}`,
        template: 'disputeResolved',
        data: { name: booking.ownerId.name, toolName: booking.toolId.name, resolution, favour: 'renter' },
      });
    }

    booking.dispute.active = false;
    booking.dispute.resolution = resolution;
    booking.dispute.resolvedAt = new Date();
    booking.dispute.resolvedBy = req.user._id;
    booking.status = action === 'refund_renter' ? 'cancelled' : 'completed';
    await booking.save();

    res.status(200).json({ success: true, message: 'Dispute resolved.', booking });
  } catch (error) { next(error); }
};

// ── GET ESCROW STATUS ─────────────────────────────────────────────────────────
// GET /api/escrow/:bookingId/status
const getEscrowStatus = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('toolId', 'name images')
      .populate('renterId', 'name')
      .populate('ownerId', 'name');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const isParty = [
      booking.renterId._id.toString(),
      booking.ownerId._id.toString(),
    ].includes(req.user._id.toString());
    if (!isParty && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized.' });

    res.status(200).json({ success: true, booking });
  } catch (error) { next(error); }
};

module.exports = { confirmReceipt, confirmReturn, raiseDispute, resolveDispute, getEscrowStatus };