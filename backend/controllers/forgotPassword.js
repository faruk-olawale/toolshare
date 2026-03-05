const crypto = require('crypto');
const User = require('../models/User');
const { sendEmail } = require('../utils/sendEmail');

// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const user = await User.findOne({ email });

    // Always return success even if email not found (security best practice)
    if (!user) {
      return res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = Date.now() + 30 * 60 * 1000; // 30 minutes

    await User.findByIdAndUpdate(user._id, {
      passwordResetToken: resetTokenHash,
      passwordResetExpiry: resetTokenExpiry,
    });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&id=${user._id}`;

    sendEmail({
      to: email,
      subject: '🔑 Reset Your ToolShare Africa Password',
      template: 'forgotPassword',
      data: { name: user.name, resetUrl },
    });

    res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (error) { next(error); }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { token, userId, password } = req.body;

    if (!token || !userId || !password)
      return res.status(400).json({ success: false, message: 'All fields are required.' });

    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      _id: userId,
      passwordResetToken: tokenHash,
      passwordResetExpiry: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired.' });

    // Update password and clear reset token
    user.passwordHash = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful! You can now log in.' });
  } catch (error) { next(error); }
};

module.exports = { forgotPassword, resetPassword };