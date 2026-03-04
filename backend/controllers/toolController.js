const { validationResult } = require('express-validator');
const Tool = require('../models/Tool');
const Booking = require('../models/Booking');
const path = require('path');

// @desc    Get all tools (with filters)
// @route   GET /api/tools
// @access  Public
const getTools = async (req, res, next) => {
  try {
    const { category, location, minPrice, maxPrice, search, page = 1, limit = 12 } = req.query;

    const query = { available: true };

    if (category) query.category = category;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (minPrice || maxPrice) {
      query.pricePerDay = {};
      if (minPrice) query.pricePerDay.$gte = Number(minPrice);
      if (maxPrice) query.pricePerDay.$lte = Number(maxPrice);
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Tool.countDocuments(query);
    const tools = await Tool.find(query)
      .populate('ownerId', 'name location phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: tools.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      tools,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single tool
// @route   GET /api/tools/:id
// @access  Public
const getTool = async (req, res, next) => {
  try {
    const tool = await Tool.findById(req.params.id).populate('ownerId', 'name location phone email');

    if (!tool) {
      return res.status(404).json({ success: false, message: 'Tool not found.' });
    }

    res.status(200).json({ success: true, tool });
  } catch (error) {
    next(error);
  }
};

// @desc    Create tool listing
// @route   POST /api/tools
// @access  Private (owner only)
const createTool = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { name, category, description, pricePerDay, location, condition } = req.body;

    const images = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];

    const tool = await Tool.create({
      ownerId: req.user._id,
      name,
      category,
      description,
      pricePerDay: Number(pricePerDay),
      images,
      location,
      condition,
    });

    await tool.populate('ownerId', 'name location');

    res.status(201).json({ success: true, message: 'Tool listed successfully!', tool });
  } catch (error) {
    next(error);
  }
};

// @desc    Update tool
// @route   PUT /api/tools/:id
// @access  Private (owner only)
const updateTool = async (req, res, next) => {
  try {
    let tool = await Tool.findById(req.params.id);

    if (!tool) {
      return res.status(404).json({ success: false, message: 'Tool not found.' });
    }

    if (tool.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this tool.' });
    }

    const { name, category, description, pricePerDay, location, available, condition } = req.body;
    const updateData = { name, category, description, pricePerDay, location, available, condition };

    // Handle new images if uploaded
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => `/uploads/${file.filename}`);
      updateData.images = [...tool.images, ...newImages];
    }

    tool = await Tool.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, message: 'Tool updated successfully.', tool });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete tool
// @route   DELETE /api/tools/:id
// @access  Private (owner only)
const deleteTool = async (req, res, next) => {
  try {
    const tool = await Tool.findById(req.params.id);

    if (!tool) {
      return res.status(404).json({ success: false, message: 'Tool not found.' });
    }

    if (tool.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this tool.' });
    }

    // Check for active bookings
    const activeBooking = await Booking.findOne({
      toolId: req.params.id,
      status: { $in: ['pending', 'approved'] },
    });

    if (activeBooking) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete tool with active bookings.',
      });
    }

    await tool.deleteOne();

    res.status(200).json({ success: true, message: 'Tool deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get owner's tools
// @route   GET /api/tools/my-tools
// @access  Private (owner only)
const getMyTools = async (req, res, next) => {
  try {
    const tools = await Tool.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: tools.length, tools });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTools, getTool, createTool, updateTool, deleteTool, getMyTools };
