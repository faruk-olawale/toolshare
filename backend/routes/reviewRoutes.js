const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { createReview, getUserReviews, getToolReviews, getBookingReviews } = require('../controllers/reviewController');

router.post('/',                      protect, createReview);
router.get('/user/:userId',                    getUserReviews);
router.get('/tool/:toolId',                    getToolReviews);
router.get('/booking/:bookingId',     protect, getBookingReviews);

module.exports = router;