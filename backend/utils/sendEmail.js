const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const emailStyles = `
  font-family: 'Helvetica Neue', Arial, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  background: #faf9f7;
`;

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:20px;background:#f0ede8;">
  <div style="${emailStyles}">
    <div style="background:linear-gradient(135deg,#f2711c,#e35712);padding:32px;border-radius:16px 16px 0 0;text-align:center;">
      <h1 style="color:white;margin:0;font-size:24px;font-weight:700;">🔧 ToolShare Africa</h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">Nigeria's Equipment Rental Marketplace</p>
    </div>
    <div style="background:white;padding:32px;border-radius:0 0 16px 16px;border:1px solid #e5e0d8;border-top:none;">
      ${content}
    </div>
    <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px;">
      © ${new Date().getFullYear()} ToolShare Africa · Made with ❤️ in Nigeria 🇳🇬
    </p>
  </div>
</body>
</html>
`;

const btnStyle = `display:inline-block;background:#f2711c;color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;margin-top:16px;`;
const h2Style = `color:#1a1a1a;font-size:22px;margin:0 0 8px;`;
const pStyle = `color:#4b5563;line-height:1.6;margin:8px 0;font-size:15px;`;
const boxStyle = `background:#faf9f7;border:1px solid #e5e0d8;border-radius:12px;padding:20px;margin:20px 0;`;

const templates = {

  // ── BOOKING REQUEST (to owner) ──────────────────────────────────────────────
  bookingRequest: ({ ownerName, renterName, toolName, startDate, endDate, totalAmount, dashboardUrl }) =>
    baseTemplate(`
      <h2 style="${h2Style}">📋 New Booking Request</h2>
      <p style="${pStyle}">Hi <strong>${ownerName}</strong>, you have a new rental request!</p>
      <div style="${boxStyle}">
        <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Booking Details</p>
        <p style="${pStyle}"><strong>Tool:</strong> ${toolName}</p>
        <p style="${pStyle}"><strong>Renter:</strong> ${renterName}</p>
        <p style="${pStyle}"><strong>Dates:</strong> ${startDate} → ${endDate}</p>
        <p style="${pStyle}"><strong>Total:</strong> <span style="color:#f2711c;font-size:18px;font-weight:700;">₦${Number(totalAmount).toLocaleString()}</span></p>
      </div>
      <p style="${pStyle}">Please review and respond to this request as soon as possible.</p>
      <a href="${dashboardUrl}" style="${btnStyle}">View Booking Request →</a>
    `),

  // ── BOOKING APPROVED (to renter) ────────────────────────────────────────────
  bookingApproved: ({ renterName, toolName, startDate, endDate, totalAmount, ownerPhone, bookingsUrl }) =>
    baseTemplate(`
      <h2 style="${h2Style}">✅ Booking Approved!</h2>
      <p style="${pStyle}">Great news, <strong>${renterName}</strong>! Your booking has been approved.</p>
      <div style="${boxStyle}">
        <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Your Rental</p>
        <p style="${pStyle}"><strong>Tool:</strong> ${toolName}</p>
        <p style="${pStyle}"><strong>Dates:</strong> ${startDate} → ${endDate}</p>
        <p style="${pStyle}"><strong>Amount Due:</strong> <span style="color:#f2711c;font-size:18px;font-weight:700;">₦${Number(totalAmount).toLocaleString()}</span></p>
        ${ownerPhone ? `<p style="${pStyle}"><strong>Owner Phone:</strong> ${ownerPhone}</p>` : ''}
      </div>
      <p style="${pStyle}">Complete your payment now to confirm the booking.</p>
      <a href="${bookingsUrl}" style="${btnStyle}">Pay Now →</a>
    `),

  // ── BOOKING REJECTED (to renter) ────────────────────────────────────────────
  bookingRejected: ({ renterName, toolName, browseUrl }) =>
    baseTemplate(`
      <h2 style="${h2Style}">❌ Booking Not Available</h2>
      <p style="${pStyle}">Hi <strong>${renterName}</strong>, unfortunately your booking request for <strong>${toolName}</strong> was not approved.</p>
      <p style="${pStyle}">Don't worry — there are many other tools available on ToolShare Africa!</p>
      <a href="${browseUrl}" style="${btnStyle}">Browse Other Tools →</a>
    `),

  // ── PAYMENT CONFIRMED (to renter) ───────────────────────────────────────────
  paymentConfirmed: ({ renterName, toolName, startDate, endDate, totalAmount, reference, ownerName, ownerPhone }) =>
    baseTemplate(`
      <h2 style="${h2Style}">🎉 Payment Confirmed!</h2>
      <p style="${pStyle}">Hi <strong>${renterName}</strong>, your payment was successful!</p>
      <div style="${boxStyle}">
        <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Receipt</p>
        <p style="${pStyle}"><strong>Tool:</strong> ${toolName}</p>
        <p style="${pStyle}"><strong>Rental Period:</strong> ${startDate} → ${endDate}</p>
        <p style="${pStyle}"><strong>Amount Paid:</strong> <span style="color:#16a34a;font-size:18px;font-weight:700;">₦${Number(totalAmount).toLocaleString()}</span></p>
        <p style="${pStyle}"><strong>Reference:</strong> <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:13px;">${reference}</code></p>
      </div>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin-top:16px;">
        <p style="margin:0;color:#15803d;font-size:14px;"><strong>Owner Contact:</strong> ${ownerName} ${ownerPhone ? '· ' + ownerPhone : ''}</p>
        <p style="margin:6px 0 0;color:#15803d;font-size:13px;">Coordinate pickup time with the owner directly.</p>
      </div>
    `),

  // ── PAYOUT SENT (to owner) ──────────────────────────────────────────────────
  payoutSent: ({ ownerName, toolName, amount, platformFee, reference }) =>
    baseTemplate(`
      <h2 style="${h2Style}">💰 Payout Sent!</h2>
      <p style="${pStyle}">Hi <strong>${ownerName}</strong>, your rental earnings are on the way!</p>
      <div style="${boxStyle}">
        <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Payout Breakdown</p>
        <p style="${pStyle}"><strong>Tool Rented:</strong> ${toolName}</p>
        <p style="${pStyle}"><strong>Platform Fee (10%):</strong> <span style="color:#ef4444;">−₦${Number(platformFee).toLocaleString()}</span></p>
        <p style="${pStyle}"><strong>Your Earnings:</strong> <span style="color:#16a34a;font-size:20px;font-weight:700;">₦${Number(amount).toLocaleString()}</span></p>
        <p style="${pStyle}"><strong>Reference:</strong> <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:13px;">${reference}</code></p>
      </div>
      <p style="${pStyle}">Money will arrive in your bank account within a few minutes via NIP transfer.</p>
    `),

  // ── WELCOME EMAIL ────────────────────────────────────────────────────────────
  welcome: ({ name, role, loginUrl }) =>
    baseTemplate(`
      <h2 style="${h2Style}">Welcome to ToolShare Africa! 🎉</h2>
      <p style="${pStyle}">Hi <strong>${name}</strong>, your account has been created successfully.</p>
      <p style="${pStyle}">You registered as a <strong style="color:#f2711c;text-transform:capitalize;">${role}</strong>.</p>
      ${role === 'owner'
        ? `<p style="${pStyle}">Start listing your tools and earning money today!</p><a href="${loginUrl}/tools/new" style="${btnStyle}">List Your First Tool →</a>`
        : `<p style="${pStyle}">Browse hundreds of tools available near you.</p><a href="${loginUrl}/tools" style="${btnStyle}">Browse Tools →</a>`
      }
    `),

  // ── TOOL VERIFIED (to owner) ─────────────────────────────────────────────────
  toolVerified: ({ ownerName, toolName, browseUrl }) =>
    baseTemplate(`
      <h2 style="${h2Style}">✅ Your Tool is Now Live!</h2>
      <p style="${pStyle}">Hi <strong>${ownerName}</strong>, your tool <strong>${toolName}</strong> has been verified by our admin team and is now visible to renters.</p>
      <p style="${pStyle}">Renters in your area can now discover and book your tool.</p>
      <a href="${browseUrl}" style="${btnStyle}">View Your Listing →</a>
    `),

  // ── TOOL REJECTED (to owner) ─────────────────────────────────────────────────
  toolRejected: ({ ownerName, toolName, reason, dashboardUrl }) =>
    baseTemplate(`
      <h2 style="${h2Style}">⚠️ Tool Listing Needs Update</h2>
      <p style="${pStyle}">Hi <strong>${ownerName}</strong>, your tool <strong>${toolName}</strong> was not approved.</p>
      ${reason ? `<div style="${boxStyle}"><p style="margin:0;color:#dc2626;"><strong>Reason:</strong> ${reason}</p></div>` : ''}
      <p style="${pStyle}">Please update your listing and resubmit for review.</p>
      <a href="${dashboardUrl}" style="${btnStyle}">Update Listing →</a>
    `),
};

const sendEmail = async ({ to, subject, template, data }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(`📧 Email skipped (no config): ${subject} → ${to}`);
      return;
    }
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