const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

// Tool images
const toolStorage = multer.diskStorage({
  destination: (req, file, cb) => { const d = path.join(__dirname, '../uploads/tools'); ensureDir(d); cb(null, d); },
  filename: (req, file, cb) => cb(null, `tool-${uuidv4()}${path.extname(file.originalname)}`),
});

// KYC documents (ID + selfie)
const kycStorage = multer.diskStorage({
  destination: (req, file, cb) => { const d = path.join(__dirname, '../uploads/kyc'); ensureDir(d); cb(null, d); },
  filename: (req, file, cb) => cb(null, `kyc-${uuidv4()}${path.extname(file.originalname)}`),
});

// Ownership proof documents
const docsStorage = multer.diskStorage({
  destination: (req, file, cb) => { const d = path.join(__dirname, '../uploads/docs'); ensureDir(d); cb(null, d); },
  filename: (req, file, cb) => cb(null, `doc-${uuidv4()}${path.extname(file.originalname)}`),
});

const imageFilter = (req, file, cb) => {
  /jpeg|jpg|png|webp/i.test(path.extname(file.originalname)) && /jpeg|jpg|png|webp/i.test(file.mimetype)
    ? cb(null, true) : cb(new Error('Only image files allowed.'), false);
};

const docFilter = (req, file, cb) => {
  /jpeg|jpg|png|webp|pdf/i.test(path.extname(file.originalname))
    ? cb(null, true) : cb(new Error('Only images and PDFs allowed.'), false);
};

const upload = multer({ storage: toolStorage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: imageFilter });
const uploadKyc = multer({ storage: kycStorage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: docFilter });
const uploadDocs = multer({ storage: docsStorage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: docFilter });

module.exports = { upload, uploadKyc, uploadDocs };