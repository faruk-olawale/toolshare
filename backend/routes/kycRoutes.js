const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadKyc } = require('../middleware/upload');
const { submitKyc, getKycStatus } = require('../controllers/kycController');

router.get('/status', protect, getKycStatus);
router.post('/submit', protect, uploadKyc.fields([
  { name: 'idDocument', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
]), submitKyc);

module.exports = router;