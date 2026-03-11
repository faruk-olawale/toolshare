const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  phone: { type: String, trim: true },
  location: { type: String, trim: true },
  role: { type: String, enum: ['owner', 'renter', 'admin'], required: true },
  verified: { type: Boolean, default: false },
  avatar: { type: String, default: null },
  googleId: { type: String, default: null },
  averageRating: { type: Number, default: null },
  reviewCount:   { type: Number, default: 0 },

  // KYC Verification
  kyc: {
    status: { type: String, enum: ['not_submitted', 'pending', 'approved', 'rejected'], default: 'not_submitted' },
    idType: { type: String, enum: ['nin', 'passport', 'drivers_license', 'voters_card', null], default: null },
    idNumber: { type: String, default: null },
    idDocument: { type: String, default: null },   // file path
    selfie: { type: String, default: null },        // file path
    rejectionReason: { type: String, default: null },
    submittedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },

  // Password reset
  resetPasswordToken:   { type: String, default: null, select: false },
  resetPasswordExpires: { type: Date,   default: null, select: false },

  // Account suspension
  suspended: { type: Boolean, default: false },
  suspendedAt: { type: Date, default: null },
  suspendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  suspensionReason: { type: String, default: null },
  suspensionHistory: [{
    action: { type: String, enum: ['suspended', 'unsuspended'] },
    reason: { type: String },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  }],

  bankDetails: {
    bankName: { type: String, default: null },
    accountNumber: { type: String, default: null },
    accountName: { type: String, default: null },
    bankCode: { type: String, default: null },
    recipientCode: { type: String, default: null },
  },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  if (this.passwordHash.startsWith('google_')) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

userSchema.methods.comparePassword = async function (pw) {
  return await bcrypt.compare(pw, this.passwordHash);
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.passwordHash;
  return user;
};

module.exports = mongoose.model('User', userSchema);