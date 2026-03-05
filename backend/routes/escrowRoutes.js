const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { confirmReceipt, confirmReturn, raiseDispute, resolveDispute, getEscrowStatus } = require('../controllers/escrowController');

router.get('/:bookingId/status', protect, getEscrowStatus);
router.post('/:bookingId/confirm-receipt', protect, authorize('renter'), confirmReceipt);
router.post('/:bookingId/confirm-return', protect, authorize('owner'), confirmReturn);
router.post('/:bookingId/dispute', protect, raiseDispute);
router.put('/:bookingId/resolve', protect, authorize('admin'), resolveDispute);

module.exports = router;