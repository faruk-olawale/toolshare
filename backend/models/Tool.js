const mongoose = require('mongoose');

const toolSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true, maxlength: 150 },
  category: {
    type: String, required: true,
    enum: ['Construction','Agriculture','Electrical','Plumbing','Woodworking','Gardening','Transportation','Cleaning','Safety','Other'],
  },
  description: { type: String, required: true, maxlength: 1000 },
  pricePerDay: { type: Number, required: true, min: 0 },
  images: { type: [String], default: [] },
  location: { type: String, required: true, trim: true },
  available: { type: Boolean, default: true },
  condition: { type: String, enum: ['Excellent','Good','Fair'], default: 'Good' },
  // Admin verification
  adminVerified: { type: Boolean, default: false },
  adminNote: { type: String, default: null },
  verifiedAt: { type: Date, default: null },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

toolSchema.index({ name: 'text', description: 'text' });
toolSchema.index({ category: 1, location: 1, available: 1, adminVerified: 1 });

module.exports = mongoose.model('Tool', toolSchema);