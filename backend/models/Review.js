const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  bookingId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Booking',  required: true },
  reviewerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
  revieweeId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
  toolId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Tool',     required: true },
  reviewType:  { type: String, enum: ['owner', 'renter'], required: true },

  // Ratings per dimension (1-5)
  ratings: {
    // Renter reviewing Owner
    professionalism: { type: Number, min: 1, max: 5, default: null },
    toolCondition:   { type: Number, min: 1, max: 5, default: null },
    communication:   { type: Number, min: 1, max: 5, default: null },
    // Owner reviewing Renter
    punctuality:     { type: Number, min: 1, max: 5, default: null },
    toolCare:        { type: Number, min: 1, max: 5, default: null },
  },

  overallRating: { type: Number, min: 1, max: 5, required: true },
  comment:       { type: String, trim: true, maxlength: 1000 },
}, { timestamps: true });

// One review per booking per reviewer
reviewSchema.index({ bookingId: 1, reviewerId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);