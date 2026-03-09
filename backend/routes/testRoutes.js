const express = require('express');
const router = express.Router();
const { sendEmail } = require('../utils/sendEmail');

router.get('/test-email', async (req, res) => {
  const config = {
    RESEND_API_KEY: process.env.RESEND_API_KEY ? `SET (${process.env.RESEND_API_KEY.length} chars)` : 'NOT SET',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'NOT SET',
  };
  try {
    await sendEmail({
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: '🧪 ToolShare Email Test from Render',
      template: 'welcome',
      data: { name: 'Admin', role: 'admin', loginUrl: process.env.CLIENT_URL || 'https://toolshare-kuv1.vercel.app' },
    });
    res.json({ success: true, message: 'Email sent — check inbox!', config });
  } catch (err) {
    res.json({ success: false, error: err.message, config });
  }
});

module.exports = router;