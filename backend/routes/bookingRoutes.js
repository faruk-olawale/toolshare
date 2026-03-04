const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createBooking,
  getRenterBookings,
  getOwnerBookings,
  approveBooking,
  rejectBooking,
  completeBooking,
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

router.post(
  '/',
  protect,
  authorize('renter'),
  [
    body('toolId').notEmpty().withMessage('Tool ID is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
  ],
  createBooking
);

router.get('/user', protect, authorize('renter'), getRenterBookings);
router.get('/owner', protect, authorize('owner'), getOwnerBookings);

router.put('/:id/approve', protect, authorize('owner'), approveBooking);
router.put('/:id/reject', protect, authorize('owner'), rejectBooking);
router.put('/:id/complete', protect, authorize('owner'), completeBooking);

module.exports = router;
