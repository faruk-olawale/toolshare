const Tool = require('../models/Tool');
const User = require('../models/User');

const getTools = async (req, res, next) => {
  try {
    const { category, location, minPrice, maxPrice, search, page = 1, limit = 12 } = req.query;
    const query = { adminVerified: true, available: true };
    if (category) query.category = category;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (minPrice || maxPrice) query.pricePerDay = { ...(minPrice && { $gte: Number(minPrice) }), ...(maxPrice && { $lte: Number(maxPrice) }) };
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];

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

    // KYC check
    if (owner.kyc?.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'You must complete identity verification (KYC) before listing tools.',
        kycStatus: owner.kyc?.status || 'not_submitted',
      });
    }

    const { name, category, description, pricePerDay, location, condition, ownershipNote } = req.body;
    const images = (req.files?.images || []).map(f => `/uploads/tools/${f.filename}`);
    const ownershipDocs = (req.files?.ownershipDocs || []).map(f => `/uploads/docs/${f.filename}`);

    if (ownershipDocs.length === 0) {
      return res.status(400).json({ success: false, message: 'Please upload at least one proof of ownership document (receipt, invoice, or purchase record).' });
    }

    const tool = await Tool.create({
      ownerId: req.user._id, name, category, description,
      pricePerDay: Number(pricePerDay), images, location, condition,
      ownershipDocs, ownershipNote,
      adminVerified: false,
    });

    res.status(201).json({ success: true, message: 'Tool submitted for admin review! You\'ll be notified when it goes live.', tool });
  } catch (error) { next(error); }
};

const updateTool = async (req, res, next) => {
  try {
    const tool = await Tool.findById(req.params.id);
    if (!tool) return res.status(404).json({ success: false, message: 'Tool not found.' });
    if (tool.ownerId.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized.' });

    const { name, category, description, pricePerDay, location, condition, available, ownershipNote } = req.body;
    const newImages = (req.files?.images || []).map(f => `/uploads/tools/${f.filename}`);
    const newDocs = (req.files?.ownershipDocs || []).map(f => `/uploads/docs/${f.filename}`);

    const updated = await Tool.findByIdAndUpdate(req.params.id, {
      name, category, description, pricePerDay: Number(pricePerDay),
      location, condition, available,
      ownershipNote,
      ...(newImages.length > 0 && { images: newImages }),
      ...(newDocs.length > 0 && { ownershipDocs: newDocs }),
      adminVerified: false, // re-submit for review on update
    }, { new: true, runValidators: true });

    res.status(200).json({ success: true, message: 'Tool updated and resubmitted for review.', tool: updated });
  } catch (error) { next(error); }
};

const deleteTool = async (req, res, next) => {
  try {
    const tool = await Tool.findById(req.params.id);
    if (!tool) return res.status(404).json({ success: false, message: 'Tool not found.' });
    if (tool.ownerId.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized.' });
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

module.exports = { getTools, getTool, createTool, updateTool, deleteTool, getMyTools };