const cron   = require('node-cron');
const Booking = require('../models/Booking');
const { sendEmail } = require('../utils/sendEmail');
const { sendSMS }   = require('../utils/sms');
const notify        = require('../utils/notify');

const fmt = (d) => new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

const runReminderJob = async () => {
  console.log('🔔 Running reminder job...');
  const now   = new Date();

  // ── 1. Rental starts TOMORROW ─────────────────────────────────────────────
  try {
    const tomorrowStart = new Date(now); tomorrowStart.setDate(tomorrowStart.getDate() + 1); tomorrowStart.setHours(0,0,0,0);
    const tomorrowEnd   = new Date(tomorrowStart); tomorrowEnd.setHours(23,59,59,999);

    const upcomingBookings = await Booking.find({
      status: 'approved',
      startDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
      'reminderSent.dayBefore': false,
    })
      .populate('renterId', 'name email phone')
      .populate('ownerId',  'name email phone')
      .populate('toolId',   'name location');

    for (const b of upcomingBookings) {
      // Notify renter
      await notify({ userId: b.renterId._id, title: '⏰ Rental Starts Tomorrow', message: `Your rental of "${b.toolId?.name}" starts tomorrow. Make sure you arrange pickup with the owner.`, type: 'booking_approved', link: '/bookings' }).catch(() => {});
      sendEmail({ to: b.renterId.email, subject: `⏰ Reminder: "${b.toolId?.name}" starts tomorrow`, template: 'rentalStartsReminder', data: { name: b.renterId.name, toolName: b.toolId?.name, startDate: fmt(b.startDate), endDate: fmt(b.endDate), ownerPhone: b.ownerId?.phone || 'N/A', bookingsUrl: process.env.CLIENT_URL + '/bookings' } }).catch(() => {});
      if (b.renterId.phone) sendSMS({ to: b.renterId.phone, message: `ToolShare: Reminder — your rental of ${b.toolId?.name} starts tomorrow (${fmt(b.startDate)}). Contact owner: ${b.ownerId?.phone || 'N/A'}` }).catch(() => {});

      // Notify owner
      await notify({ userId: b.ownerId._id, title: '⏰ Rental Handover Tomorrow', message: `Rental of "${b.toolId?.name}" to ${b.renterId.name} starts tomorrow. Prepare for handover.`, type: 'booking_approved', link: '/booking-requests' }).catch(() => {});
      sendEmail({ to: b.ownerId.email, subject: `⏰ Handover Tomorrow — ${b.toolId?.name}`, template: 'ownerHandoverReminder', data: { name: b.ownerId.name, toolName: b.toolId?.name, renterName: b.renterId.name, renterPhone: b.renterId.phone || 'N/A', startDate: fmt(b.startDate), dashboardUrl: process.env.CLIENT_URL + '/booking-requests' } }).catch(() => {});

      b.reminderSent.dayBefore = true;
      await b.save();
      console.log(`🔔 Day-before reminder sent: ${b._id}`);
    }
  } catch (err) { console.error('Day-before reminder error:', err.message); }

  // ── 2. Rental starts TODAY ────────────────────────────────────────────────
  try {
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    const todayEnd   = new Date(now); todayEnd.setHours(23,59,59,999);

    const todayBookings = await Booking.find({
      status: 'approved',
      startDate: { $gte: todayStart, $lte: todayEnd },
      'reminderSent.dayOf': false,
    })
      .populate('renterId', 'name email phone')
      .populate('ownerId',  'name phone')
      .populate('toolId',   'name');

    for (const b of todayBookings) {
      await notify({ userId: b.renterId._id, title: '🚀 Rental Starts Today!', message: `Your rental of "${b.toolId?.name}" starts today. Contact the owner to arrange pickup.`, type: 'booking_approved', link: '/bookings' }).catch(() => {});
      if (b.renterId.phone) sendSMS({ to: b.renterId.phone, message: `ToolShare: Your rental of ${b.toolId?.name} starts TODAY. Owner contact: ${b.ownerId?.phone || 'N/A'}. Have a great rental!` }).catch(() => {});

      b.reminderSent.dayOf = true;
      await b.save();
      console.log(`🚀 Day-of reminder sent: ${b._id}`);
    }
  } catch (err) { console.error('Day-of reminder error:', err.message); }

  // ── 3. Return DUE TODAY ───────────────────────────────────────────────────
  try {
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    const todayEnd   = new Date(now); todayEnd.setHours(23,59,59,999);

    const returnsToday = await Booking.find({
      status: 'approved',
      endDate: { $gte: todayStart, $lte: todayEnd },
      'reminderSent.returnDue': false,
    })
      .populate('renterId', 'name email phone')
      .populate('ownerId',  'name email phone')
      .populate('toolId',   'name');

    for (const b of returnsToday) {
      // Notify renter
      await notify({ userId: b.renterId._id, title: '📦 Return Due Today', message: `Your rental of "${b.toolId?.name}" ends today. Please return it to the owner.`, type: 'booking_approved', link: '/bookings' }).catch(() => {});
      sendEmail({ to: b.renterId.email, subject: `📦 Return Due Today — ${b.toolId?.name}`, template: 'returnDueReminder', data: { name: b.renterId.name, toolName: b.toolId?.name, endDate: fmt(b.endDate), ownerPhone: b.ownerId?.phone || 'N/A', bookingsUrl: process.env.CLIENT_URL + '/bookings' } }).catch(() => {});
      if (b.renterId.phone) sendSMS({ to: b.renterId.phone, message: `ToolShare: Your rental of ${b.toolId?.name} ends TODAY. Please return it to the owner (${b.ownerId?.phone || 'N/A'}) to get your deposit back.` }).catch(() => {});

      // Notify owner
      await notify({ userId: b.ownerId._id, title: '📦 Tool Return Expected Today', message: `${b.renterId.name} should return "${b.toolId?.name}" today.`, type: 'booking_approved', link: '/booking-requests' }).catch(() => {});

      b.reminderSent.returnDue = true;
      await b.save();
      console.log(`📦 Return-due reminder sent: ${b._id}`);
    }
  } catch (err) { console.error('Return-due reminder error:', err.message); }

  console.log('🔔 Reminder job complete.');
};

// Runs every day at 8:00 AM
const startReminderJob = () => {
  cron.schedule('0 8 * * *', runReminderJob);
  console.log('🔔 Reminder job scheduled (runs daily at 8:00 AM)');
};

module.exports = { startReminderJob, runReminderJob };