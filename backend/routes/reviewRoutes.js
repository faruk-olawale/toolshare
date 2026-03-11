const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { reviewValidation, mongoIdParam } = require('../middleware/validate');
const { createReview, getUserReviews, getToolReviews, getBookingReviews } = require('../controllers/reviewController');

router.post('/',                      protect, reviewValidation, createReview);
router.get('/user/:userId',           ...mongoIdParam('userId'), getUserReviews);
router.get('/tool/:toolId',           ...mongoIdParam('toolId'), getToolReviews);
router.get('/booking/:bookingId',     protect, ...mongoIdParam('bookingId'), getBookingReviews);

module.exports = router;