const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const { protect }                 = require('../middleware/auth');
const { submitKyc, getKycStatus } = require('../controllers/kycController');

// ── Memory storage — controller streams buffer directly to Cloudinary ─────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only JPG, PNG, WebP and PDF allowed.`));
    }
  },
}).fields([
  { name: 'idDocument', maxCount: 1 },
  { name: 'selfie',     maxCount: 1 },
]);

// ── Fix: Node 18+ defines req.query as a getter-only property on ──────────────
// IncomingMessage. Some multer versions try to write to it, causing:
// "Cannot set property query of #<IncomingMessage> which has only a getter"
// This middleware makes req.query writable before multer touches the request.
const patchReqQuery = (req, res, next) => {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(req, 'query')
      || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(req), 'query');

    if (descriptor && !descriptor.set) {
      const currentValue = req.query;
      Object.defineProperty(req, 'query', {
        get: () => req._queryCache || currentValue || {},
        set: (val) => { req._queryCache = val; },
        configurable: true,
        enumerable:   true,
      });
    }
  } catch (_) {
    // Already writable — no action needed
  }
  next();
};

router.get('/status', protect, getKycStatus);

router.post('/submit', protect, patchReqQuery, (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE')
        return res.status(400).json({ success: false, message: 'File too large. Maximum is 10MB per file.' });
      if (err.code === 'LIMIT_UNEXPECTED_FILE')
        return res.status(400).json({ success: false, message: 'Unexpected file field. Expected "idDocument" and "selfie".' });
      return res.status(400).json({ success: false, message: err.message || 'File upload failed.' });
    }
    next();
  });
}, submitKyc);

module.exports = router;