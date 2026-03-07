const Tool = require('../models/Tool');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

// Helper: extract public_id from cloudinary URL for deletion
const getPublicId = (url) => {
  if (!url || !url.includes('cloudinary')) return null;
  const parts = url.split('/');
  const filename = parts[parts.length - 1].split('.')[0];
  const folder = parts[parts.length - 2];
  const parentFolder = parts[parts.length - 3];
  return `${parentFolder}/${folder}/${filename}`;
};

const getTools = async (req, res, next) => {
  try {
    const { category, location, minPrice, maxPrice, search, page = 1, limit = 12 } = req.query;
    const query = { adminVerified: true, available: true };
    if (category) query.category = category;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (minPrice || maxPrice) query.pricePerDay = {
      ...(minPrice && { $gte: Number(minPrice) }),
      ...(maxPrice && { $lte: Number(maxPrice) }),
    };
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];

    const total = await Tool.countDocuments(query);
    const tools = await Tool.find(query)
      .populate('ownerId', 'name location verified kyc')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({ success: true, count: tools.length, total, pages: Math.ceil(total / limit), currentPage: Number(page), tools });
  } catch (error) { next(error); }
};

const getTool = async (req, res, next) => {
  try {
    const tool = await Tool.findById(req.params.id).populate('ownerId', 'name location phone verified kyc');
    if (!tool) return res.status(404).json({ success: false, message: 'Tool not found.' });
    res.status(200).json({ success: true, tool });
  } catch (error) { next(error); }
};

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

    // Cloudinary returns secure_url/path as URL; local disk returns absolute path — convert to relative
    const getFileUrl = (f) => {
      // Always trim whitespace/newlines from URLs (multer-storage-cloudinary can include them)
      if (f.secure_url) return f.secure_url.trim();
      if (f.path && f.path.startsWith('http')) return f.path.trim();
      // Local disk — return just the filename so frontend can request /uploads/...
      return `/uploads/${f.fieldname === 'ownershipDocs' ? 'docs' : 'tools'}/${f.filename}`;
    };

    const images       = (req.files?.images        || []).map(getFileUrl);
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
  } catch (error) { console.error('createTool error:', error.message, error); next(error); }
};

const updateTool = async (req, res, next) => {
  try {
    const tool = await Tool.findById(req.params.id);
    if (!tool) return res.status(404).json({ success: false, message: 'Tool not found.' });
    if (tool.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized.' });

    const { name, category, description, pricePerDay, location, condition, available, ownershipNote } = req.body;
    const newImages = (req.files?.images || []).map(f => f.path || f.secure_url);
    const newDocs = (req.files?.ownershipDocs || []).map(f => f.path || f.secure_url);

    // Delete old images from Cloudinary if replacing
    if (newImages.length > 0 && tool.images?.length > 0) {
      for (const img of tool.images) {
        const pid = getPublicId(img);
        if (pid) await cloudinary.uploader.destroy(pid).catch(() => {});
      }
    }

    const updated = await Tool.findByIdAndUpdate(req.params.id, {
      name, category, description,
      pricePerDay: Number(pricePerDay),
      location, condition, available, ownershipNote,
      ...(newImages.length > 0 && { images: newImages }),
      ...(newDocs.length > 0 && { ownershipDocs: newDocs }),
      adminVerified: false,
    }, { new: true, runValidators: true });

    res.status(200).json({ success: true, message: 'Tool updated and resubmitted for review.', tool: updated });
  } catch (error) { next(error); }
};

const deleteTool = async (req, res, next) => {
  try {
    const tool = await Tool.findById(req.params.id);
    if (!tool) return res.status(404).json({ success: false, message: 'Tool not found.' });
    if (tool.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized.' });

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

const getMyTools = async (req, res, next) => {
  try {
    const tools = await Tool.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: tools.length, tools });
  } catch (error) { next(error); }
};


// GET /api/tools/nearby?lng=&lat=&radius=
const getNearbyTools = async (req, res, next) => {
  try {
    const { lng, lat, radius = 10000 } = req.query; // radius in metres, default 10km
    if (!lng || !lat)
      return res.status(400).json({ success: false, message: 'lng and lat are required.' });

    const tools = await Tool.find({
      adminVerified: true,
      available: true,
      'coordinates.coordinates': { $exists: true, $ne: null },
      coordinates: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius),
        },
      },
    }).populate('ownerId', 'name averageRating reviewCount').limit(50);

    res.status(200).json({ success: true, count: tools.length, tools });
  } catch (error) { next(error); }
};

module.exports = { getTools, getNearbyTools, getTool, createTool, updateTool, deleteTool, getMyTools };