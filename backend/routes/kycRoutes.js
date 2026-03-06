const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const { protect } = require('../middleware/auth');
const { submitKyc, getKycStatus } = require('../controllers/kycController');

const kycStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'toolshare/kyc',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    resource_type: 'auto',
    transformation: [{ quality: 'auto' }],
  }),
});

const uploadKyc = multer({
  storage: kycStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
  { name: 'idDocument', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
]);

router.get('/status', protect, getKycStatus);
router.post('/submit', protect, uploadKyc, submitKyc);

module.exports = router;