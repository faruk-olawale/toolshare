const Tool     = require('../models/Tool');
const User     = require('../models/User');
const Booking  = require('../models/Booking');
const cloudinary = require('../config/cloudinary');

// ✅ FIX: Robust public_id extraction using URL path segments after /upload/
const getPublicId = (url) => {
  if (!url || !url.includes('cloudinary')) return null;
  try {
    // Cloudinary URLs look like: https://res.cloudinary.com/<cloud>/image/upload/v123/<public_id>.ext
    const uploadIdx = url.indexOf('/upload/');
    if (uploadIdx === -1) return null;
    const afterUpload = url.slice(uploadIdx + 8); // skip '/upload/'
    // Remove version segment (v1234567890/)
    const withoutVersion = afterUpload.replace(/^v\d+\//, '');
    // Remove extension
    return withoutVersion.replace(/\.[^/.]+$/, '');
  } catch {
    return null;
  }
};

// ─── GET TOOLS (browse) ───────────────────────────────────────────────────────
const getTools = async (req, res, next) => {
  try {
    const {
      search, category, location,
      minPrice, maxPrice,
      page = 1, limit = 12,
      showAll,
    } = req.query;

    const query = { adminVerified: true };

    // ✅ FIX: proper boolean coercion for showAll
    const includeUnavailable = showAll === 'true' || showAll === '1';
    if (!includeUnavailable) {
      query.available = true;
    }

    if (search) {
      query.$or = [
        { name:        { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category:    { $regex: search, $options: 'i' } },
      ];
    }
    if (category) query.category = category;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (minPrice || maxPrice) {
      query.pricePerDay = {};
      if (minPrice) query.pricePerDay.$gte = Number(minPrice);
      if (maxPrice) query.pricePerDay.$lte = Number(maxPrice);
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Tool.countDocuments(query);
    const tools = await Tool.find(query)
      .populate('ownerId', 'name email phone location avatar')
      .sort({ available: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true, total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
      tools,
    });
  } catch (error) { next(error); }
};

// ─── GET SINGLE TOOL ──────────────────────────────────────────────────────────
const getTool = async (req, res, next) => {
  try {
    // ✅ FIX: removed 'kyc' from populate — never expose KYC data publicly
    const tool = await Tool.findById(req.params.id)
      .populate('ownerId', 'name location phone verified');
    if (!tool) return res.status(404).json({ success: false, message: 'Tool not found.' });
    res.status(200).json({ success: true, tool });
  } catch (error) { next(error); }
};

// ─── CREATE TOOL ──────────────────────────────────────────────────────────────
const createTool = async (req, res, next) => {
  try {
    const owner = await User.findById(req.user._id);
    if (owner.kyc?.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'You must complete identity verification (KYC) before listing tools.',
        kycStatus: owner.kyc?.status || 'not_submitted',
      });
    }

    const { name, category, description, pricePerDay, location, condition, ownershipNote } = req.body;

    const getFileUrl = (f) => {
      if (f.secure_url) return f.secure_url.trim();
      if (f.path && f.path.startsWith('http')) return f.path.trim();
      return `/uploads/${f.fieldname === 'ownershipDocs' ? 'docs' : 'tools'}/${f.filename}`;
    };

    const images        = (req.files?.images        || []).map(getFileUrl);
    const ownershipDocs = (req.files?.ownershipDocs || []).map(getFileUrl);

    if (ownershipDocs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one proof of ownership document (receipt, invoice, or purchase record).',
      });
    }

    const tool = await Tool.create({
      ownerId: req.user._id, name, category, description,
      pricePerDay: Number(pricePerDay), images, location,
      condition: condition || 'Good',
      ownershipDocs, ownershipNote,
      adminVerified: false,
    });

    res.status(201).json({
      success: true,
      message: "Tool submitted for admin review! You'll be notified when it goes live.",
      tool,
    });
  } catch (error) { next(error); }
};

// ─── UPDATE TOOL ──────────────────────────────────────────────────────────────
const updateTool = async (req, res, next) => {
  try {
    const tool = await Tool.findById(req.params.id);
    if (!tool) return res.status(404).json({ success: false, message: 'Tool not found.' });
    if (tool.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized.' });

    const { name, category, description, pricePerDay, location, condition, available, ownershipNote } = req.body;
    const newImages = (req.files?.images        || []).map(f => (f.secure_url || f.path || '').trim());
    const newDocs   = (req.files?.ownershipDocs || []).map(f => (f.secure_url || f.path || '').trim());

    // ✅ FIX: only reset adminVerified if actual listing content changed (not availability toggle)
    const contentChanged = name !== undefined || category !== undefined ||
      description !== undefined || pricePerDay !== undefined ||
      location !== undefined || newImages.length > 0 || newDocs.length > 0;

    // ✅ FIX: update DB FIRST, then delete old images — prevents data loss on DB failure
    const oldImages = tool.images || [];
    const updated = await Tool.findByIdAndUpdate(req.params.id, {
      ...(name        !== undefined && { name }),
      ...(category    !== undefined && { category }),
      ...(description !== undefined && { description }),
      ...(pricePerDay !== undefined && { pricePerDay: Number(pricePerDay) }),
      ...(location    !== undefined && { location }),
      ...(condition   !== undefined && { condition }),
      ...(available   !== undefined && { available }),
      ...(ownershipNote !== undefined && { ownershipNote }),
      ...(newImages.length > 0 && { images: newImages }),
      ...(newDocs.length   > 0 && { ownershipDocs: newDocs }),
      ...(contentChanged && { adminVerified: false }),
    }, { new: true, runValidators: true });

    // Delete old Cloudinary images AFTER successful DB update
    if (newImages.length > 0) {
      for (const img of oldImages) {
        const pid = getPublicId(img);
        if (pid) await cloudinary.uploader.destroy(pid).catch(() => {});
      }
    }

    const message = contentChanged
      ? 'Tool updated and resubmitted for review.'
      : 'Tool availability updated.';

    res.status(200).json({ success: true, message, tool: updated });
  } catch (error) { next(error); }
};

// ─── DELETE TOOL ──────────────────────────────────────────────────────────────
const deleteTool = async (req, res, next) => {
  try {
    const tool = await Tool.findById(req.params.id);
    if (!tool) return res.status(404).json({ success: false, message: 'Tool not found.' });
    if (tool.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized.' });

    // ✅ FIX: block deletion if there are active bookings
    const activeBooking = await Booking.findOne({
      toolId: req.params.id,
      status: { $in: ['pending', 'approved'] },
    });
    if (activeBooking) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a tool with active or pending bookings. Cancel or complete them first.',
      });
    }

    // Delete images from Cloudinary
    for (const img of tool.images || []) {
      const pid = getPublicId(img);
      if (pid) await cloudinary.uploader.destroy(pid).catch(() => {});
    }
    for (const doc of tool.ownershipDocs || []) {
      const pid = getPublicId(doc);
      if (pid) await cloudinary.uploader.destroy(pid, { resource_type: 'auto' }).catch(() => {});
    }

    await Tool.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Tool deleted.' });
  } catch (error) { next(error); }
};

// ─── MY TOOLS ─────────────────────────────────────────────────────────────────
const getMyTools = async (req, res, next) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip  = (Number(page) - 1) * Number(limit);
    const query = { ownerId: req.user._id };
    const [tools, total] = await Promise.all([
      Tool.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Tool.countDocuments(query),
    ]);
    res.status(200).json({
      success: true, count: tools.length, total,
      page: Number(page), pages: Math.ceil(total / Number(limit)), tools,
    });
  } catch (error) { next(error); }
};

// ─── NEARBY TOOLS ────────────────────────────────────────────────────────────
const getNearbyTools = async (req, res, next) => {
  try {
    const { lng, lat, radius = 10000, page = 1, limit = 20 } = req.query;
    if (!lng || !lat)
      return res.status(400).json({ success: false, message: 'lng and lat are required.' });

    const skip = (Number(page) - 1) * Number(limit);

    // ✅ FIX: added pagination (was hardcoded limit 50 with no total)
    const query = {
      adminVerified: true,
      available: true,
      'coordinates.coordinates': { $exists: true, $ne: null },
      coordinates: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius),
        },
      },
    };

    const [tools, total] = await Promise.all([
      Tool.find(query)
        .populate('ownerId', 'name')
        .skip(skip)
        .limit(Number(limit)),
      Tool.countDocuments(query),
    ]);

    res.status(200).json({
      success: true, count: tools.length, total,
      page: Number(page), pages: Math.ceil(total / Number(limit)),
      tools,
    });
  } catch (error) { next(error); }
};

module.exports = { getTools, getNearbyTools, getTool, createTool, updateTool, deleteTool, getMyTools };