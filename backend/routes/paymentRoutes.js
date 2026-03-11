const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  initiatePaymentValidation, verifyPaymentValidation,
  bankDetailsValidation, mongoIdParam,
} = require('../middleware/validate');
const {
  initiatePayment, verifyPayment, paystackWebhook,
  saveBankDetails, getBanks, getPaymentByBooking,
} = require('../controllers/paymentController');

router.post('/webhook',       express.raw({ type: 'application/json' }), paystackWebhook);
router.get('/banks',          getBanks);
router.post('/initiate',      protect, authorize('renter'), initiatePaymentValidation, initiatePayment);
router.post('/verify',        protect, verifyPaymentValidation, verifyPayment);
router.post('/bank-details',  protect, authorize('owner'), bankDetailsValidation, saveBankDetails);
router.get('/:bookingId',     protect, ...mongoIdParam('bookingId'), getPaymentByBooking);

module.exports = router;