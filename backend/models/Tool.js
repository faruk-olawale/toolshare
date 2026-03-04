const mongoose = require('mongoose');

const toolSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Tool name is required'],
      trim: true,
      maxlength: [150, 'Tool name cannot exceed 150 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Construction',
        'Agriculture',
        'Electrical',
        'Plumbing',
        'Woodworking',
        'Gardening',
        'Transportation',
        'Cleaning',
        'Safety',
        'Other',
      ],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    pricePerDay: {
      type: Number,
      required: [true, 'Price per day is required'],
      min: [0, 'Price cannot be negative'],
    },
    images: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    available: {
      type: Boolean,
      default: true,
    },
    condition: {
      type: String,
      enum: ['Excellent', 'Good', 'Fair'],
      default: 'Good',
    },
  },
  { timestamps: true }
);

// Index for search
toolSchema.index({ name: 'text', description: 'text' });
toolSchema.index({ category: 1, location: 1, available: 1 });

module.exports = mongoose.model('Tool', toolSchema);
