const User = require('../models/User');
const Tool = require('../models/Tool');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { sendEmail } = require('../utils/sendEmail');
const notify      = require('../utils/notify');

const getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalTools, totalBookings, pendingTools, pendingKyc, payments] = await Promise.all([
      User.countDocuments(),
      Tool.countDocuments(),
      Booking.countDocuments(),
      Tool.countDocuments({ adminVerified: false }),
      User.countDocuments({ 'kyc.status': 'pending' }),
      Payment.find({ status: 'success' }),
    ]);
    const totalRevenue = payments.reduce((sum, p) => sum + (p.platformFee || 0), 0) / 100;
    res.status(200).json({ success: true, stats: { totalUsers, totalTools, totalBookings, pendingTools, pendingKyc, totalRevenue } });
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
    const { verified } = req.query;
    const query = {};
    if (verified === 'true') query.adminVerified = true;
    if (verified === 'false') query.adminVerified = false;
    const tools = await Tool.find(query).populate('ownerId', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: tools.length, tools });
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
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, users });
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
    const bookings = await Booking.find()
      .populate('toolId', 'name category')
      .populate('renterId', 'name email')
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) { next(error); }
};

module.exports = {
  getStats, getPendingTools, getAllTools, verifyTool, rejectTool,
  getPendingKyc, approveKyc, rejectKyc,
  getAllUsers, deleteUser, getAllBookings,
};