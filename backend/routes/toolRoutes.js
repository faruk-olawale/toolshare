const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getTools,
  getTool,
  createTool,
  updateTool,
  deleteTool,
  getMyTools,
} = require('../controllers/toolController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', getTools);
router.get('/my-tools', protect, authorize('owner'), getMyTools);
router.get('/:id', getTool);

// Protected owner routes
router.post(
  '/',
  protect,
  authorize('owner'),
  upload.array('images', 5),
  [
    body('name').trim().notEmpty().withMessage('Tool name is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('pricePerDay').isNumeric().withMessage('Valid price per day is required'),
    body('location').trim().notEmpty().withMessage('Location is required'),
  ],
  createTool
);

router.put('/:id', protect, authorize('owner'), upload.array('images', 5), updateTool);
router.delete('/:id', protect, authorize('owner'), deleteTool);

module.exports = router;
