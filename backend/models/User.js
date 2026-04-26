const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  phone:    { type: String, trim: true },
  location: { type: String, trim: true },
  avatar:   { type: String, default: null },
  googleId: { type: String, default: null },

  // ── Capability model ──────────────────────────────────────────────────────
  // type:    overall account level. Only backend/admin can set 'admin'.
  // canRent: can browse, book, and pay for tools.
  // canList: can create listings, manage tools, receive payouts.
  // onboardingComplete: set to true after /welcome screen is submitted.
  //   New users who haven't completed onboarding get redirected to /welcome.
  type:               { type: String, enum: ['user', 'admin'], default: 'user' },
  canRent:            { type: Boolean, default: true  },
  canList:            { type: Boolean, default: false },
  onboardingComplete: { type: Boolean, default: false },

  // ── Legacy role field — kept for migration safety ─────────────────────────
  // Will be removed in a future release once all users are migrated.
  // Do NOT use this in new code — use type/canRent/canList instead.
  role: {
    type:    String,
    enum:    ['owner', 'renter', 'admin'],
    default: 'renter',
  },

  // ── Trust & verification ──────────────────────────────────────────────────
  verified:      { type: Boolean, default: false },
  averageRating: { type: Number,  default: null },
  reviewCount:   { type: Number,  default: 0 },

  // ── KYC ───────────────────────────────────────────────────────────────────
  kyc: {
    status: {
      type:    String,
      enum:    ['not_submitted', 'pending', 'approved', 'rejected'],
      default: 'not_submitted',
    },
    idType: {
      type:    String,
      enum:    ['nin', 'passport', 'drivers_license', 'voters_card', null],
      default: null,
    },
    idNumber:        { type: String, default: null },
    idDocument:      { type: String, default: null },
    selfie:          { type: String, default: null },
    rejectionReason: { type: String, default: null },
    submittedAt:     { type: Date,   default: null },
    reviewedAt:      { type: Date,   default: null },
    reviewedBy: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },
  },

  // ── Password reset ─────────────────────────────────────────────────────────
  resetPasswordToken:   { type: String, default: null, select: false },
  resetPasswordExpires: { type: Date,   default: null, select: false },

  // ── Account suspension ────────────────────────────────────────────────────
  suspended:        { type: Boolean, default: false },
  suspendedAt:      { type: Date,    default: null },
  suspendedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  suspensionReason: { type: String,  default: null },
  suspensionHistory: [{
    action: { type: String, enum: ['suspended', 'unsuspended'] },
    reason: { type: String },
    by:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at:     { type: Date, default: Date.now },
  }],

  // ── Payouts ───────────────────────────────────────────────────────────────
  bankDetails: {
    bankName:       { type: String, default: null },
    accountNumber:  { type: String, default: null },
    accountName:    { type: String, default: null },
    bankCode:       { type: String, default: null },
    recipientCode:  { type: String, default: null },
  },

}, { timestamps: true });

// ── Virtual: isAdmin ──────────────────────────────────────────────────────────
// Convenience helper used in middleware
userSchema.virtual('isAdmin').get(function () {
  return this.type === 'admin' || this.role === 'admin';
});

// ── Pre-save: hash password ───────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  if (this.passwordHash.startsWith('google_')) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// ── Pre-save: sync legacy role from capabilities (backward compat) ────────────
// Keeps the old role field consistent so any code still reading it works.
userSchema.pre('save', function (next) {
  if (this.type === 'admin' || this.role === 'admin') {
    this.type    = 'admin';
    this.role    = 'admin';
    this.canRent = true;
    this.canList = true;
  } else if (this.canList) {
    this.role = 'owner';
  } else {
    this.role = 'renter';
  }
  next();
});

// ── Methods ───────────────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (pw) {
  return bcrypt.compare(pw, this.passwordHash);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.passwordHash;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);