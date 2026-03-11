const { body, param, validationResult } = require('express-validator');

// ── Reusable middleware to check validation results ───────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  next();
};

// ── Tool validators ───────────────────────────────────────────────────────────
const toolValidation = [
  body('name').trim().notEmpty().withMessage('Tool name is required').isLength({ max: 150 }).withMessage('Name cannot exceed 150 characters'),
  body('category').isIn(['Construction','Agriculture','Electrical','Plumbing','Woodworking','Gardening','Transportation','Cleaning','Safety','Other']).withMessage('Invalid category'),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('pricePerDay').isFloat({ min: 0 }).withMessage('Price per day must be a positive number'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('condition').optional().isIn(['Excellent','Good','Fair']).withMessage('Condition must be Excellent, Good, or Fair'),
  validate,
];

const toolUpdateValidation = [
  body('name').optional().trim().notEmpty().withMessage('Tool name cannot be empty').isLength({ max: 150 }).withMessage('Name cannot exceed 150 characters'),
  body('category').optional().isIn(['Construction','Agriculture','Electrical','Plumbing','Woodworking','Gardening','Transportation','Cleaning','Safety','Other']).withMessage('Invalid category'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('pricePerDay').optional().isFloat({ min: 0 }).withMessage('Price per day must be a positive number'),
  body('condition').optional().isIn(['Excellent','Good','Fair']).withMessage('Invalid condition'),
  body('available').optional().isBoolean().withMessage('Available must be true or false'),
  validate,
];

// ── Review validators ─────────────────────────────────────────────────────────
const reviewValidation = [
  body('bookingId').notEmpty().withMessage('Booking ID is required').isMongoId().withMessage('Invalid booking ID'),
  body('overallRating').isInt({ min: 1, max: 5 }).withMessage('Overall rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters'),
  body('ratings').optional().isObject().withMessage('Ratings must be an object'),
  validate,
];

// ── Support ticket validators ─────────────────────────────────────────────────
const supportTicketValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name too long'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 200 }).withMessage('Subject too long'),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ min: 10, max: 2000 }).withMessage('Message must be between 10 and 2000 characters'),
  body('category').isIn(['general','booking','payment','kyc','dispute','other']).withMessage('Invalid category'),
  validate,
];

const supportReplyValidation = [
  body('message').trim().notEmpty().withMessage('Reply message is required').isLength({ max: 2000 }).withMessage('Reply too long'),
  validate,
];

const supportStatusValidation = [
  body('status').isIn(['open','in_progress','resolved','closed']).withMessage('Invalid status'),
  validate,
];

// ── Admin validators ──────────────────────────────────────────────────────────
const rejectToolValidation = [
  body('reason').trim().notEmpty().withMessage('Rejection reason is required').isLength({ max: 500 }).withMessage('Reason too long'),
  validate,
];

const rejectKycValidation = [
  body('reason').trim().notEmpty().withMessage('Rejection reason is required').isLength({ max: 500 }).withMessage('Reason too long'),
  validate,
];

const suspendUserValidation = [
  body('reason').trim().notEmpty().withMessage('Suspension reason is required').isLength({ max: 500 }).withMessage('Reason too long'),
  validate,
];

const resolveDisputeValidation = [
  body('resolution').trim().notEmpty().withMessage('Resolution description is required').isLength({ max: 1000 }).withMessage('Resolution too long'),
  body('outcome').isIn(['tool_recovered','written_off','deceased','other']).withMessage('Invalid outcome'),
  validate,
];

// ── Payment validators ────────────────────────────────────────────────────────
const initiatePaymentValidation = [
  body('bookingId').notEmpty().withMessage('Booking ID is required').isMongoId().withMessage('Invalid booking ID'),
  validate,
];

const verifyPaymentValidation = [
  body('reference').trim().notEmpty().withMessage('Payment reference is required'),
  validate,
];

const bankDetailsValidation = [
  body('bankName').trim().notEmpty().withMessage('Bank name is required'),
  body('accountNumber').trim().notEmpty().withMessage('Account number is required').isLength({ min: 10, max: 10 }).withMessage('Account number must be 10 digits').isNumeric().withMessage('Account number must be numeric'),
  body('bankCode').trim().notEmpty().withMessage('Bank code is required'),
  validate,
];

// ── KYC validators ────────────────────────────────────────────────────────────
const kycValidation = [
  body('idType').isIn(['nin','passport','drivers_license','voters_card']).withMessage('Invalid ID type'),
  body('idNumber').trim().notEmpty().withMessage('ID number is required').isLength({ min: 5, max: 50 }).withMessage('Invalid ID number length'),
  validate,
];

// ── Booking cancel validator ──────────────────────────────────────────────────
const cancelBookingValidation = [
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
  validate,
];

// ── Param validators ──────────────────────────────────────────────────────────
const mongoIdParam = (paramName) => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName}`),
  validate,
];

module.exports = {
  validate,
  toolValidation, toolUpdateValidation,
  reviewValidation,
  supportTicketValidation, supportReplyValidation, supportStatusValidation,
  rejectToolValidation, rejectKycValidation, suspendUserValidation, resolveDisputeValidation,
  initiatePaymentValidation, verifyPaymentValidation, bankDetailsValidation,
  kycValidation,
  cancelBookingValidation,
  mongoIdParam,
};