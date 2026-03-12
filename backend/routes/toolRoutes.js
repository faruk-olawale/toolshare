const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { protect, authorize } = require('../middleware/auth');
const { toolValidation, toolUpdateValidation, mongoIdParam } = require('../middleware/validate');
const {
  getTools, getTool, createTool, updateTool, deleteTool, getMyTools, getNearbyTools,
} = require('../controllers/toolController');

const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME &&
                      process.env.CLOUDINARY_API_KEY &&
                      process.env.CLOUDINARY_API_SECRET;

let combinedUpload;

if (hasCloudinary) {
  const multerCloudinary = require('multer-storage-cloudinary');
  const CloudinaryStorage = multerCloudinary.CloudinaryStorage || multerCloudinary.default?.CloudinaryStorage || multerCloudinary;
  const cloudinary = require('../config/cloudinary');
  const combinedStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const isDoc = file.fieldname === 'ownershipDocs';
      return {
        folder: isDoc ? 'toolshare/docs' : 'toolshare/tools',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
        resource_type: 'auto',
        transformation: isDoc ? [] : [{ width: 1200, height: 900, crop: 'limit', quality: 'auto' }],
      };
    },
  });
  combinedUpload = multer({ storage: combinedStorage, limits: { fileSize: 10 * 1024 * 1024 } })
    .fields([{ name: 'images', maxCount: 5 }, { name: 'ownershipDocs', maxCount: 5 }]);
} else {
  const uploadsDir = path.join(__dirname, '../uploads');
  ['tools','docs'].forEach(d => {
    const dir = path.join(uploadsDir, d);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
  const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(uploadsDir, file.fieldname === 'ownershipDocs' ? 'docs' : 'tools'));
    },
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  });
  combinedUpload = multer({ storage: diskStorage, limits: { fileSize: 10 * 1024 * 1024 } })
    .fields([{ name: 'images', maxCount: 5 }, { name: 'ownershipDocs', maxCount: 5 }]);
}

router.get('/',           getTools);
router.get('/nearby',     getNearbyTools);
router.get('/my-tools',   protect, authorize('owner'), getMyTools);
router.get('/:id',        ...mongoIdParam('id'), getTool);
router.post('/',          protect, authorize('owner'), combinedUpload, toolValidation, createTool);
router.put('/:id',        protect, authorize('owner'), ...mongoIdParam('id'), combinedUpload, toolUpdateValidation, updateTool);
router.delete('/:id',     protect, authorize('owner'), ...mongoIdParam('id'), deleteTool);

module.exports = router;