const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { upload, uploadDocs } = require('../middleware/upload');
const {
  getTools, getTool, createTool, updateTool, deleteTool, getMyTools,
} = require('../controllers/toolController');

// Combined upload: tool images + ownership docs
const toolUpload = (req, res, next) => {
  const multerUpload = require('../middleware/upload');
  const combined = require('multer')({
    storage: require('multer').diskStorage({
      destination: (req, file, cb) => {
        const fs = require('fs');
        const path = require('path');
        const isDoc = file.fieldname === 'ownershipDocs';
        const dir = path.join(__dirname, `../uploads/${isDoc ? 'docs' : 'tools'}`);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const { v4: uuidv4 } = require('uuid');
        const path = require('path');
        const prefix = file.fieldname === 'ownershipDocs' ? 'doc' : 'tool';
        cb(null, `${prefix}-${uuidv4()}${path.extname(file.originalname)}`);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
  });
  combined.fields([
    { name: 'images', maxCount: 5 },
    { name: 'ownershipDocs', maxCount: 5 },
  ])(req, res, next);
};

router.get('/', getTools);
router.get('/my-tools', protect, authorize('owner'), getMyTools);
router.get('/:id', getTool);
router.post('/', protect, authorize('owner'), toolUpload, createTool);
router.put('/:id', protect, authorize('owner'), toolUpload, updateTool);
router.delete('/:id', protect, authorize('owner'), deleteTool);

module.exports = router;