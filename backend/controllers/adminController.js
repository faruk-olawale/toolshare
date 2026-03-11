const User = require('../models/User');
const Tool = require('../models/Tool');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { sendEmail } = require('../utils/sendEmail');
const notify      = require('../utils/notify');

const getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalTools, totalBookings, pendingTools, pendingKyc, payments, paidBookings] = await Promise.all([
      User.countDocuments(),
      Tool.countDocuments(),
      Booking.countDocuments(),
      Tool.countDocuments({ adminVerified: false }),
      User.countDocuments({ 'kyc.status': 'pending' }),
      Payment.find({ status: 'success' }),
      Booking.find({ paymentStatus: { $in: ['paid', 'partially_released', 'fully_released'] } }),
    ]);

    // Revenue from completed Paystack payments (platform fee in kobo → naira)
    const revenueFromPayments = payments.reduce((sum, p) => sum + (p.platformFee || 0), 0) / 100;

    // Fallback: estimate from paid bookings if no payment records yet (10% platform fee)
    const revenueFromBookings = paidBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0) * 0.10;

    // Use whichever is higher (payments are authoritative once Paystack is live)
    const totalRevenue = revenueFromPayments > 0 ? revenueFromPayments : revenueFromBookings;

    // Gross transaction volume
    const grossVolume = paidBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers, totalTools, totalBookings, pendingTools, pendingKyc,
        totalRevenue,
        grossVolume,
        paidBookings: paidBookings.length,
        successfulPayments: payments.length,
      }
    });
  } catch (error) { next(error); }
};

// ── TOOL MANAGEMENT ──────────────────────────────────────────────────────────
const getPendingTools = async (req, res, next) => {
  try {
    const tools = await Tool.find({ adminVerified: false })
      .populate('ownerId', 'name email phone location kyc')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: tools.length, tools });
  } catch (error) { next(error); }
};

const getAllTools = async (req, res, next) => {
  try {
    const { verified, page = 1, limit = 20 } = req.query;
    const query = {};
    if (verified === 'true') query.adminVerified = true;
    if (verified === 'false') query.adminVerified = false;
    const skip = (Number(page) - 1) * Number(limit);
    const [tools, total] = await Promise.all([
      Tool.find(query).populate('ownerId', 'name email').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Tool.countDocuments(query),
    ]);
    res.status(200).json({ success: true, count: tools.length, total, page: Number(page), pages: Math.ceil(total / Number(limit)), tools });
  } catch (error) { next(error); }
};

const verifyTool = async (req, res, next) => {
  try {
    const tool = await Tool.findByIdAndUpdate(req.params.id,
      { adminVerified: true, adminNote: null, verifiedAt: new Date(), verifiedBy: req.user._id },
      { new: true }
    ).populate('ownerId', 'name email');
    if (!tool) return res.status(404).json({ success: false, message: 'Tool not found.' });

    sendEmail({
      to: tool.ownerId.email,
      subject: '✅ Your tool is now live on ToolShare Africa!',
      template: 'toolVerified',
      data: { ownerName: tool.ownerId.name, toolName: tool.name, browseUrl: `${process.env.CLIENT_URL}/tools/${tool._id}` },
    });

    res.status(200).json({ success: true, message: 'Tool verified and live!', tool });
  } catch (error) { next(error); }
};

const rejectTool = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const tool = await Tool.findByIdAndUpdate(req.params.id,
      { adminVerified: false, adminNote: reason || 'Did not meet listing standards.' },
      { new: true }
    ).populate('ownerId', 'name email');
    if (!tool) return res.status(404).json({ success: false, message: 'Tool not found.' });

    sendEmail({
      to: tool.ownerId.email,
      subject: '⚠️ Your tool listing needs an update',
      template: 'toolRejected',
      data: { ownerName: tool.ownerId.name, toolName: tool.name, reason, dashboardUrl: `${process.env.CLIENT_URL}/my-tools` },
    });

    notify({
      userId: tool.ownerId._id,
      title: '⚠️ Tool Listing Rejected',
      message: `Your tool "${tool.name}" was not approved. Reason: ${reason || 'Did not meet listing standards.'}`,
      type: 'tool_rejected',
      link: '/my-tools',
      meta: { reason },
    });

    res.status(200).json({ success: true, message: 'Tool rejected.', tool });
  } catch (error) { next(error); }
};

// ── KYC MANAGEMENT ──────────────────────────────────────────────────────────
const getPendingKyc = async (req, res, next) => {
  try {
    const users = await User.find({ 'kyc.status': 'pending' }).sort({ 'kyc.submittedAt': 1 });
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) { next(error); }
};

const approveKyc = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, {
      'kyc.status': 'approved',
      'kyc.rejectionReason': null,
      'kyc.reviewedAt': new Date(),
      'kyc.reviewedBy': req.user._id,
    }, { new: true });

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    sendEmail({
      to: user.email,
      subject: '✅ Identity Verified — You\'re all set on ToolShare Africa!',
      template: 'kycApproved',
      data: { name: user.name, role: user.role, clientUrl: process.env.CLIENT_URL },
    });

    res.status(200).json({ success: true, message: 'KYC approved!', user });
  } catch (error) { next(error); }
};

const rejectKyc = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, {
      'kyc.status': 'rejected',
      'kyc.rejectionReason': reason || 'Documents could not be verified.',
      'kyc.reviewedAt': new Date(),
      'kyc.reviewedBy': req.user._id,
    }, { new: true });

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    sendEmail({
      to: user.email,
      subject: '⚠️ Identity Verification — Action Required',
      template: 'kycRejected',
      data: { name: user.name, reason, clientUrl: process.env.CLIENT_URL },
    });

    notify({
      userId: user._id,
      title: '❌ KYC Verification Failed',
      message: `Your identity verification was rejected. Reason: ${reason || 'Documents did not meet requirements.'}`,
      type: 'kyc_rejected',
      link: '/kyc',
      meta: { reason },
    });

    res.status(200).json({ success: true, message: 'KYC rejected.', user });
  } catch (error) { next(error); }
};

// ── USER MANAGEMENT ──────────────────────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const query = search ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] } : {};
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(query),
    ]);
    res.status(200).json({ success: true, count: users.length, total, page: Number(page), pages: Math.ceil(total / Number(limit)), users });
  } catch (error) { next(error); }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot delete admin accounts.' });

    // Cascade delete — remove all their data
    const Tool = require('../models/Tool');
    const Booking = require('../models/Booking');

    await Tool.deleteMany({ ownerId: req.params.id });
    await Booking.deleteMany({ $or: [{ renterId: req.params.id }, { ownerId: req.params.id }] });
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'User and all associated data deleted.' });
  } catch (error) { next(error); }
};

const getAllBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const query = status ? { status } : {};
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('toolId', 'name category')
        .populate('renterId', 'name email')
        .populate('ownerId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(query),
    ]);
    res.status(200).json({ success: true, count: bookings.length, total, page: Number(page), pages: Math.ceil(total / Number(limit)), bookings });
  } catch (error) { next(error); }
};

// ── RESOLVE DISPUTE ───────────────────────────────────────────────────────────
// ── SUSPEND USER ─────────────────────────────────────────────────────────────
const suspendUser = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Suspension reason is required.' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot suspend an admin account.' });
    if (user.suspended) return res.status(400).json({ success: false, message: 'User is already suspended.' });

    user.suspended        = true;
    user.suspendedAt      = new Date();
    user.suspendedBy      = req.user._id;
    user.suspensionReason = reason;
    user.suspensionHistory.push({ action: 'suspended', reason, by: req.user._id });
    await user.save();

    // Notify user by email
    sendEmail({
      to: user.email,
      subject: '⚠️ Your ToolShare Africa Account Has Been Suspended',
      template: 'accountSuspended',
      data: { name: user.name, reason, supportUrl: `${process.env.CLIENT_URL}/contact` },
    }).catch(() => {});

    // In-app notify user
    notify({
      userId: user._id,
      title: '⚠️ Account Suspended',
      message: `Your account has been suspended. Reason: ${reason}. Contact support to appeal.`,
      type: 'system',
      link: '/contact',
    }).catch(() => {});

    res.status(200).json({ success: true, message: `${user.name}'s account has been suspended.`, user });
  } catch (error) { next(error); }
};

// ── UNSUSPEND USER ────────────────────────────────────────────────────────────
const unsuspendUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (!user.suspended) return res.status(400).json({ success: false, message: 'User is not suspended.' });

    user.suspended        = false;
    user.suspendedAt      = null;
    user.suspendedBy      = null;
    user.suspensionReason = null;
    user.suspensionHistory.push({ action: 'unsuspended', reason: 'Reinstated by admin', by: req.user._id });
    await user.save();

    // Notify user
    sendEmail({
      to: user.email,
      subject: '✅ Your ToolShare Africa Account Has Been Reinstated',
      template: 'accountUnsuspended',
      data: { name: user.name, clientUrl: process.env.CLIENT_URL },
    }).catch(() => {});

    notify({
      userId: user._id,
      title: '✅ Account Reinstated',
      message: 'Your account suspension has been lifted. Welcome back!',
      type: 'system',
      link: '/dashboard',
    }).catch(() => {});

    res.status(200).json({ success: true, message: `${user.name}'s account has been reinstated.`, user });
  } catch (error) { next(error); }
};

// ── RESOLVE DISPUTE (Admin) ───────────────────────────────────────────────────
const resolveDispute = async (req, res, next) => {
  try {
    const { resolution, outcome, suspendRenter, markToolLost } = req.body;
    if (!resolution) return res.status(400).json({ success: false, message: 'Resolution notes are required.' });
    if (!outcome) return res.status(400).json({ success: false, message: 'Outcome is required.' });

    const booking = await Booking.findById(req.params.id)
      .populate('renterId', 'name email phone')
      .populate('ownerId',  'name email phone')
      .populate('toolId',   'name _id');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.status !== 'disputed') return res.status(400).json({ success: false, message: 'This booking is not in disputed status.' });

    booking.status               = outcome === 'tool_recovered' ? 'completed' : 'written_off';
    booking.dispute.active       = false;
    booking.dispute.resolvedAt   = new Date();
    booking.dispute.resolution   = resolution;
    booking.dispute.resolvedBy   = req.user._id;
    booking.dispute.outcome      = outcome;
    await booking.save();

    // Optionally suspend renter
    if (suspendRenter) {
      await User.findByIdAndUpdate(booking.renterId._id, {
        suspended: true,
        suspendedAt: new Date(),
        suspendedBy: req.user._id,
        suspensionReason: `Dispute resolution: ${resolution}`,
        $push: { suspensionHistory: { action: 'suspended', reason: `Dispute: ${resolution}`, by: req.user._id } },
      });
    }

    // Optionally mark tool as lost
    if (markToolLost) {
      await Tool.findByIdAndUpdate(booking.toolId._id, {
        available: false,
        adminVerified: false,
        adminNote: `Marked lost after dispute. Booking ${booking._id}. ${fmt(new Date())}`,
      });
    } else if (outcome === 'tool_recovered') {
      await Tool.findByIdAndUpdate(booking.toolId._id, { available: true });
    }

    // Notify both parties
    const notifyParty = (user, role) => {
      sendEmail({
        to: user.email,
        subject: `✅ Dispute Resolved — ${booking.toolId.name}`,
        template: 'disputeResolved',
        data: { name: user.name, toolName: booking.toolId.name, resolution, outcome, clientUrl: process.env.CLIENT_URL },
      }).catch(() => {});
      notify({
        userId: user._id,
        title: `✅ Dispute Resolved — ${booking.toolId.name}`,
        message: `Resolution: ${resolution}`,
        type: 'dispute',
        link: role === 'owner' ? '/booking-requests' : '/bookings',
      }).catch(() => {});
    };

    notifyParty(booking.ownerId, 'owner');
    notifyParty(booking.renterId, 'renter');

    res.status(200).json({ success: true, message: 'Dispute resolved.', booking });
  } catch (error) { next(error); }
};

const fmt = (d) => new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

module.exports = {
  getStats, getPendingTools, getAllTools, verifyTool, rejectTool,
  getPendingKyc, approveKyc, rejectKyc,
  getAllUsers, deleteUser, getAllBookings,
  suspendUser, unsuspendUser, resolveDispute,
};