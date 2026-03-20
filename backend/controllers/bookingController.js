const { validationResult } = require('express-validator');
const Booking  = require('../models/Booking');
const Tool     = require('../models/Tool');
const User     = require('../models/User');   // ✅ moved to top level
const Payment  = require('../models/Payment');
const { sendEmail } = require('../utils/sendEmail');
const { sendSMS }   = require('../utils/sms');
const notify        = require('../utils/notify');
const { getCancellationPolicy, calculateDepositAmount } = require('../utils/cancellationPolicy');

const fmt = (date) => new Date(date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

// ─── Notify helper (email + sms + in-app) ────────────────────────────────────
const notifyAll = async ({ user, inApp, email, sms }) => {
  if (inApp) { try { await notify(inApp); } catch (_) {} }
  if (email && user?.email) { try { await sendEmail({ to: user.email, ...email }); } catch (_) {} }
  if (sms && user?.phone) { try { await sendSMS({ to: user.phone, message: sms }); } catch (_) {} }
};

// ─── CREATE BOOKING ───────────────────────────────────────────────────────────
const createBooking = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const { toolId, startDate, endDate, notes } = req.body;
    const tool = await Tool.findById(toolId);
    if (!tool)               return res.status(404).json({ success: false, message: 'Tool not found.' });
    if (!tool.available)     return res.status(400).json({ success: false, message: 'This tool is currently unavailable.' });
    if (!tool.adminVerified) return res.status(400).json({ success: false, message: 'This tool is pending admin verification.' });
    if (tool.ownerId.toString() === req.user._id.toString())
      return res.status(400).json({ success: false, message: 'You cannot book your own tool.' });

    const start = new Date(startDate);
    const end   = new Date(endDate);
    if (end <= start) return res.status(400).json({ success: false, message: 'End date must be after start date.' });

    // ✅ FIX: Compare against start of today in Nigeria time (UTC+1)
    // Subtract 1hr grace to avoid rejecting same-day bookings due to UTC offset
    const todayNigeria = new Date();
    todayNigeria.setHours(todayNigeria.getHours() - 1); // allow 1hr grace
    todayNigeria.setHours(0, 0, 0, 0);
    if (start < todayNigeria)
      return res.status(400).json({ success: false, message: 'Start date cannot be in the past.' });

    // Check for conflicts
    const conflict = await Booking.findOne({
      toolId,
      status: { $in: ['approved', 'pending'] },
      $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }],
    });
    if (conflict) return res.status(409).json({ success: false, message: 'Tool already booked for selected dates.' });

    const days          = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalAmount   = days * tool.pricePerDay;
    const depositAmount = calculateDepositAmount(totalAmount);
    const expiresAt     = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const booking = await Booking.create({
      toolId, renterId: req.user._id, ownerId: tool.ownerId,
      startDate: start, endDate: end, totalAmount, notes, expiresAt,
      deposit: { amount: depositAmount },
    });

    await booking.populate([
      { path: 'toolId',   select: 'name category images pricePerDay location' },
      { path: 'renterId', select: 'name email phone' },
    ]);

    const owner = await User.findById(tool.ownerId);

    // Notify owner
    await notifyAll({
      user: owner,
      inApp: {
        userId: tool.ownerId,
        title: '📥 New Booking Request',
        message: `${req.user.name} wants to rent "${tool.name}" from ${fmt(start)} to ${fmt(end)}.`,
        type: 'booking_new',
        link: '/booking-requests',
        meta: { bookingId: booking._id },
      },
      email: {
        subject: `📋 New booking request for ${tool.name}`,
        template: 'bookingRequest',
        data: {
          ownerName: owner.name, renterName: req.user.name, toolName: tool.name,
          startDate: fmt(start), endDate: fmt(end), totalAmount,
          dashboardUrl: `${process.env.CLIENT_URL}/booking-requests`,
        },
      },
      sms: `ToolShare: New booking request from ${req.user.name} for ${tool.name}. Check your dashboard: ${process.env.CLIENT_URL}/booking-requests`,
    });

    // Notify renter of deposit requirement
    await notifyAll({
      user: req.user,
      inApp: {
        userId: req.user._id,
        title: '🔐 Booking Submitted',
        message: `Your request for "${tool.name}" has been sent. A security deposit of ₦${depositAmount.toLocaleString()} will be required if approved.`,
        type: 'booking_new',
        link: '/bookings',
        meta: { bookingId: booking._id },
      },
      email: {
        subject: `📋 Booking Request Submitted — ${tool.name}`,
        template: 'depositRequired',
        data: {
          renterName: req.user.name, toolName: tool.name,
          depositAmount, totalAmount,
          startDate: fmt(start), endDate: fmt(end),
          payUrl: `${process.env.CLIENT_URL}/bookings`,
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Booking request sent! You will be notified once the owner responds.',
      booking,
      depositAmount,
    });
  } catch (error) { next(error); }
};

// ─── GET BOOKINGS ─────────────────────────────────────────────────────────────
const getRenterBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip  = (Number(page) - 1) * Number(limit);
    const query = { renterId: req.user._id };
    if (status) query.status = status;
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('toolId',  'name category images location pricePerDay')
        .populate('ownerId', 'name phone email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(query),
    ]);
    res.status(200).json({ success: true, count: bookings.length, total, page: Number(page), pages: Math.ceil(total / Number(limit)), bookings });
  } catch (error) { next(error); }
};

const getOwnerBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip  = (Number(page) - 1) * Number(limit);
    const query = { ownerId: req.user._id };
    if (status) query.status = status;
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('toolId',   'name category images location pricePerDay')
        .populate('renterId', 'name phone email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(query),
    ]);
    res.status(200).json({ success: true, count: bookings.length, total, page: Number(page), pages: Math.ceil(total / Number(limit)), bookings });
  } catch (error) { next(error); }
};

// ─── APPROVE BOOKING ──────────────────────────────────────────────────────────
const approveBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('renterId', 'name email phone')
      .populate('toolId',   'name');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    if (booking.status !== 'pending')
      return res.status(400).json({ success: false, message: `Cannot approve a ${booking.status} booking.` });

    booking.status = 'approved';
    await booking.save();

    // Block tool availability
    await Tool.findByIdAndUpdate(booking.toolId, { available: false });

    // ✅ FIX: Find and notify renters whose overlapping bookings are auto-rejected
    const overlapping = await Booking.find({
      toolId: booking.toolId._id,
      _id: { $ne: booking._id },
      status: 'pending',
      $or: [{ startDate: { $lte: booking.endDate }, endDate: { $gte: booking.startDate } }],
    }).populate('renterId', 'name email phone');

    // Reject them and notify each one
    for (const ob of overlapping) {
      ob.status = 'rejected';
      await ob.save();
      await notifyAll({
        user: ob.renterId,
        inApp: {
          userId: ob.renterId._id,
          title: '❌ Booking No Longer Available',
          message: `Unfortunately "${booking.toolId.name}" has been booked by someone else for your requested dates.`,
          type: 'booking_rejected',
          link: '/bookings',
        },
        email: {
          subject: `Your booking for ${booking.toolId.name}`,
          template: 'bookingRejected',
          data: {
            renterName: ob.renterId.name,
            toolName: booking.toolId.name,
            browseUrl: `${process.env.CLIENT_URL}/tools`,
          },
        },
        sms: `ToolShare: Your booking for ${booking.toolId.name} is no longer available — the tool was booked by someone else. Browse more tools: ${process.env.CLIENT_URL}/tools`,
      });
    }

    await notifyAll({
      user: booking.renterId,
      inApp: {
        userId: booking.renterId._id,
        title: '✅ Booking Approved!',
        message: `Your booking for "${booking.toolId.name}" has been approved. Pay your deposit to confirm.`,
        type: 'booking_approved',
        link: '/bookings',
        meta: { bookingId: booking._id },
      },
      email: {
        subject: `✅ Booking Approved — ${booking.toolId.name}`,
        template: 'bookingApproved',
        data: {
          renterName: booking.renterId.name, toolName: booking.toolId.name,
          startDate: fmt(booking.startDate), endDate: fmt(booking.endDate),
          totalAmount: booking.totalAmount, ownerPhone: req.user.phone,
          bookingsUrl: `${process.env.CLIENT_URL}/bookings`,
        },
      },
      sms: `ToolShare: Your booking for ${booking.toolId.name} is approved! Pay your deposit to confirm. ${process.env.CLIENT_URL}/bookings`,
    });

    res.status(200).json({ success: true, message: 'Booking approved!', booking });
  } catch (error) { next(error); }
};

// ─── REJECT BOOKING ───────────────────────────────────────────────────────────
const rejectBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('renterId', 'name email phone')
      .populate('toolId',   'name');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    if (booking.status !== 'pending')
      return res.status(400).json({ success: false, message: `Cannot reject a ${booking.status} booking.` });

    booking.status = 'rejected';

    let refundMessage = '';
    if (booking.deposit?.paid && booking.deposit.amount > 0) {
      booking.paymentStatus = 'refund_pending';
      booking.refund = {
        amount: booking.deposit.amount,
        reason: 'Booking rejected by owner',
        processedAt: new Date(),
      };
      refundMessage = ` A refund of ₦${booking.deposit.amount.toLocaleString()} will be processed within 3–5 business days.`;
    }

    // ✅ FIX: save() FIRST, then notify — prevents ghost refund emails on save failure
    await booking.save();

    if (booking.deposit?.paid && booking.deposit.amount > 0) {
      await notifyAll({
        user: booking.renterId,
        inApp: {
          userId: booking.renterId._id,
          title: '💸 Refund Initiated',
          message: `Your deposit of ₦${booking.deposit.amount.toLocaleString()} for "${booking.toolId.name}" will be refunded within 3–5 business days.`,
          type: 'payment',
          link: '/bookings',
        },
        email: {
          subject: `💸 Refund Processing — ${booking.toolId.name}`,
          template: 'refundProcessed',
          data: {
            name: booking.renterId.name, toolName: booking.toolId.name,
            refundAmount: booking.deposit.amount,
            refundRef: `REF-${booking._id.toString().slice(-8).toUpperCase()}`,
            reason: 'Booking rejected by owner',
          },
        },
        sms: `ToolShare: Your booking for ${booking.toolId.name} was rejected. A refund of ₦${booking.deposit.amount.toLocaleString()} is being processed.`,
      });
    }

    await notifyAll({
      user: booking.renterId,
      inApp: {
        userId: booking.renterId._id,
        title: '❌ Booking Rejected',
        message: `Your booking for "${booking.toolId.name}" was declined.${refundMessage}`,
        type: 'booking_rejected',
        link: '/bookings',
      },
      email: {
        subject: `Your booking for ${booking.toolId.name}`,
        template: 'bookingRejected',
        data: {
          renterName: booking.renterId.name, toolName: booking.toolId.name,
          browseUrl: `${process.env.CLIENT_URL}/tools`,
        },
      },
      sms: `ToolShare: Your booking for ${booking.toolId.name} was not approved.${refundMessage} Browse more tools: ${process.env.CLIENT_URL}/tools`,
    });

    res.status(200).json({ success: true, message: 'Booking rejected.', booking });
  } catch (error) { next(error); }
};

// ─── CANCEL BOOKING ───────────────────────────────────────────────────────────
const cancelBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id)
      .populate('renterId', 'name email phone')
      .populate('ownerId',  'name email phone')
      .populate('toolId',   'name');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const isRenter = booking.renterId._id.toString() === req.user._id.toString();
    const isOwner  = booking.ownerId._id.toString()  === req.user._id.toString();
    if (!isRenter && !isOwner)
      return res.status(403).json({ success: false, message: 'Not authorized.' });

    const cancellerRole = isOwner ? 'owner' : 'renter';

    if (!['pending', 'approved'].includes(booking.status))
      return res.status(400).json({ success: false, message: `Cannot cancel a ${booking.status} booking.` });

    // ✅ FIX: capture previous status BEFORE changing it
    const wasApproved = booking.status === 'approved';

    const { percent, policy, label } = getCancellationPolicy(booking.startDate, cancellerRole);
    const refundAmount = booking.paymentStatus === 'paid' || booking.deposit?.paid
      ? Math.round((booking.deposit?.paid ? booking.deposit.amount : booking.totalAmount) * percent / 100)
      : 0;

    booking.status = 'cancelled';
    booking.cancellation = {
      cancelledAt:     new Date(),
      cancelledBy:     req.user._id,
      cancelledByRole: cancellerRole,
      reason:          reason || 'No reason provided',
      refundAmount,
      refundPercent:   percent,
      policy,
    };

    if (refundAmount > 0) {
      booking.paymentStatus = 'refund_pending';
      booking.refund = {
        amount:    refundAmount,
        reason:    `Cancellation — ${label}`,
        processedAt: new Date(),
      };
      if (booking.deposit?.paid) {
        booking.deposit.refunded      = percent === 100;
        booking.deposit.forfeited     = percent === 0;
        booking.deposit.forfeitReason = percent === 0 ? 'Late cancellation' : null;
      }
    }

    await booking.save();

    // ✅ FIX: only restore tool availability if booking was previously approved
    if (wasApproved) {
      await Tool.findByIdAndUpdate(booking.toolId, { available: true });
    }

    const otherParty = isRenter ? booking.ownerId : booking.renterId;

    await notifyAll({
      user: req.user,
      inApp: {
        userId: req.user._id,
        title: '❌ Booking Cancelled',
        message: `You cancelled your booking for "${booking.toolId.name}". ${refundAmount > 0 ? `Refund: ₦${refundAmount.toLocaleString()}` : 'No refund applies.'}`,
        type: 'booking_rejected',
        link: isRenter ? '/bookings' : '/booking-requests',
      },
      email: {
        subject: `Booking Cancelled — ${booking.toolId.name}`,
        template: 'bookingCancelled',
        data: {
          name: req.user.name, toolName: booking.toolId.name,
          startDate: fmt(booking.startDate),
          refundAmount, refundPercent: percent, policy: label,
          bookingsUrl: `${process.env.CLIENT_URL}/${isRenter ? 'bookings' : 'booking-requests'}`,
        },
      },
      sms: `ToolShare: Booking for ${booking.toolId.name} cancelled. ${refundAmount > 0 ? `Refund ₦${refundAmount.toLocaleString()} processing.` : 'No refund applies.'}`,
    });

    if (isRenter) {
      await notifyAll({
        user: otherParty,
        inApp: {
          userId: otherParty._id,
          title: '⚠️ Booking Cancelled by Renter',
          message: `${booking.renterId.name} cancelled their booking for "${booking.toolId.name}".${wasApproved ? ' Your tool is now available again.' : ''}`,
          type: 'booking_rejected',
          link: '/booking-requests',
        },
        email: {
          subject: `Booking Cancelled — ${booking.toolId.name}`,
          template: 'bookingCancelledOwner',
          data: {
            ownerName: otherParty.name, toolName: booking.toolId.name,
            renterName: booking.renterId.name,
            startDate: fmt(booking.startDate), endDate: fmt(booking.endDate),
            dashboardUrl: `${process.env.CLIENT_URL}/booking-requests`,
          },
        },
        sms: `ToolShare: ${booking.renterId.name} cancelled their booking for ${booking.toolId.name}.${wasApproved ? ' Your tool is now available.' : ''}`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Booking cancelled. ${refundAmount > 0 ? `Refund of ₦${refundAmount.toLocaleString()} will be processed.` : 'No refund applies per cancellation policy.'}`,
      booking,
      refundAmount,
      policy: label,
    });
  } catch (error) { next(error); }
};

// ─── COMPLETE BOOKING ─────────────────────────────────────────────────────────
const completeBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('renterId', 'name email phone')
      .populate('toolId',   'name');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    if (booking.status !== 'approved')
      return res.status(400).json({ success: false, message: 'Only approved bookings can be completed.' });

    booking.status = 'completed';
    booking.escrow.ownerConfirmedReturn   = true;
    booking.escrow.ownerConfirmedReturnAt = new Date();

    if (booking.deposit?.paid && !booking.deposit.refunded && !booking.deposit.forfeited) {
      booking.deposit.refunded   = true;
      booking.deposit.refundedAt = new Date();
      booking.paymentStatus      = 'refund_pending';
      booking.refund = {
        amount:      booking.deposit.amount,
        reason:      'Booking completed — deposit refund',
        processedAt: new Date(),
      };
    }

    await booking.save();
    await Tool.findByIdAndUpdate(booking.toolId, { available: true });

    if (booking.deposit?.paid) {
      await notifyAll({
        user: booking.renterId,
        inApp: {
          userId: booking.renterId._id,
          title: '💸 Deposit Refund Processing',
          message: `Your security deposit of ₦${booking.deposit.amount.toLocaleString()} for "${booking.toolId.name}" is being refunded.`,
          type: 'payment',
          link: '/bookings',
        },
        email: {
          subject: `💸 Deposit Refund — ${booking.toolId.name}`,
          template: 'refundProcessed',
          data: {
            name: booking.renterId.name, toolName: booking.toolId.name,
            refundAmount: booking.deposit.amount,
            refundRef: `DEP-${booking._id.toString().slice(-8).toUpperCase()}`,
            reason: 'Tool returned successfully — deposit refunded',
          },
        },
        sms: `ToolShare: Rental complete! Your deposit of ₦${booking.deposit.amount.toLocaleString()} for ${booking.toolId.name} is being refunded.`,
      });
    }

    res.status(200).json({ success: true, message: 'Booking completed! Deposit refund initiated.', booking });
  } catch (error) { next(error); }
};

// ─── GET CANCELLATION POLICY PREVIEW ─────────────────────────────────────────
const getCancellationPolicyPreview = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const isRenter = booking.renterId.toString() === req.user._id.toString();
    const role     = isRenter ? 'renter' : 'owner';
    const { percent, policy, label } = getCancellationPolicy(booking.startDate, role);
    const baseAmount   = booking.deposit?.paid ? booking.deposit.amount : booking.totalAmount;
    const refundAmount = Math.round(baseAmount * percent / 100);

    res.status(200).json({
      success: true,
      policy: { percent, policy, label },
      refundAmount,
      depositPaid:   booking.deposit?.paid   || false,
      depositAmount: booking.deposit?.amount || 0,
    });
  } catch (error) { next(error); }
};

// ─── TOOL BOOKINGS (calendar) ─────────────────────────────────────────────────
const getToolBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({
      toolId: req.params.toolId,
      status: { $in: ['approved', 'pending'] },
    }).select('startDate endDate status');
    res.status(200).json({ success: true, bookings });
  } catch (error) { next(error); }
};

// ─── SINGLE BOOKING DETAIL ────────────────────────────────────────────────────
const getBookingById = async (req, res, next) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/))
      return res.status(404).json({ success: false, message: 'Booking not found.' });

    const booking = await Booking.findById(req.params.id)
      .populate('toolId',   'name category images location pricePerDay')
      .populate('renterId', 'name email phone')
      .populate('ownerId',  'name email phone');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const isParty = [booking.renterId._id.toString(), booking.ownerId._id.toString()].includes(req.user._id.toString());
    const isAdmin = req.user.role === 'admin';
    if (!isParty && !isAdmin) return res.status(403).json({ success: false, message: 'Not authorized.' });

    // ✅ FIX: hide contact details until booking is approved
    const approved = ['approved', 'completed'].includes(booking.status);
    const bookingObj = booking.toObject();
    if (!approved && !isAdmin) {
      if (isParty) {
        // Renter can see their own details but not owner's private contact
        if (booking.renterId._id.toString() === req.user._id.toString()) {
          bookingObj.ownerId.phone = undefined;
          bookingObj.ownerId.email = undefined;
        }
      }
    }

    res.status(200).json({ success: true, booking: bookingObj });
  } catch (error) { next(error); }
};

// ─── REPORT NON-RETURN ────────────────────────────────────────────────────────
const reportNonReturn = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('renterId', 'name email phone')
      .populate('ownerId',  'name email phone')
      .populate('toolId',   'name');

    if (!booking)
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.ownerId._id.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Only the owner can report a non-return.' });
    if (booking.status !== 'approved')
      return res.status(400).json({ success: false, message: 'Only active approved bookings can be reported.' });
    if (new Date() < new Date(booking.endDate))
      return res.status(400).json({ success: false, message: 'Cannot report non-return before the rental end date.' });
    if (booking.dispute?.active)
      return res.status(400).json({ success: false, message: 'A dispute is already active on this booking.' });

    booking.status               = 'disputed';
    booking.dispute.active       = true;
    booking.dispute.raisedBy     = req.user._id;
    booking.dispute.raisedByRole = 'owner';
    booking.dispute.reason       = 'Tool not returned by renter after rental end date';
    booking.dispute.raisedAt     = new Date();

    if (booking.deposit?.paid && !booking.deposit.refunded && !booking.deposit.forfeited) {
      booking.deposit.forfeited     = true;
      booking.deposit.forfeitReason = 'Tool not returned — deposit forfeited to cover potential loss';
    }

    await booking.save();

    await notifyAll({
      user: booking.renterId,
      inApp: {
        userId: booking.renterId._id,
        title: '🚨 Non-Return Reported',
        message: `The owner of "${booking.toolId.name}" has reported you have not returned the tool. Your deposit has been forfeited. Please contact the owner immediately.`,
        type: 'dispute',
        link: '/bookings',
      },
      email: {
        subject: `🚨 Non-Return Reported — ${booking.toolId.name}`,
        template: 'nonReturnRenter',
        data: {
          renterName:    booking.renterId.name,
          toolName:      booking.toolId.name,
          ownerName:     booking.ownerId.name,
          ownerPhone:    booking.ownerId.phone,
          endDate:       booking.endDate.toLocaleDateString('en-NG'),
          depositAmount: booking.deposit?.amount || 0,
          bookingsUrl:   `${process.env.CLIENT_URL}/bookings`,
        },
      },
      sms: `URGENT ToolShare: ${booking.ownerId.name} has reported you haven't returned "${booking.toolId.name}". Your deposit of ₦${booking.deposit?.amount?.toLocaleString()} has been forfeited. Contact owner: ${booking.ownerId.phone}`,
    });

    // ✅ User already required at top — no inline require needed
    const admins = await User.find({ role: 'admin' }).select('_id email');
    for (const admin of admins) {
      await notifyAll({
        user: admin,
        inApp: {
          userId: admin._id,
          title: '🚨 Non-Return Dispute',
          message: `${booking.ownerId.name} reported that ${booking.renterId.name} has not returned "${booking.toolId.name}". Deposit forfeited.`,
          type: 'dispute',
          link: '/admin',
        },
        email: {
          subject: `🚨 Non-Return Dispute — ${booking.toolId.name}`,
          template: 'disputeRaised',
          data: {
            raisedBy:     booking.ownerId.name,
            raisedByRole: 'owner',
            toolName:     booking.toolId.name,
            renterName:   booking.renterId.name,
            ownerName:    booking.ownerId.name,
            reason:       'Tool not returned after rental end date',
            adminUrl:     `${process.env.CLIENT_URL}/admin`,
          },
        },
        sms: null,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Non-return reported. Renter notified, deposit forfeited, admin alerted.',
      booking,
    });
  } catch (error) { next(error); }
};

module.exports = {
  getToolBookings, createBooking, getRenterBookings, getOwnerBookings,
  approveBooking, rejectBooking, completeBooking, cancelBooking,
  getCancellationPolicyPreview, getBookingById, reportNonReturn,
};