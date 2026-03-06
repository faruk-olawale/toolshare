const Review  = require('../models/Review');
const Booking = require('../models/Booking');
const User    = require('../models/User');
const Tool    = require('../models/Tool');

// ── POST /api/reviews ─────────────────────────────────────────────────────────
const createReview = async (req, res, next) => {
  try {
    const { bookingId, ratings, overallRating, comment } = req.body;

    if (!bookingId || !overallRating)
      return res.status(400).json({ success: false, message: 'Booking ID and overall rating are required.' });

    const booking = await Booking.findById(bookingId)
      .populate('renterId', 'name')
      .populate('ownerId',  'name');

    if (!booking)
      return res.status(404).json({ success: false, message: 'Booking not found.' });

    if (booking.status !== 'completed')
      return res.status(400).json({ success: false, message: 'Reviews can only be left after a booking is completed.' });

    const isRenter = booking.renterId._id.toString() === req.user._id.toString();
    const isOwner  = booking.ownerId._id.toString()  === req.user._id.toString();

    if (!isRenter && !isOwner)
      return res.status(403).json({ success: false, message: 'You were not part of this booking.' });

    // Duplicate check
    const existing = await Review.findOne({ bookingId, reviewerId: req.user._id });
    if (existing)
      return res.status(400).json({ success: false, message: 'You have already reviewed this booking.' });

    const revieweeId = isRenter ? booking.ownerId._id : booking.renterId._id;
    const reviewType = isRenter ? 'owner' : 'renter';

    const review = await Review.create({
      bookingId,
      reviewerId:  req.user._id,
      revieweeId,
      toolId:      booking.toolId,
      reviewType,
      ratings,
      overallRating: Number(overallRating),
      comment,
    });

    // Recompute reviewee average rating
    await updateUserRating(revieweeId);

    // Recompute tool average rating (only renter→owner reviews count for tool)
    if (isRenter) await updateToolRating(booking.toolId);

    const populated = await Review.findById(review._id)
      .populate('reviewerId', 'name')
      .populate('revieweeId', 'name');

    res.status(201).json({ success: true, message: 'Review submitted! Thank you.', review: populated });
  } catch (error) {
    if (error.code === 11000)
      return res.status(400).json({ success: false, message: 'You have already reviewed this booking.' });
    next(error);
  }
};

// ── GET /api/reviews/user/:userId ─────────────────────────────────────────────
const getUserReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ revieweeId: req.params.userId })
      .populate('reviewerId', 'name')
      .populate('toolId',     'name images')
      .sort({ createdAt: -1 });

    const avg = reviews.length
      ? (reviews.reduce((s, r) => s + r.overallRating, 0) / reviews.length).toFixed(1)
      : null;

    res.status(200).json({ success: true, count: reviews.length, averageRating: avg, reviews });
  } catch (error) { next(error); }
};

// ── GET /api/reviews/tool/:toolId ─────────────────────────────────────────────
const getToolReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ toolId: req.params.toolId, reviewType: 'owner' })
      .populate('reviewerId', 'name')
      .sort({ createdAt: -1 });

    const avg = reviews.length
      ? (reviews.reduce((s, r) => s + r.overallRating, 0) / reviews.length).toFixed(1)
      : null;

    res.status(200).json({ success: true, count: reviews.length, averageRating: avg, reviews });
  } catch (error) { next(error); }
};

// ── GET /api/reviews/booking/:bookingId ───────────────────────────────────────
const getBookingReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ bookingId: req.params.bookingId })
      .populate('reviewerId', 'name');
    res.status(200).json({ success: true, reviews });
  } catch (error) { next(error); }
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const updateUserRating = async (userId) => {
  const reviews = await Review.find({ revieweeId: userId });
  if (!reviews.length) return;
  const avg = reviews.reduce((s, r) => s + r.overallRating, 0) / reviews.length;
  await User.findByIdAndUpdate(userId, {
    averageRating: Math.round(avg * 10) / 10,
    reviewCount:   reviews.length,
  });
};

const updateToolRating = async (toolId) => {
  const reviews = await Review.find({ toolId, reviewType: 'owner' });
  if (!reviews.length) return;
  const avg = reviews.reduce((s, r) => s + r.overallRating, 0) / reviews.length;
  await Tool.findByIdAndUpdate(toolId, {
    averageRating: Math.round(avg * 10) / 10,
    reviewCount:   reviews.length,
  });
};

module.exports = { createReview, getUserReviews, getToolReviews, getBookingReviews };