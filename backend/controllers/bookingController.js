const { validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Tool = require('../models/Tool');

// @desc    Create booking request
// @route   POST /api/bookings
// @access  Private (renter)
const createBooking = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { toolId, startDate, endDate, notes } = req.body;

    const tool = await Tool.findById(toolId);
    if (!tool) {
      return res.status(404).json({ success: false, message: 'Tool not found.' });
    }

    if (!tool.available) {
      return res.status(400).json({ success: false, message: 'This tool is currently unavailable.' });
    }

    // Prevent owner from booking own tool
    if (tool.ownerId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot book your own tool.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return res.status(400).json({ success: false, message: 'End date must be after start date.' });
    }

    if (start < new Date()) {
      return res.status(400).json({ success: false, message: 'Start date cannot be in the past.' });
    }

    // Check for conflicting approved bookings
    const conflictingBooking = await Booking.findOne({
      toolId,
      status: 'approved',
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } },
      ],
    });

    if (conflictingBooking) {
      return res.status(409).json({
        success: false,
        message: 'This tool is already booked for the selected dates.',
      });
    }

    // Calculate total days and amount
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalAmount = days * tool.pricePerDay;

    const booking = await Booking.create({
      toolId,
      renterId: req.user._id,
      ownerId: tool.ownerId,
      startDate: start,
      endDate: end,
      totalAmount,
      notes,
    });

    await booking.populate([
      { path: 'toolId', select: 'name category images pricePerDay location' },
      { path: 'renterId', select: 'name email phone' },
    ]);

    res.status(201).json({
      success: true,
      message: 'Booking request sent! Waiting for owner approval.',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get renter's bookings
// @route   GET /api/bookings/user
// @access  Private (renter)
const getRenterBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ renterId: req.user._id })
      .populate('toolId', 'name category images location pricePerDay')
      .populate('ownerId', 'name phone email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    next(error);
  }
};

// @desc    Get owner's booking requests
// @route   GET /api/bookings/owner
// @access  Private (owner)
const getOwnerBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ ownerId: req.user._id })
      .populate('toolId', 'name category images location pricePerDay')
      .populate('renterId', 'name phone email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve booking
// @route   PUT /api/bookings/:id/approve
// @access  Private (owner)
const approveBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot approve a ${booking.status} booking.` });
    }

    booking.status = 'approved';
    await booking.save();

    // Mark tool as unavailable
    await Tool.findByIdAndUpdate(booking.toolId, { available: false });

    // Reject all other pending bookings for the same tool in overlapping dates
    await Booking.updateMany(
      {
        toolId: booking.toolId,
        _id: { $ne: booking._id },
        status: 'pending',
        $or: [{ startDate: { $lte: booking.endDate }, endDate: { $gte: booking.startDate } }],
      },
      { status: 'rejected' }
    );

    await booking.populate([
      { path: 'toolId', select: 'name' },
      { path: 'renterId', select: 'name email' },
    ]);

    res.status(200).json({ success: true, message: 'Booking approved!', booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject booking
// @route   PUT /api/bookings/:id/reject
// @access  Private (owner)
const rejectBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot reject a ${booking.status} booking.` });
    }

    booking.status = 'rejected';
    await booking.save();

    res.status(200).json({ success: true, message: 'Booking rejected.', booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete booking
// @route   PUT /api/bookings/:id/complete
// @access  Private (owner)
const completeBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (booking.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Only approved bookings can be completed.' });
    }

    booking.status = 'completed';
    await booking.save();

    // Make tool available again
    await Tool.findByIdAndUpdate(booking.toolId, { available: true });

    res.status(200).json({ success: true, message: 'Booking marked as completed!', booking });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getRenterBookings,
  getOwnerBookings,
  approveBooking,
  rejectBooking,
  completeBooking,
};
