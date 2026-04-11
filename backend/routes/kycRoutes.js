const express = require('express');
const router = express.Router();
const multer = require('multer');

const { protect } = require('../middleware/auth');
const { submitKyc, getKycStatus } = require('../controllers/kycController');

// ─────────────────────────────────────────────
// 📦 FILE UPLOAD (SIMPLE & STABLE)
// ─────────────────────────────────────────────
const storage = multer.memoryStorage(); // 🔥 safer for Cloudinary

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf'
    ];

    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, WEBP, PDF allowed'));
  },
});

const uploadKyc = upload.fields([
  { name: 'idDocument', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
]);

// ─────────────────────────────────────────────
// 🚀 ROUTES
// ─────────────────────────────────────────────
router.get('/status', protect, getKycStatus);

router.post('/submit', protect, (req, res, next) => {
  uploadKyc(req, res, (err) => {
    if (err) {
      console.error('❌ Upload error:', err.message);

      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    next();
  });
}, submitKyc);

// ✅ IMPORTANT
module.exports = router;