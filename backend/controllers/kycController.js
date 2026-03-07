const User = require('../models/User');
const { sendEmail } = require('../utils/sendEmail');

// POST /api/kyc/submit
const submitKyc = async (req, res, next) => {
  try {
    const { idType, idNumber } = req.body;

    if (!idType || !idNumber)
      return res.status(400).json({ success: false, message: 'ID type and number are required.' });

    if (!req.files?.idDocument?.[0])
      return res.status(400).json({ success: false, message: 'ID document image is required.' });

    if (!req.files?.selfie?.[0])
      return res.status(400).json({ success: false, message: 'Selfie photo is required.' });

    const idFile  = req.files.idDocument[0];
    const selfFile = req.files.selfie[0];

    // Handle both Cloudinary (has .path or .secure_url) and local disk (has .filename)
    const getFileUrl = (file) => {
      if (file.path && file.path.startsWith('http')) return file.path.trim();   // Cloudinary URL
      if (file.secure_url) return file.secure_url.trim();                        // Cloudinary secure_url
      if (file.path) return `/uploads/kyc/${file.filename}`;                     // local path
      return `/uploads/kyc/${file.filename}`;                                    // fallback
    };

    const idDocUrl  = getFileUrl(idFile);
    const selfieUrl = getFileUrl(selfFile);

    const user = await User.findByIdAndUpdate(req.user._id, {
      kyc: {
        status: 'pending',
        idType,
        idNumber,
        idDocument: idDocUrl,
        selfie: selfieUrl,
        rejectionReason: null,
        submittedAt: new Date(),
      },
    }, { new: true });

    sendEmail({
      to: user.email,
      subject: '📋 KYC Submitted — Under Review',
      template: 'kycSubmitted',
      data: { name: user.name },
    });

    res.status(200).json({
      success: true,
      message: 'KYC submitted! Our team will review within 24 hours.',
      kyc: user.kyc,
    });
  } catch (error) {
    console.error('KYC submit error:', error);
    next(error);
  }
};

// GET /api/kyc/status
const getKycStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('kyc name email role');
    res.status(200).json({ success: true, kyc: user.kyc, kycRequired: user.role !== 'admin' });
  } catch (error) { next(error); }
};

module.exports = { submitKyc, getKycStatus };