const express = require('express');
const router = express.Router();
const {
  initiatePayment,
  verifyPayment,
  saveBankDetails,
  getBanks,
  triggerManualPayout,
  getPaymentByBooking,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.get('/banks', getBanks);                                          // Public - list Nigerian banks
router.post('/initiate', protect, authorize('renter'), initiatePayment); // Renter initiates payment
router.post('/verify', protect, verifyPayment);                          // Verify after Paystack redirect
router.post('/bank-details', protect, authorize('owner'), saveBankDetails); // Owner saves bank account
router.post('/:paymentId/payout', protect, authorize('owner'), triggerManualPayout); // Manual payout
router.get('/:bookingId', protect, getPaymentByBooking);                 // Get payment by booking

module.exports = router;