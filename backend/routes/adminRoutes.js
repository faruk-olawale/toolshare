const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  rejectToolValidation, rejectKycValidation,
  suspendUserValidation, resolveDisputeValidation, mongoIdParam,
} = require('../middleware/validate');
const {
  getStats, getPendingTools, getAllTools, verifyTool, rejectTool,
  getPendingKyc, approveKyc, rejectKyc,
  getAllUsers, deleteUser, getAllBookings,
  suspendUser, unsuspendUser, resolveDispute,
} = require('../controllers/adminController');

const admin = [protect, authorize('admin')];

router.get('/stats',                    ...admin, getStats);
router.get('/tools/pending',            ...admin, getPendingTools);
router.get('/tools',                    ...admin, getAllTools);
router.put('/tools/:id/verify',         ...admin, ...mongoIdParam('id'), verifyTool);
router.put('/tools/:id/reject',         ...admin, ...mongoIdParam('id'), rejectToolValidation, rejectTool);
router.get('/kyc/pending',              ...admin, getPendingKyc);
router.put('/kyc/:id/approve',          ...admin, ...mongoIdParam('id'), approveKyc);
router.put('/kyc/:id/reject',           ...admin, ...mongoIdParam('id'), rejectKycValidation, rejectKyc);
router.get('/users',                    ...admin, getAllUsers);
router.delete('/users/:id',             ...admin, ...mongoIdParam('id'), deleteUser);
router.put('/users/:id/suspend',        ...admin, ...mongoIdParam('id'), suspendUserValidation, suspendUser);
router.put('/users/:id/unsuspend',      ...admin, ...mongoIdParam('id'), unsuspendUser);
router.get('/bookings',                 ...admin, getAllBookings);
router.put('/bookings/:id/resolve-dispute', ...admin, ...mongoIdParam('id'), resolveDisputeValidation, resolveDispute);

module.exports = router;