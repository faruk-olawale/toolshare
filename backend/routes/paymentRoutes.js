const express = require('express');
const router = express.Router();
const { initiatePayment, verifyPayment, paystackWebhook, saveBankDetails, getBanks, getPaymentByBooking } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.post('/webhook', express.raw({ type: 'application/json' }), paystackWebhook);
router.get('/banks', getBanks);
router.post('/initiate', protect, authorize('renter'), initiatePayment);
router.post('/verify', protect, verifyPayment);
router.post('/bank-details', protect, authorize('owner'), saveBankDetails);
router.get('/:bookingId', protect, getPaymentByBooking);

module.exports = router;