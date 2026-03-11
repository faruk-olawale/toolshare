const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const { cancelBookingValidation, mongoIdParam } = require('../middleware/validate');
const {
  createBooking, getToolBookings, getRenterBookings, getOwnerBookings,
  approveBooking, rejectBooking, completeBooking, cancelBooking,
  getCancellationPolicyPreview, getBookingById, reportNonReturn,
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.post('/',
  protect, authorize('renter'),
  [
    body('toolId').notEmpty().withMessage('Tool ID is required').isMongoId().withMessage('Invalid tool ID'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
  ],
  validate,
  createBooking
);

router.get('/tool-bookings/:toolId',  ...mongoIdParam('toolId'), getToolBookings);
router.get('/my-bookings',            protect, getRenterBookings);
router.get('/owner-bookings',         protect, getOwnerBookings);
router.get('/user',                   protect, getRenterBookings);
router.get('/owner',                  protect, getOwnerBookings);

router.get('/:id/cancel-policy',      protect, ...mongoIdParam('id'), getCancellationPolicyPreview);
router.put('/:id/non-return',         protect, authorize('owner'), ...mongoIdParam('id'), reportNonReturn);
router.get('/:id',                    protect, ...mongoIdParam('id'), getBookingById);
router.put('/:id/approve',            protect, authorize('owner'), ...mongoIdParam('id'), approveBooking);
router.put('/:id/reject',             protect, authorize('owner'), ...mongoIdParam('id'), rejectBooking);
router.put('/:id/complete',           protect, authorize('owner'), ...mongoIdParam('id'), completeBooking);
router.put('/:id/cancel',             protect, ...mongoIdParam('id'), cancelBookingValidation, cancelBooking);

module.exports = router;