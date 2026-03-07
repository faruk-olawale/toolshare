/**
 * Booking Reminders & Auto-actions cron job
 * Runs every hour:
 * - Send 24h reminder before rental starts
 * - Send 24h reminder before return due
 * - Auto-expire pending bookings not responded to in 48h
 * - Remind owners of pending requests expiring soon (24h warning)
 */
const cron    = require('node-cron');
const Booking = require('../models/Booking');
const Tool    = require('../models/Tool');
const User    = require('../models/User');
const { sendEmail } = require('../utils/sendEmail');
const { sendSMS }   = require('../utils/sms');
const notify        = require('../utils/notify');

const fmt = (date) => new Date(date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

const bookingRemindersJob = () => {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Running booking reminders job...');
    const now = new Date();

    try {
      // ── 1. Start reminders (24h before rental starts) ──────────────────────
      const tomorrowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const tomorrowEnd   = new Date(now.getTime() + 25 * 60 * 60 * 1000);

      const startingSoon = await Booking.find({
        status: 'approved',
        paymentStatus: 'paid',
        startDate: { $gte: tomorrowStart, $lt: tomorrowEnd },
        'reminderSent.dayBefore': false,
      })
        .populate('renterId', 'name email phone')
        .populate('ownerId',  'name email phone')
        .populate('toolId',   'name');

      for (const booking of startingSoon) {
        try {
          // Email renter
          sendEmail({
            to: booking.renterId.email,
            subject: `⏰ Reminder: ${booking.toolId.name} rental starts tomorrow`,
            template: 'bookingReminder',
            data: {
              renterName: booking.renterId.name,
              toolName:   booking.toolId.name,
              startDate:  fmt(booking.startDate),
              ownerName:  booking.ownerId.name,
              ownerPhone: booking.ownerId.phone,
              bookingsUrl: `${process.env.CLIENT_URL}/bookings`,
            },
          });
          // SMS renter
          if (booking.renterId.phone) {
            sendSMS({
              to: booking.renterId.phone,
              message: `ToolShare: Reminder! Your rental of ${booking.toolId.name} starts tomorrow. Contact owner: ${booking.ownerId.phone || 'via app'}`,
            });
          }
          // In-app
          await notify({
            userId: booking.renterId._id,
            title: '⏰ Rental Starts Tomorrow',
            message: `Your rental of "${booking.toolId.name}" starts tomorrow. Make sure you've arranged pickup with ${booking.ownerId.name}.`,
            type: 'booking_approved',
            link: '/bookings',
          });

          booking.reminderSent.dayBefore = true;
          await booking.save();
        } catch (e) { console.error('Reminder error:', e.message); }
      }

      // ── 2. Return reminders (24h before end date) ───────────────────────────
      const returningSoon = await Booking.find({
        status: 'approved',
        endDate: { $gte: tomorrowStart, $lt: tomorrowEnd },
        'reminderSent.returnDue': false,
      })
        .populate('renterId', 'name email phone')
        .populate('ownerId',  'name email phone')
        .populate('toolId',   'name');

      for (const booking of returningSoon) {
        try {
          sendEmail({
            to: booking.renterId.email,
            subject: `📦 Reminder: Return ${booking.toolId.name} tomorrow`,
            template: 'returnReminder',
            data: {
              renterName: booking.renterId.name,
              toolName:   booking.toolId.name,
              endDate:    fmt(booking.endDate),
              ownerName:  booking.ownerId.name,
              ownerPhone: booking.ownerId.phone,
              bookingsUrl: `${process.env.CLIENT_URL}/bookings`,
            },
          });
          if (booking.renterId.phone) {
            sendSMS({
              to: booking.renterId.phone,
              message: `ToolShare: Return ${booking.toolId.name} tomorrow! Contact owner: ${booking.ownerId.phone || 'via app'}`,
            });
          }
          await notify({
            userId: booking.renterId._id,
            title: '📦 Return Due Tomorrow',
            message: `Please return "${booking.toolId.name}" to ${booking.ownerId.name} by tomorrow.`,
            type: 'booking_approved',
            link: '/bookings',
          });

          booking.reminderSent.returnDue = true;
          await booking.save();
        } catch (e) { console.error('Return reminder error:', e.message); }
      }

      // ── 3. Remind owner of pending requests expiring in 24h ─────────────────
      const expiringIn24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const pendingExpiringSoon = await Booking.find({
        status: 'pending',
        expiresAt: { $gte: now, $lt: expiringIn24h },
        'reminderSent.dayBefore': false,
      })
        .populate('ownerId',  'name email phone')
        .populate('renterId', 'name')
        .populate('toolId',   'name');

      for (const booking of pendingExpiringSoon) {
        try {
          sendEmail({
            to: booking.ownerId.email,
            subject: `⚠️ Booking request expiring soon — ${booking.toolId.name}`,
            template: 'ownerReminderNewRequest',
            data: {
              ownerName:  booking.ownerId.name,
              toolName:   booking.toolId.name,
              renterName: booking.renterId.name,
              startDate:  fmt(booking.startDate),
              endDate:    fmt(booking.endDate),
              dashboardUrl: `${process.env.CLIENT_URL}/booking-requests`,
            },
          });
          if (booking.ownerId.phone) {
            sendSMS({
              to: booking.ownerId.phone,
              message: `ToolShare: Booking request for ${booking.toolId.name} expires in 24h! Respond now: ${process.env.CLIENT_URL}/booking-requests`,
            });
          }
          await notify({
            userId: booking.ownerId._id,
            title: '⚠️ Booking Request Expiring Soon',
            message: `Request for "${booking.toolId.name}" from ${booking.renterId.name} expires in 24 hours. Please respond.`,
            type: 'booking_new',
            link: '/booking-requests',
          });

          booking.reminderSent.dayBefore = true;
          await booking.save();
        } catch (e) { console.error('Expiry reminder error:', e.message); }
      }

      // ── 4. Auto-expire pending bookings past 48h ─────────────────────────────
      const expiredBookings = await Booking.find({
        status: 'pending',
        expiresAt: { $lt: now },
      })
        .populate('renterId', 'name email phone')
        .populate('ownerId',  'name email phone')
        .populate('toolId',   'name');

      for (const booking of expiredBookings) {
        try {
          booking.status = 'rejected';
          await booking.save();

          sendEmail({
            to: booking.renterId.email,
            subject: `⏰ Booking request expired — ${booking.toolId.name}`,
            template: 'bookingExpired',
            data: {
              renterName: booking.renterId.name,
              toolName:   booking.toolId.name,
              reason:     'The owner did not respond within 48 hours.',
              browseUrl:  `${process.env.CLIENT_URL}/tools`,
            },
          });
          await notify({
            userId: booking.renterId._id,
            title: '⏰ Booking Request Expired',
            message: `Your request for "${booking.toolId.name}" expired — the owner didn't respond in time. Try another tool.`,
            type: 'booking_rejected',
            link: '/tools',
          });

          // Refund deposit if paid
          if (booking.deposit?.paid && booking.deposit.amount > 0) {
            booking.paymentStatus = 'refund_pending';
            booking.refund = { amount: booking.deposit.amount, reason: 'Booking expired — auto refund', processedAt: new Date() };
            await booking.save();
          }
        } catch (e) { console.error('Auto-expire error:', e.message); }
      }

      if (startingSoon.length + returningSoon.length + expiredBookings.length > 0) {
        console.log(`✅ Reminders: ${startingSoon.length} start, ${returningSoon.length} return, ${expiredBookings.length} expired`);
      }
    } catch (err) {
      console.error('❌ Booking reminders job error:', err.message);
    }
  });

  console.log('⏰ Booking reminders job scheduled (hourly)');
};

module.exports = bookingRemindersJob;