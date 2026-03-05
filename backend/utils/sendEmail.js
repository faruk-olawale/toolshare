const nodemailer = require('nodemailer');

const btn = `display:inline-block;background:#f2711c;color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;margin-top:16px;`;
const h2 = `color:#1a1a1a;font-size:22px;margin:0 0 8px;`;
const p = `color:#4b5563;line-height:1.6;margin:8px 0;font-size:15px;`;
const box = `background:#faf9f7;border:1px solid #e5e0d8;border-radius:12px;padding:20px;margin:20px 0;`;

const base = (content) => `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:20px;background:#f0ede8;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#f2711c,#e35712);padding:32px;border-radius:16px 16px 0 0;text-align:center;">
    <h1 style="color:white;margin:0;font-size:24px;">🔧 ToolShare Africa</h1>
    <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">Nigeria's Equipment Rental Marketplace</p>
  </div>
  <div style="background:white;padding:32px;border-radius:0 0 16px 16px;border:1px solid #e5e0d8;border-top:none;">${content}</div>
  <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px;">© ${new Date().getFullYear()} ToolShare Africa 🇳🇬</p>
</div></body></html>`;

const templates = {
  welcome: ({ name, role, loginUrl }) => base(`
    <h2 style="${h2}">Welcome to ToolShare Africa! 🎉</h2>
    <p style="${p}">Hi <strong>${name}</strong>, your account has been created successfully.</p>
    <p style="${p}">You registered as a <strong style="color:#f2711c;text-transform:capitalize;">${role}</strong>.</p>
    <div style="${box}">
      <p style="margin:0;color:#92400e;font-size:14px;"><strong>⚠️ Next Step: Verify Your Identity</strong></p>
      <p style="margin:6px 0 0;color:#78350f;font-size:13px;">Complete identity verification (KYC) to unlock full access to ToolShare Africa.</p>
    </div>
    <a href="${loginUrl}/kyc" style="${btn}">Complete Verification →</a>
  `),

  forgotPassword: ({ name, resetUrl }) => base(`
    <h2 style="${h2}">🔑 Reset Your Password</h2>
    <p style="${p}">Hi <strong>${name}</strong>, we received a request to reset your ToolShare Africa password.</p>
    <p style="${p}">Click the button below to set a new password. This link expires in <strong>30 minutes</strong>.</p>
    <a href="${resetUrl}" style="${btn}">Reset Password →</a>
    <div style="${box}">
      <p style="margin:0;font-size:13px;color:#6b7280;">If you didn't request this, you can safely ignore this email. Your password will not change.</p>
    </div>
  `),

  kycSubmitted: ({ name }) => base(`
    <h2 style="${h2}">📋 KYC Submitted — Under Review</h2>
    <p style="${p}">Hi <strong>${name}</strong>, we've received your identity documents.</p>
    <p style="${p}">Our team will review your documents within <strong>24 hours</strong>. You'll receive an email once verified.</p>
    <div style="${box}">
      <p style="margin:0;font-size:14px;color:#374151;">While you wait, you can still browse tools on the platform.</p>
    </div>
  `),

  kycApproved: ({ name, role, clientUrl }) => base(`
    <h2 style="${h2}">✅ Identity Verified!</h2>
    <p style="${p}">Hi <strong>${name}</strong>, your identity has been verified successfully!</p>
    <p style="${p}">You can now ${role === 'owner' ? 'list your tools and start earning' : 'book tools across Nigeria'}.</p>
    <a href="${clientUrl}/${role === 'owner' ? 'tools/new' : 'tools'}" style="${btn}">${role === 'owner' ? 'List Your First Tool →' : 'Browse Tools →'}</a>
  `),

  kycRejected: ({ name, reason, clientUrl }) => base(`
    <h2 style="${h2}">⚠️ Verification Failed — Action Required</h2>
    <p style="${p}">Hi <strong>${name}</strong>, we were unable to verify your identity.</p>
    <div style="${box}"><p style="margin:0;color:#dc2626;"><strong>Reason:</strong> ${reason}</p></div>
    <p style="${p}">Please resubmit with clearer documents.</p>
    <a href="${clientUrl}/kyc" style="${btn}">Resubmit Documents →</a>
  `),

  bookingRequest: ({ ownerName, renterName, toolName, startDate, endDate, totalAmount, dashboardUrl }) => base(`
    <h2 style="${h2}">📋 New Booking Request</h2>
    <p style="${p}">Hi <strong>${ownerName}</strong>, you have a new rental request!</p>
    <div style="${box}">
      <p style="${p}"><strong>Tool:</strong> ${toolName}</p>
      <p style="${p}"><strong>Renter:</strong> ${renterName}</p>
      <p style="${p}"><strong>Dates:</strong> ${startDate} → ${endDate}</p>
      <p style="${p}"><strong>Total:</strong> <span style="color:#f2711c;font-size:18px;font-weight:700;">₦${Number(totalAmount).toLocaleString()}</span></p>
    </div>
    <a href="${dashboardUrl}" style="${btn}">View Booking Request →</a>
  `),

  bookingApproved: ({ renterName, toolName, startDate, endDate, totalAmount, ownerPhone, bookingsUrl }) => base(`
    <h2 style="${h2}">✅ Booking Approved!</h2>
    <p style="${p}">Great news, <strong>${renterName}</strong>! Your booking has been approved.</p>
    <div style="${box}">
      <p style="${p}"><strong>Tool:</strong> ${toolName}</p>
      <p style="${p}"><strong>Dates:</strong> ${startDate} → ${endDate}</p>
      <p style="${p}"><strong>Amount Due:</strong> <span style="color:#f2711c;font-size:18px;font-weight:700;">₦${Number(totalAmount).toLocaleString()}</span></p>
      ${ownerPhone ? `<p style="${p}"><strong>Owner Phone:</strong> ${ownerPhone}</p>` : ''}
    </div>
    <a href="${bookingsUrl}" style="${btn}">Pay Now →</a>
  `),

  bookingRejected: ({ renterName, toolName, browseUrl }) => base(`
    <h2 style="${h2}">❌ Booking Not Available</h2>
    <p style="${p}">Hi <strong>${renterName}</strong>, your booking request for <strong>${toolName}</strong> was not approved.</p>
    <p style="${p}">Don't worry — there are many other tools available!</p>
    <a href="${browseUrl}" style="${btn}">Browse Other Tools →</a>
  `),

  paymentConfirmed: ({ renterName, toolName, startDate, endDate, totalAmount, reference, ownerName, ownerPhone }) => base(`
    <h2 style="${h2}">🎉 Payment Confirmed!</h2>
    <p style="${p}">Hi <strong>${renterName}</strong>, your payment was successful!</p>
    <div style="${box}">
      <p style="${p}"><strong>Tool:</strong> ${toolName}</p>
      <p style="${p}"><strong>Period:</strong> ${startDate} → ${endDate}</p>
      <p style="${p}"><strong>Amount Paid:</strong> <span style="color:#16a34a;font-size:18px;font-weight:700;">₦${Number(totalAmount).toLocaleString()}</span></p>
      <p style="${p}"><strong>Reference:</strong> <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:13px;">${reference}</code></p>
    </div>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin-top:16px;">
      <p style="margin:0;color:#15803d;font-size:14px;"><strong>Owner:</strong> ${ownerName} ${ownerPhone ? '· ' + ownerPhone : ''}</p>
    </div>
  `),

  payoutSent: ({ ownerName, toolName, amount, platformFee, reference }) => base(`
    <h2 style="${h2}">💰 Payout Sent!</h2>
    <p style="${p}">Hi <strong>${ownerName}</strong>, your rental earnings are on the way!</p>
    <div style="${box}">
      <p style="${p}"><strong>Tool:</strong> ${toolName}</p>
      <p style="${p}"><strong>Platform Fee (10%):</strong> <span style="color:#ef4444;">−₦${Number(platformFee).toLocaleString()}</span></p>
      <p style="${p}"><strong>Your Earnings:</strong> <span style="color:#16a34a;font-size:20px;font-weight:700;">₦${Number(amount).toLocaleString()}</span></p>
      <p style="${p}"><strong>Reference:</strong> <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:13px;">${reference}</code></p>
    </div>
    <p style="${p}">Money will arrive in your bank account within minutes via NIP transfer.</p>
  `),

  toolVerified: ({ ownerName, toolName, browseUrl }) => base(`
    <h2 style="${h2}">✅ Your Tool is Now Live!</h2>
    <p style="${p}">Hi <strong>${ownerName}</strong>, your tool <strong>${toolName}</strong> has been verified and is now visible to renters.</p>
    <a href="${browseUrl}" style="${btn}">View Your Listing →</a>
  `),

  toolRejected: ({ ownerName, toolName, reason, dashboardUrl }) => base(`
    <h2 style="${h2}">⚠️ Tool Listing Needs Update</h2>
    <p style="${p}">Hi <strong>${ownerName}</strong>, your tool <strong>${toolName}</strong> was not approved.</p>
    ${reason ? `<div style="${box}"><p style="margin:0;color:#dc2626;"><strong>Reason:</strong> ${reason}</p></div>` : ''}
    <p style="${p}">Please update your listing and resubmit for review.</p>
    <a href="${dashboardUrl}" style="${btn}">Update Listing →</a>
  `),
};

const sendEmail = async ({ to, subject, template, data }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(`📧 Email skipped (EMAIL_USER or EMAIL_PASS not set): ${subject} → ${to}`);
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const html = templates[template](data);

    await transporter.sendMail({
      from: `"ToolShare Africa" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`📧 Email sent: ${subject} → ${to}`);
  } catch (err) {
    console.error(`📧 Email failed: ${err.message}`);
  }
};

module.exports = { sendEmail };