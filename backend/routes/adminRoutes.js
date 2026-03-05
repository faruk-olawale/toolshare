const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getStats, getPendingTools, getAllTools, verifyTool, rejectTool,
  getAllUsers, deleteUser, getAllBookings,
} = require('../controllers/adminController');

const admin = [protect, authorize('admin')];

router.get('/stats', ...admin, getStats);
router.get('/tools/pending', ...admin, getPendingTools);
router.get('/tools', ...admin, getAllTools);
router.put('/tools/:id/verify', ...admin, verifyTool);
router.put('/tools/:id/reject', ...admin, rejectTool);
router.get('/users', ...admin, getAllUsers);
router.delete('/users/:id', ...admin, deleteUser);
router.get('/bookings', ...admin, getAllBookings);

module.exports = router;