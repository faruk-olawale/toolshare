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
  coordinates: {
    type: { type: String, enum: ['Point'] },
    coordinates: { type: [Number] },
  },
  location: { type: String, required: true, trim: true },
  available:     { type: Boolean, default: true },
  averageRating: { type: Number,  default: null },
  reviewCount:   { type: Number,  default: 0 },
  condition: { type: String, enum: ['Excellent','Good','Fair'], default: 'Good' },

  // Admin verification
  adminVerified: { type: Boolean, default: false },
  adminNote: { type: String, default: null },
  verifiedAt: { type: Date, default: null },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Ownership proof documents
  ownershipDocs: { type: [String], default: [] }, // file paths (receipts, invoices etc)
  ownershipNote: { type: String, default: null },  // owner's explanation
}, { timestamps: true });

toolSchema.index({ name: 'text', description: 'text' });
toolSchema.index({ category: 1, location: 1, available: 1, adminVerified: 1 });

toolSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('Tool', toolSchema);