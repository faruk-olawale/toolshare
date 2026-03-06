const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const { protect, authorize } = require('../middleware/auth');
const {
  getTools, getTool, createTool, updateTool, deleteTool, getMyTools, getNearbyTools,
} = require('../controllers/toolController');

// Combined storage for tool images + ownership docs
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

const combinedUpload = multer({
  storage: combinedStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
  { name: 'images', maxCount: 5 },
  { name: 'ownershipDocs', maxCount: 5 },
]);

router.get('/', getTools);
router.get('/nearby', getNearbyTools);
router.get('/my-tools', protect, authorize('owner'), getMyTools);
router.get('/:id', getTool);
router.post('/', protect, authorize('owner'), combinedUpload, createTool);
router.put('/:id', protect, authorize('owner'), combinedUpload, updateTool);
router.delete('/:id', protect, authorize('owner'), deleteTool);

module.exports = router;