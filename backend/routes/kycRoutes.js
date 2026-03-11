const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { protect } = require('../middleware/auth');
const { kycValidation } = require('../middleware/validate');
const { submitKyc, getKycStatus } = require('../controllers/kycController');

const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME &&
                      process.env.CLOUDINARY_API_KEY &&
                      process.env.CLOUDINARY_API_SECRET;

let uploadKyc;

if (hasCloudinary) {
  const { CloudinaryStorage } = require('multer-storage-cloudinary');
  const cloudinary = require('../config/cloudinary');
  const kycStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder: 'toolshare/kyc',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
      resource_type: 'auto',
    }),
  });
  uploadKyc = multer({ storage: kycStorage, limits: { fileSize: 10 * 1024 * 1024 } })
    .fields([{ name: 'idDocument', maxCount: 1 }, { name: 'selfie', maxCount: 1 }]);
} else {
  const uploadsDir = path.join(__dirname, '../uploads/kyc');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  });
  uploadKyc = multer({ storage: diskStorage, limits: { fileSize: 10 * 1024 * 1024 } })
    .fields([{ name: 'idDocument', maxCount: 1 }, { name: 'selfie', maxCount: 1 }]);
}

router.get('/status', protect, getKycStatus);
router.post('/submit', protect, (req, res, next) => {
  uploadKyc(req, res, (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message || 'File upload failed.' });
    next();
  });
}, kycValidation, submitKyc);

module.exports = router;