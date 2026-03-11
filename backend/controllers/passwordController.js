const crypto = require('crypto');
const User   = require('../models/User');
const { sendEmail } = require('../utils/sendEmail');

// ── FORGOT PASSWORD ───────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+resetPasswordToken +resetPasswordExpires');

    // Always respond the same — don't reveal if email exists
    const genericMsg = 'If an account with that email exists, a reset link has been sent.';

    if (!user) return res.status(200).json({ success: true, message: genericMsg });

    // Google OAuth users have no password
    if (user.googleId && (!user.passwordHash || user.passwordHash.startsWith('google_'))) {
      return res.status(200).json({ success: true, message: genericMsg });
    }

    // Generate secure random token
    const rawToken  = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken   = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`;

    await sendEmail({
      to: user.email,
      subject: '🔑 Reset Your ToolShare Africa Password',
      template: 'forgotPassword',
      data: { name: user.name, resetUrl },
    });

    res.status(200).json({ success: true, message: genericMsg });
  } catch (error) {
    next(error);
  }
};

// ── RESET PASSWORD ────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and new password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    // Hash the raw token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken:   hashedToken,
      resetPasswordExpires: { $gt: Date.now() }, // not expired
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired.' });
    }

    // Set new password (pre-save hook will hash it)
    user.passwordHash           = password;
    user.resetPasswordToken     = null;
    user.resetPasswordExpires   = null;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { forgotPassword, resetPassword };