const User = require('../models/User');
const Tool = require('../models/Tool');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { sendEmail } = require('../utils/sendEmail');

// @desc  Get dashboard stats
// GET /api/admin/stats
const getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalTools, totalBookings, pendingTools, payments] = await Promise.all([
      User.countDocuments(),
      Tool.countDocuments(),
      Booking.countDocuments(),
      Tool.countDocuments({ adminVerified: false }),
      Payment.find({ status: 'success' }),
    ]);
    const totalRevenue = payments.reduce((sum, p) => sum + (p.platformFee || 0), 0) / 100;

    res.status(200).json({
      success: true,
      stats: { totalUsers, totalTools, totalBookings, pendingTools, totalRevenue },
    });
  } catch (error) { next(error); }
};

// @desc  Get all tools pending verification
// GET /api/admin/tools/pending
const getPendingTools = async (req, res, next) => {
  try {
    const tools = await Tool.find({ adminVerified: false })
      .populate('ownerId', 'name email phone location')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: tools.length, tools });
  } catch (error) { next(error); }
};

// @desc  Get all tools
// GET /api/admin/tools
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

// @desc  Verify tool
// PUT /api/admin/tools/:id/verify
const verifyTool = async (req, res, next) => {
  try {
    const tool = await Tool.findByIdAndUpdate(
      req.params.id,
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

    res.status(200).json({ success: true, message: 'Tool verified and now live!', tool });
  } catch (error) { next(error); }
};

// @desc  Reject tool
// PUT /api/admin/tools/:id/reject
const rejectTool = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const tool = await Tool.findByIdAndUpdate(
      req.params.id,
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

    res.status(200).json({ success: true, message: 'Tool rejected.', tool });
  } catch (error) { next(error); }
};

// @desc  Get all users
// GET /api/admin/users
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) { next(error); }
};

// @desc  Delete user
// DELETE /api/admin/users/:id
const deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'User deleted.' });
  } catch (error) { next(error); }
};

// @desc  Get all bookings
// GET /api/admin/bookings
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

module.exports = { getStats, getPendingTools, getAllTools, verifyTool, rejectTool, getAllUsers, deleteUser, getAllBookings };