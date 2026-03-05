const { validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Tool = require('../models/Tool');
const User = require('../models/User');
const { sendEmail } = require('../utils/sendEmail');

const fmt = (date) => new Date(date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

const createBooking = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const { toolId, startDate, endDate, notes } = req.body;
    const tool = await Tool.findById(toolId);
    if (!tool) return res.status(404).json({ success: false, message: 'Tool not found.' });
    if (!tool.available) return res.status(400).json({ success: false, message: 'This tool is currently unavailable.' });
    if (!tool.adminVerified) return res.status(400).json({ success: false, message: 'This tool is pending admin verification.' });
    if (tool.ownerId.toString() === req.user._id.toString())
      return res.status(400).json({ success: false, message: 'You cannot book your own tool.' });

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) return res.status(400).json({ success: false, message: 'End date must be after start date.' });
    if (start < new Date()) return res.status(400).json({ success: false, message: 'Start date cannot be in the past.' });

    const conflict = await Booking.findOne({ toolId, status: 'approved', $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }] });
    if (conflict) return res.status(409).json({ success: false, message: 'Tool already booked for selected dates.' });

    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalAmount = days * tool.pricePerDay;

    const booking = await Booking.create({
      toolId, renterId: req.user._id, ownerId: tool.ownerId,
      startDate: start, endDate: end, totalAmount, notes,
    });

    await booking.populate([
      { path: 'toolId', select: 'name category images pricePerDay location' },
      { path: 'renterId', select: 'name email phone' },
    ]);

    // Email owner
    const owner = await User.findById(tool.ownerId);
    sendEmail({
      to: owner.email,
      subject: `📋 New booking request for ${tool.name}`,
      template: 'bookingRequest',
      data: {
        ownerName: owner.name,
        renterName: req.user.name,
        toolName: tool.name,
        startDate: fmt(start),
        endDate: fmt(end),
        totalAmount,
        dashboardUrl: `${process.env.CLIENT_URL}/booking-requests`,
      },
    });

    res.status(201).json({ success: true, message: 'Booking request sent!', booking });
  } catch (error) { next(error); }
};

const getRenterBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ renterId: req.user._id })
      .populate('toolId', 'name category images location pricePerDay')
      .populate('ownerId', 'name phone email')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) { next(error); }
};

const getOwnerBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ ownerId: req.user._id })
      .populate('toolId', 'name category images location pricePerDay')
      .populate('renterId', 'name phone email')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) { next(error); }
};

const approveBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('renterId', 'name email').populate('toolId', 'name');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.ownerId.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized.' });
    if (booking.status !== 'pending') return res.status(400).json({ success: false, message: `Cannot approve a ${booking.status} booking.` });

    booking.status = 'approved';
    await booking.save();
    await Tool.findByIdAndUpdate(booking.toolId, { available: false });
    await Booking.updateMany(
      { toolId: booking.toolId._id, _id: { $ne: booking._id }, status: 'pending', $or: [{ startDate: { $lte: booking.endDate }, endDate: { $gte: booking.startDate } }] },
      { status: 'rejected' }
    );

    // Email renter
    sendEmail({
      to: booking.renterId.email,
      subject: `✅ Your booking for ${booking.toolId.name} is approved!`,
      template: 'bookingApproved',
      data: {
        renterName: booking.renterId.name,
        toolName: booking.toolId.name,
        startDate: fmt(booking.startDate),
        endDate: fmt(booking.endDate),
        totalAmount: booking.totalAmount,
        ownerPhone: req.user.phone,
        bookingsUrl: `${process.env.CLIENT_URL}/bookings`,
      },
    });

    res.status(200).json({ success: true, message: 'Booking approved!', booking });
  } catch (error) { next(error); }
};

const rejectBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('renterId', 'name email').populate('toolId', 'name');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.ownerId.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized.' });
    if (booking.status !== 'pending') return res.status(400).json({ success: false, message: `Cannot reject a ${booking.status} booking.` });

    booking.status = 'rejected';
    await booking.save();

    sendEmail({
      to: booking.renterId.email,
      subject: `Your booking request for ${booking.toolId.name}`,
      template: 'bookingRejected',
      data: {
        renterName: booking.renterId.name,
        toolName: booking.toolId.name,
        browseUrl: `${process.env.CLIENT_URL}/tools`,
      },
    });

    res.status(200).json({ success: true, message: 'Booking rejected.', booking });
  } catch (error) { next(error); }
};

const completeBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.ownerId.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized.' });
    if (booking.status !== 'approved') return res.status(400).json({ success: false, message: 'Only approved bookings can be completed.' });

    booking.status = 'completed';
    await booking.save();
    await Tool.findByIdAndUpdate(booking.toolId, { available: true });

    res.status(200).json({ success: true, message: 'Booking completed!', booking });
  } catch (error) { next(error); }
};

module.exports = { createBooking, getRenterBookings, getOwnerBookings, approveBooking, rejectBooking, completeBooking };