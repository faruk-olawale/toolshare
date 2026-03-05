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

    const user = await User.findByIdAndUpdate(req.user._id, {
      kyc: {
        status: 'pending',
        idType,
        idNumber,
        idDocument: `/uploads/kyc/${req.files.idDocument[0].filename}`,
        selfie: `/uploads/kyc/${req.files.selfie[0].filename}`,
        rejectionReason: null,
        submittedAt: new Date(),
      },
    }, { new: true });

    res.status(200).json({ success: true, message: 'KYC submitted! Our team will review within 24 hours.', kyc: user.kyc });
  } catch (error) { next(error); }
};

// GET /api/kyc/status
const getKycStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('kyc name email role');
    res.status(200).json({ success: true, kyc: user.kyc, kycRequired: user.role !== 'admin' });
  } catch (error) { next(error); }
};

module.exports = { submitKyc, getKycStatus };