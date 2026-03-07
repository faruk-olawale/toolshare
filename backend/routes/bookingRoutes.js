const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const {
  createBooking, getToolBookings, getRenterBookings, getOwnerBookings,
  approveBooking, rejectBooking, completeBooking, cancelBooking,
  getCancellationPolicyPreview, getBookingById,
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

router.post('/',
  protect, authorize('renter'),
  [
    body('toolId').notEmpty().withMessage('Tool ID is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
  ],
  createBooking
);

router.get('/tool-bookings/:toolId', getToolBookings);
router.get('/my-bookings',     protect, getRenterBookings);
router.get('/owner-bookings',  protect, getOwnerBookings);
router.get('/user',            protect, getRenterBookings);   // legacy
router.get('/owner',           protect, getOwnerBookings);    // legacy

// /:id routes MUST come after all named routes
router.get('/:id/cancel-policy',      protect, getCancellationPolicyPreview);
router.get('/:id',                    protect, getBookingById);
router.put('/:id/approve',            protect, authorize('owner'), approveBooking);
router.put('/:id/reject',             protect, authorize('owner'), rejectBooking);
router.put('/:id/complete',           protect, authorize('owner'), completeBooking);
router.put('/:id/cancel',             protect, cancelBooking);

module.exports = router;