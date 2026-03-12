const multer = require('multer');
const multerCloudinary = require('multer-storage-cloudinary');
const CloudinaryStorage = multerCloudinary.CloudinaryStorage || multerCloudinary.default?.CloudinaryStorage || multerCloudinary;
const cloudinary = require('../config/cloudinary');

// ── Tool Images ───────────────────────────────────────────────────────────────
const toolStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'toolshare/tools',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto' }],
  },
});

// ── KYC Documents (ID + Selfie) ───────────────────────────────────────────────
const kycStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'toolshare/kyc',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    resource_type: 'auto',
    transformation: [{ quality: 'auto' }],
  },
});

// ── Ownership Proof Documents ─────────────────────────────────────────────────
const docsStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'toolshare/docs',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    resource_type: 'auto',
    transformation: [{ quality: 'auto' }],
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only images and PDFs are allowed.'), false);
};

const upload    = multer({ storage: toolStorage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter });
const uploadKyc = multer({ storage: kycStorage,  limits: { fileSize: 10 * 1024 * 1024 }, fileFilter });
const uploadDocs = multer({ storage: docsStorage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter });

module.exports = { upload, uploadKyc, uploadDocs };