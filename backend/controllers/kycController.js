const User = require('../models/User');
const { sendEmail } = require('../utils/sendEmail');
const cloudinary = require('../config/cloudinary');

// ─────────────────────────────────────────────
// 📤 UPLOAD TO CLOUDINARY
// ─────────────────────────────────────────────
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'toolshare/kyc' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    stream.end(fileBuffer);
  });
};

// ─────────────────────────────────────────────
// 🆔 SUBMIT KYC
// ─────────────────────────────────────────────
const submitKyc = async (req, res, next) => {
  try {
    const { idType, idNumber } = req.body;

    if (!idType || !idNumber) {
      return res.status(400).json({
        success: false,
        message: 'ID type and number required',
      });
    }

    const idDocFile = req.files?.idDocument?.[0];
    const selfieFile = req.files?.selfie?.[0];

    if (!idDocFile || !selfieFile) {
      return res.status(400).json({
        success: false,
        message: 'Both ID document and selfie are required',
      });
    }

    // 🔥 Upload files
    const [idDocUrl, selfieUrl] = await Promise.all([
      uploadToCloudinary(idDocFile.buffer),
      uploadToCloudinary(selfieFile.buffer),
    ]);

    // 🔥 Save to DB
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        kyc: {
          status: 'pending',
          idType,
          idNumber,
          idDocument: idDocUrl,
          selfie: selfieUrl,
          submittedAt: new Date(),
        },
      },
      { new: true }
    );

    // 🔥 Email (non-blocking)
    sendEmail({
      to: user.email,
      subject: 'KYC Submitted',
      template: 'kycSubmitted',
      data: { name: user.name },
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: 'KYC submitted successfully',
      kyc: user.kyc,
    });

  } catch (error) {
    console.error('❌ KYC ERROR:', error.message);
    next(error);
  }
};

// ─────────────────────────────────────────────
// 📊 GET STATUS
// ─────────────────────────────────────────────
const getKycStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('kyc');

    res.status(200).json({
      success: true,
      kyc: user.kyc,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitKyc,
  getKycStatus,
};