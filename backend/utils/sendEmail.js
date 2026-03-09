const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

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
    <p style="${p}">Hi <strong>${name}</strong>, your account has been created.</p>
    <p style="${p}">You registered as a <strong style="color:#f2711c;text-transform:capitalize;">${role}</strong>.</p>
    <div style="${box}">
      <p style="margin:0;color:#92400e;font-size:14px;"><strong>⚠️ Next Step: Verify Your Identity</strong></p>
      <p style="margin:6px 0 0;color:#78350f;font-size:13px;">Before you can ${role === 'owner' ? 'list tools' : 'make bookings'}, you need to complete identity verification (KYC). This keeps our community safe.</p>
    </div>
    <a href="${loginUrl}/kyc" style="${btn}">Complete Verification →</a>
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
    <p style="${p}">Hi <strong>${renterName}</strong>, your booking for <strong>${toolName}</strong> was not approved.</p>
    <a href="${browseUrl}" style="${btn}">Browse Other Tools →</a>
  `),

  paymentConfirmed: ({ renterName, toolName, startDate, endDate, totalAmount, reference, ownerName, ownerPhone }) => base(`
    <h2 style="${h2}">🎉 Payment Confirmed!</h2>
    <p style="${p}">Hi <strong>${renterName}</strong>, your payment was successful!</p>
    <div style="${box}">
      <p style="${p}"><strong>Tool:</strong> ${toolName}</p>
      <p style="${p}"><strong>Period:</strong> ${startDate} → ${endDate}</p>
      <p style="${p}"><strong>Amount Paid:</strong> <span style="color:#16a34a;font-size:18px;font-weight:700;">₦${Number(totalAmount).toLocaleString()}</span></p>
      <p style="${p}"><strong>Ref:</strong> <code>${reference}</code></p>
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
      <p style="${p}"><strong>Ref:</strong> <code>${reference}</code></p>
    </div>
  `),

  toolVerified: ({ ownerName, toolName, browseUrl }) => base(`
    <h2 style="${h2}">✅ Your Tool is Now Live!</h2>
    <p style="${p}">Hi <strong>${ownerName}</strong>, your tool <strong>${toolName}</strong> has been verified and is now visible to renters.</p>
    <a href="${browseUrl}" style="${btn}">View Listing →</a>
  `),


  escrowReceiptConfirmed: ({ renterName, toolName, ownerPhone, endDate }) => base(`
    <h2 style="${h2}">✅ Receipt Confirmed!</h2>
    <p style="${p}">Hi <strong>${renterName}</strong>, you have confirmed receiving <strong>${toolName}</strong>.</p>
    <div style="${box}">
      <p style="${p}">50% of the payment has been released to the owner.</p>
      <p style="${p}"><strong>Return Date:</strong> ${endDate}</p>
      ${ownerPhone ? `<p style="${p}"><strong>Owner Phone:</strong> ${ownerPhone}</p>` : ''}
    </div>
    <p style="${p}">Please return the tool in the same condition by the return date.</p>
  `),

  escrowFirstPayout: ({ ownerName, toolName, amount, renterName, reference }) => base(`
    <h2 style="${h2}">💰 50% Payout Released!</h2>
    <p style="${p}">Hi <strong>${ownerName}</strong>, <strong>${renterName}</strong> has confirmed receiving <strong>${toolName}</strong>.</p>
    <div style="${box}">
      <p style="${p}"><strong>Amount Released:</strong> <span style="color:#16a34a;font-size:18px;font-weight:700;">₦${Number(amount).toLocaleString()}</span></p>
      <p style="${p}"><strong>Reference:</strong> <code>${reference}</code></p>
    </div>
    <p style="${p}">The remaining 50% will be released when you confirm the tool has been returned.</p>
  `),

  escrowFinalPayout: ({ ownerName, toolName, amount, totalEarned, reference }) => base(`
    <h2 style="${h2}">🎉 Final Payout Released!</h2>
    <p style="${p}">Hi <strong>${ownerName}</strong>, the rental of <strong>${toolName}</strong> is now complete!</p>
    <div style="${box}">
      <p style="${p}"><strong>Final Payout:</strong> <span style="color:#16a34a;font-size:18px;font-weight:700;">₦${Number(amount).toLocaleString()}</span></p>
      <p style="${p}"><strong>Total Earned:</strong> <span style="color:#16a34a;font-weight:700;">₦${Number(totalEarned).toLocaleString()}</span></p>
      <p style="${p}"><strong>Reference:</strong> <code>${reference}</code></p>
    </div>
  `),

  escrowRentalComplete: ({ renterName, toolName }) => base(`
    <h2 style="${h2}">✅ Rental Complete!</h2>
    <p style="${p}">Hi <strong>${renterName}</strong>, your rental of <strong>${toolName}</strong> has been completed successfully.</p>
    <p style="${p}">Thank you for using ToolShare Africa!</p>
  `),

  disputeRaised: ({ raisedBy, raisedByRole, toolName, reason, renterName, ownerName, adminUrl }) => base(`
    <h2 style="${h2}">🚨 Dispute Raised</h2>
    <p style="${p}"><strong>${raisedBy}</strong> (${raisedByRole}) has raised a dispute.</p>
    <div style="${box}">
      <p style="${p}"><strong>Tool:</strong> ${toolName}</p>
      <p style="${p}"><strong>Renter:</strong> ${renterName}</p>
      <p style="${p}"><strong>Owner:</strong> ${ownerName}</p>
      <p style="${p}"><strong>Reason:</strong> ${reason}</p>
    </div>
    <a href="${adminUrl}" style="${btn}">Review Dispute →</a>
  `),

  disputeNotification: ({ name, toolName, reason, raisedByRole }) => base(`
    <h2 style="${h2}">⚠️ Dispute Raised on Your Booking</h2>
    <p style="${p}">Hi <strong>${name}</strong>, the ${raisedByRole === 'renter' ? 'renter' : 'owner'} has raised a dispute on the booking for <strong>${toolName}</strong>.</p>
    <div style="${box}"><p style="${p}"><strong>Reason:</strong> ${reason}</p></div>
    <p style="${p}">Our admin team will review and resolve this within 24 hours.</p>
  `),

  disputeResolved: ({ name, toolName, resolution, favour }) => base(`
    <h2 style="${h2}">✅ Dispute Resolved</h2>
    <p style="${p}">Hi <strong>${name}</strong>, the dispute for <strong>${toolName}</strong> has been resolved.</p>
    <div style="${box}">
      <p style="${p}"><strong>Resolution:</strong> ${resolution}</p>
      <p style="${p}"><strong>Decision:</strong> ${favour === 'you' ? '✅ In your favour' : 'In favour of the other party'}</p>
    </div>
  `),


  ticketCreated: ({ name, ticketNumber, subject, message, clientUrl }) => base(`
    <h2 style="${h2}">✅ Support Ticket Received</h2>
    <p style="${p}">Hi <strong>${name}</strong>, we've received your message and will reply within 24 hours.</p>
    <div style="${box}">
      <p style="${p}"><strong>Ticket Number:</strong> <span style="color:#f2711c;font-size:18px;font-weight:700;">#${ticketNumber}</span></p>
      <p style="${p}"><strong>Subject:</strong> ${subject}</p>
      <p style="${p}"><strong>Your Message:</strong> ${message}</p>
    </div>
    <p style="${p}">Keep this ticket number for reference. We'll reply to this email address directly.</p>
  `),

  ticketAlert: ({ name, email, subject, message, category, ticketNumber, adminUrl }) => base(`
    <h2 style="${h2}">🎫 New Support Ticket #${ticketNumber}</h2>
    <div style="${box}">
      <p style="${p}"><strong>From:</strong> ${name} (${email})</p>
      <p style="${p}"><strong>Category:</strong> <span style="text-transform:capitalize;">${category}</span></p>
      <p style="${p}"><strong>Subject:</strong> ${subject}</p>
      <p style="${p}"><strong>Message:</strong> ${message}</p>
    </div>
    <a href="${adminUrl}" style="${btn}">Reply in Admin Dashboard →</a>
  `),

  ticketReply: ({ name, ticketNumber, subject, adminMessage, clientUrl }) => base(`
    <h2 style="${h2}">💬 Reply to Your Support Ticket</h2>
    <p style="${p}">Hi <strong>${name}</strong>, we've replied to your ticket <strong>#${ticketNumber}</strong>.</p>
    <div style="${box}">
      <p style="${p}"><strong>Subject:</strong> ${subject}</p>
      <p style="${p}"><strong>Our Reply:</strong></p>
      <p style="${p}">${adminMessage}</p>
    </div>
    <p style="${p}">If you need further help, reply to this email or visit our help center.</p>
    <a href="${clientUrl}/help" style="${btn}">Visit Help Center →</a>
  `),

  ticketResolved: ({ name, ticketNumber, subject, clientUrl }) => base(`
    <h2 style="${h2}">✅ Ticket #${ticketNumber} Resolved</h2>
    <p style="${p}">Hi <strong>${name}</strong>, your support ticket has been marked as resolved.</p>
    <div style="${box}"><p style="${p}"><strong>Subject:</strong> ${subject}</p></div>
    <p style="${p}">If you still have issues, feel free to open a new ticket anytime.</p>
    <a href="${clientUrl}/help" style="${btn}">Visit Help Center →</a>
  `),


  bookingExpired: ({ renterName, toolName, reason, browseUrl }) => base(`
    <h2 style="${h2}">⏰ Booking Request Expired</h2>
    <p style="${p}">Hi <strong>${renterName}</strong>, your booking request for <strong>${toolName}</strong> has expired.</p>
    <div style="${box}"><p style="${p}"><strong>Reason:</strong> ${reason}</p></div>
    <a href="${browseUrl}" style="${btn}">Browse Other Tools →</a>
  `),

  bookingExpiredOwner: ({ ownerName, toolName, renterName, dashboardUrl }) => base(`
    <h2 style="${h2}">⚠️ Booking Request Expired</h2>
    <p style="${p}">Hi <strong>${ownerName}</strong>, a booking request from <strong>${renterName}</strong> for <strong>${toolName}</strong> has expired because it was not responded to within 48 hours.</p>
    <a href="${dashboardUrl}" style="${btn}">View Dashboard →</a>
  `),

  autoReceiptConfirmed: ({ renterName, toolName, endDate }) => base(`
    <h2 style="${h2}">⏰ Receipt Auto-Confirmed</h2>
    <p style="${p}">Hi <strong>${renterName}</strong>, since you did not confirm receiving <strong>${toolName}</strong> within 3 days, receipt has been auto-confirmed and 50% has been released to the owner.</p>
    <p style="${p}">Please remember to return the tool by <strong>${endDate}</strong>.</p>
  `),


  rentalStartsReminder: ({ name, toolName, startDate, endDate, ownerPhone, bookingsUrl }) => base(`
    <h2 style="${h2}">⏰ Your Rental Starts Tomorrow!</h2>
    <p style="${p}">Hi <strong>${name}</strong>, this is a reminder that your rental starts tomorrow.</p>
    <div style="${box}">
      <p style="margin:0 0 8px;font-weight:600;color:#1a1a1a;">${toolName}</p>
      <p style="margin:4px 0;${p}">📅 Start: <strong>${startDate}</strong></p>
      <p style="margin:4px 0;${p}">📅 End: <strong>${endDate}</strong></p>
      <p style="margin:4px 0;${p}">📞 Owner Contact: <strong>${ownerPhone}</strong></p>
    </div>
    <p style="${p}">Make sure you've arranged pickup with the owner and have your payment ready.</p>
    <a href="${bookingsUrl}" style="${btn}">View Booking →</a>
  `),

  ownerHandoverReminder: ({ name, toolName, renterName, renterPhone, startDate, dashboardUrl }) => base(`
    <h2 style="${h2}">⏰ Tool Handover Tomorrow</h2>
    <p style="${p}">Hi <strong>${name}</strong>, <strong>${renterName}</strong> is picking up <strong>${toolName}</strong> tomorrow.</p>
    <div style="${box}">
      <p style="margin:4px 0;${p}">📅 Pickup Date: <strong>${startDate}</strong></p>
      <p style="margin:4px 0;${p}">📞 Renter Contact: <strong>${renterPhone}</strong></p>
    </div>
    <p style="${p}">Please ensure the tool is ready and in good condition for handover. We recommend taking photos of the tool's condition before handover.</p>
    <a href="${dashboardUrl}" style="${btn}">View Dashboard →</a>
  `),

  returnDueReminder: ({ name, toolName, endDate, ownerPhone, bookingsUrl }) => base(`
    <h2 style="${h2}">📦 Tool Return Due Today</h2>
    <p style="${p}">Hi <strong>${name}</strong>, your rental of <strong>${toolName}</strong> ends today.</p>
    <div style="${box}">
      <p style="margin:0 0 8px;color:#dc2626;font-weight:600;">⚠️ Please return the tool today</p>
      <p style="margin:4px 0;${p}">📅 Return By: <strong>${endDate}</strong></p>
      <p style="margin:4px 0;${p}">📞 Owner Contact: <strong>${ownerPhone}</strong></p>
    </div>
    <p style="${p}">Returning the tool on time ensures you receive your security deposit back promptly.</p>
    <a href="${bookingsUrl}" style="${btn}">View Booking →</a>
  `),
  autoReturnConfirmed: ({ ownerName, toolName }) => base(`
    <h2 style="${h2}">⏰ Return Auto-Confirmed — Payment Released</h2>
    <p style="${p}">Hi <strong>${ownerName}</strong>, since the return was not confirmed within 2 days of the rental end date, the system has auto-confirmed the return of <strong>${toolName}</strong> and released your final payment.</p>
  `),

  toolRejected: ({ ownerName, toolName, reason, dashboardUrl }) => base(`
    <h2 style="${h2}">⚠️ Tool Listing Needs Update</h2>
    <p style="${p}">Hi <strong>${ownerName}</strong>, your tool <strong>${toolName}</strong> was not approved.</p>
    ${reason ? `<div style="${box}"><p style="margin:0;color:#dc2626;"><strong>Reason:</strong> ${reason}</p></div>` : ''}
    <a href="${dashboardUrl}" style="${btn}">Update Listing →</a>
  `),


  depositRequired: ({ renterName, toolName, depositAmount, totalAmount, startDate, endDate, payUrl }) => base(`
    <h2 style="${h2}">🔐 Security Deposit Required</h2>
    <p style="${p}">Hi <strong>${renterName}</strong>, your booking request for <strong>${toolName}</strong> is pending payment of a security deposit.</p>
    <div style="${box}">
      <p style="${p}"><strong>Rental Period:</strong> ${startDate} → ${endDate}</p>
      <p style="${p}"><strong>Total Rental:</strong> ₦${Number(totalAmount).toLocaleString()}</p>
      <p style="${p}"><strong>Security Deposit (20%):</strong> <span style="color:#f2711c;font-size:18px;font-weight:700;">₦${Number(depositAmount).toLocaleString()}</span></p>
    </div>
    <p style="${p}">This deposit is fully refundable if the tool is returned in good condition and the booking is completed successfully.</p>
    <a href="${payUrl}" style="${btn}">Pay Deposit Now →</a>
  `),

  bookingCancelled: ({ name, toolName, startDate, refundAmount, refundPercent, policy, bookingsUrl }) => base(`
    <h2 style="${h2}">❌ Booking Cancelled</h2>
    <p style="${p}">Hi <strong>${name}</strong>, your booking for <strong>${toolName}</strong> starting <strong>${startDate}</strong> has been cancelled.</p>
    <div style="${box}">
      <p style="${p}"><strong>Cancellation Policy:</strong> ${policy}</p>
      <p style="${p}"><strong>Refund:</strong> <span style="color:${refundPercent > 0 ? '#16a34a' : '#dc2626'};font-size:18px;font-weight:700;">${refundPercent > 0 ? '₦' + Number(refundAmount).toLocaleString() : 'No refund'}</span></p>
      ${refundPercent > 0 ? '<p style="' + p + '">Refund will be processed to your original payment method within 3–5 business days.</p>' : ''}
    </div>
    <a href="${bookingsUrl}" style="${btn}">View My Bookings →</a>
  `),

  bookingCancelledOwner: ({ ownerName, toolName, renterName, startDate, endDate, dashboardUrl }) => base(`
    <h2 style="${h2}">ℹ️ Booking Cancelled by Renter</h2>
    <p style="${p}">Hi <strong>${ownerName}</strong>, <strong>${renterName}</strong> has cancelled their booking for <strong>${toolName}</strong>.</p>
    <div style="${box}">
      <p style="${p}"><strong>Cancelled Dates:</strong> ${startDate} → ${endDate}</p>
      <p style="${p}">Your tool is now available for new bookings.</p>
    </div>
    <a href="${dashboardUrl}" style="${btn}">View Dashboard →</a>
  `),

  refundProcessed: ({ name, toolName, refundAmount, refundRef, reason }) => base(`
    <h2 style="${h2}">💸 Refund Processed</h2>
    <p style="${p}">Hi <strong>${name}</strong>, your refund for <strong>${toolName}</strong> has been processed.</p>
    <div style="${box}">
      <p style="${p}"><strong>Refund Amount:</strong> <span style="color:#16a34a;font-size:20px;font-weight:700;">₦${Number(refundAmount).toLocaleString()}</span></p>
      <p style="${p}"><strong>Reference:</strong> <code>${refundRef}</code></p>
      <p style="${p}"><strong>Reason:</strong> ${reason}</p>
    </div>
    <p style="${p}">Funds will arrive in your account within 3–5 business days depending on your bank.</p>
  `),

  bookingReminder: ({ renterName, toolName, startDate, ownerName, ownerPhone, bookingsUrl }) => base(`
    <h2 style="${h2}">⏰ Rental Starts Tomorrow!</h2>
    <p style="${p}">Hi <strong>${renterName}</strong>, just a reminder that your rental of <strong>${toolName}</strong> starts tomorrow.</p>
    <div style="${box}">
      <p style="${p}"><strong>Start Date:</strong> ${startDate}</p>
      <p style="${p}"><strong>Owner:</strong> ${ownerName}</p>
      ${ownerPhone ? '<p style="' + p + '"><strong>Owner Phone:</strong> ' + ownerPhone + '</p>' : ''}
    </div>
    <p style="${p}">Make sure to coordinate with the owner for pickup/delivery.</p>
    <a href="${bookingsUrl}" style="${btn}">View Booking →</a>
  `),

  returnReminder: ({ renterName, toolName, endDate, ownerName, ownerPhone, bookingsUrl }) => base(`
    <h2 style="${h2}">📦 Tool Return Due Tomorrow</h2>
    <p style="${p}">Hi <strong>${renterName}</strong>, your rental of <strong>${toolName}</strong> ends tomorrow. Please arrange return with the owner.</p>
    <div style="${box}">
      <p style="${p}"><strong>Return Date:</strong> ${endDate}</p>
      <p style="${p}"><strong>Owner:</strong> ${ownerName}</p>
      ${ownerPhone ? '<p style="' + p + '"><strong>Owner Phone:</strong> ' + ownerPhone + '</p>' : ''}
    </div>
    <p style="${p}">Late returns may incur additional charges.</p>
    <a href="${bookingsUrl}" style="${btn}">View Booking →</a>
  `),

  ownerReminderNewRequest: ({ ownerName, toolName, renterName, startDate, endDate, dashboardUrl }) => base(`
    <h2 style="${h2}">⚠️ Booking Request Awaiting Response</h2>
    <p style="${p}">Hi <strong>${ownerName}</strong>, you have a pending booking request for <strong>${toolName}</strong> from <strong>${renterName}</strong> that expires in 24 hours.</p>
    <div style="${box}">
      <p style="${p}"><strong>Rental Period:</strong> ${startDate} → ${endDate}</p>
      <p style="${p}">Please approve or reject to avoid automatic expiry.</p>
    </div>
    <a href="${dashboardUrl}" style="${btn}">Respond Now →</a>
  `),

  nonReturnRenter: ({ renterName, toolName, ownerName, ownerPhone, endDate, depositAmount, bookingsUrl }) => base(`
    <h2 style="${h2}">🚨 Non-Return Reported — Immediate Action Required</h2>
    <p style="${p}">Hi <strong>${renterName}</strong>, the owner has reported that you have not returned <strong>${toolName}</strong> after the rental end date.</p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;margin:20px 0;">
      <p style="margin:0 0 8px;color:#dc2626;font-weight:700;font-size:16px;">⚠️ Your security deposit has been forfeited</p>
      <p style="margin:4px 0;${p}"><strong>Tool:</strong> ${toolName}</p>
      <p style="margin:4px 0;${p}"><strong>Was due back:</strong> ${endDate}</p>
      <p style="margin:4px 0;${p}"><strong>Deposit forfeited:</strong> <span style="color:#dc2626;font-weight:700;">₦${Number(depositAmount).toLocaleString()}</span></p>
    </div>
    <p style="${p}">Please contact the owner immediately to arrange return of the tool:</p>
    <div style="${box}">
      <p style="margin:0;font-size:15px;font-weight:600;">${ownerName}</p>
      ${ownerPhone ? `<p style="margin:4px 0 0;color:#6b7280;">📞 ${ownerPhone}</p>` : ''}
    </div>
    <p style="${p}">Continued failure to return the tool may result in your account being suspended and legal action being taken.</p>
    <a href="${bookingsUrl}" style="${btn}">View My Bookings →</a>
  `),

  disputeEscalation1: ({ renterName, toolName, ownerName, ownerPhone, reportedAt, deadlineDate, supportUrl }) => base(`
    <h2 style="${h2}">🚨 FINAL WARNING — Return Tool Immediately</h2>
    <p style="${p}">Hi <strong>${renterName}</strong>, this is a final warning regarding the unreturned tool <strong>${toolName}</strong>.</p>
    <div style="background:#fef2f2;border:2px solid #dc2626;border-radius:12px;padding:20px;margin:20px 0;">
      <p style="margin:0 0 8px;color:#dc2626;font-weight:700;font-size:16px;">⚠️ Your account will be suspended in 4 days</p>
      <p style="margin:4px 0;${p}"><strong>Tool:</strong> ${toolName}</p>
      <p style="margin:4px 0;${p}"><strong>Reported:</strong> ${reportedAt}</p>
      <p style="margin:4px 0;${p}"><strong>Suspension deadline:</strong> <span style="color:#dc2626;font-weight:700;">${deadlineDate}</span></p>
    </div>
    <p style="${p}">Please return the tool to the owner immediately:</p>
    <div style="${box}">
      <p style="margin:0;font-weight:600;">${ownerName}</p>
      ${ownerPhone ? `<p style="margin:4px 0 0;color:#6b7280;">📞 ${ownerPhone}</p>` : ''}
    </div>
    <p style="${p}">If there are special circumstances (illness, emergency, bereavement), please contact our support team immediately so we can assist.</p>
    <a href="${supportUrl}" style="${btn}">Contact Support →</a>
  `),

  disputeWrittenOff: ({ ownerName, toolName, renterName, depositAmount, resolution, supportUrl }) => base(`
    <h2 style="${h2}">⚖️ Dispute Closed — Tool Written Off</h2>
    <p style="${p}">Hi <strong>${ownerName}</strong>, the non-return dispute for <strong>${toolName}</strong> has been closed after 7 days.</p>
    <div style="${box}">
      <p style="margin:0 0 8px;font-weight:600;">Outcome:</p>
      <p style="margin:4px 0;${p}"><strong>Renter (${renterName}):</strong> Account suspended</p>
      <p style="margin:4px 0;${p}"><strong>Security Deposit:</strong> <span style="color:#f2711c;font-weight:700;">₦${Number(depositAmount).toLocaleString()} forfeited</span></p>
      <p style="margin:4px 0;${p}"><strong>Tool status:</strong> Marked as lost — pending admin review to relist</p>
    </div>
    <p style="${p}">${resolution}</p>
    <a href="${supportUrl}" style="${btn}">Contact Support →</a>
  `),

  disputeResolved: ({ name, toolName, resolution, outcome, clientUrl }) => base(`
    <h2 style="${h2}">✅ Dispute Resolved</h2>
    <p style="${p}">Hi <strong>${name}</strong>, the dispute for <strong>${toolName}</strong> has been resolved by our admin team.</p>
    <div style="${box}">
      <p style="margin:0 0 8px;font-weight:600;">Outcome: <span style="color:#f2711c;text-transform:capitalize;">${(outcome || '').replace('_', ' ')}</span></p>
      <p style="margin:0;${p}">${resolution}</p>
    </div>
    <a href="${clientUrl}" style="${btn}">Go to ToolShare Africa →</a>
  `),

  accountSuspended: ({ name, reason, supportUrl }) => base(`
    <h2 style="${h2}">⚠️ Your Account Has Been Suspended</h2>
    <p style="${p}">Hi <strong>${name}</strong>, your ToolShare Africa account has been suspended by our admin team.</p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;margin:20px 0;">
      <p style="margin:0;color:#dc2626;font-weight:700;">Reason for suspension:</p>
      <p style="margin:8px 0 0;color:#7f1d1d;">${reason}</p>
    </div>
    <p style="${p}">While suspended you cannot log in, make bookings, or list tools.</p>
    <p style="${p}">If you believe this is a mistake, please contact our support team to appeal.</p>
    <a href="${supportUrl}" style="${btn}">Contact Support →</a>
  `),

  accountUnsuspended: ({ name, clientUrl }) => base(`
    <h2 style="${h2}">✅ Your Account Has Been Reinstated</h2>
    <p style="${p}">Hi <strong>${name}</strong>, great news — your ToolShare Africa account suspension has been lifted.</p>
    <p style="${p}">You can now log in and use the platform again. Please ensure you follow our community guidelines going forward.</p>
    <a href="${clientUrl}" style="${btn}">Go to ToolShare Africa →</a>
  `),

  forgotPassword: ({ name, resetUrl }) => base(`
    <h2 style="${h2}">🔑 Reset Your Password</h2>
    <p style="${p}">Hi <strong>${name}</strong>, we received a request to reset your password.</p>
    <p style="${p}">Click the button below to set a new password. This link expires in <strong>30 minutes</strong>.</p>
    <a href="${resetUrl}" style="${btn}">Reset Password →</a>
    <div style="${box}">
      <p style="margin:0;font-size:13px;color:#6b7280;">If you didn't request this, you can safely ignore this email. Your password will not change.</p>
    </div>
  `),
};

const sendEmail = async ({ to, subject, template, data }) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log(`📧 Email skipped (no RESEND_API_KEY): ${subject} → ${to}`);
      return;
    }
    if (!templates[template]) {
      console.error(`📧 Unknown template: ${template}`);
      return;
    }
    const html = templates[template](data);
    const { error } = await resend.emails.send({
      from: 'ToolShare Africa <onboarding@resend.dev>',
      to,
      subject,
      html,
    });
    if (error) {
      console.error(`📧 Email failed: ${error.message}`);
    } else {
      console.log(`📧 Email sent: ${subject} → ${to}`);
    }
  } catch (err) {
    console.error(`📧 Email failed: ${err.message}`);
  }
};

module.exports = { sendEmail };