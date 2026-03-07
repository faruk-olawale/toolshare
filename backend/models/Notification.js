const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:    { type: String, required: true },
  message:  { type: String, required: true },
  type:     {
    type: String,
    enum: ['booking_new', 'booking_approved', 'booking_rejected', 'booking_completed',
           'tool_approved', 'tool_rejected', 'kyc_approved', 'kyc_rejected',
           'payment', 'review', 'dispute', 'system'],
    default: 'system',
  },
  read:     { type: Boolean, default: false },
  link:     { type: String, default: null }, // frontend route to navigate to
  meta:     { type: mongoose.Schema.Types.Mixed, default: {} }, // extra data
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);