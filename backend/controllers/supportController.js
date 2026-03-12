const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');
const { sendEmail } = require('../utils/sendEmail');
const notify = require('../utils/notify');

// Helper: notify all admin accounts in-app
const notifyAdmins = async ({ title, message, type, link }) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id');
    await Promise.all(admins.map(async admin => {
      try { await notify({ userId: admin._id, title, message, type, link }); } catch (_) {}
    }));
  } catch {}
};

// ── USER: Submit ticket ───────────────────────────────────────────────────────
// POST /api/support/tickets
const createTicket = async (req, res, next) => {
  try {
    const { name, email, subject, message, category, source } = req.body;
    if (!name || !email || !subject || !message)
      return res.status(400).json({ success: false, message: 'Name, email, subject and message are required.' });

    // Auto-set priority based on category
    const highPriority = ['payment', 'dispute', 'kyc'];
    const priority = highPriority.includes(category) ? 'high' : 'medium';

    const ticket = await SupportTicket.create({
      userId: req.user?._id || null,
      name, email, subject, category: category || 'general',
      source: source || 'contact',
      priority,
      messages: [{ sender: 'user', message }],
    });

    // Email confirmation to user
    try { await sendEmail({
      to: email,
      subject: `✅ Support Ticket #${ticket.ticketNumber} Received`,
      template: 'ticketCreated',
      data: { name, ticketNumber: ticket.ticketNumber, subject, message, clientUrl: process.env.CLIENT_URL },
    }); } catch (_) {}

    // Email alert to admin (use ADMIN_EMAIL if set, fallback to EMAIL_USER)
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    try { await sendEmail({
      to: adminEmail,
      subject: `🎫 New Support Ticket #${ticket.ticketNumber} — ${subject}`,
      template: 'ticketAlert',
      data: { name, email, subject, message, category, ticketNumber: ticket.ticketNumber, adminUrl: `${process.env.CLIENT_URL}/admin` },
    }); } catch (_) {}

    // ── In-app notification to all admins ────────────────────────────────────
    const priorityIcon = priority === 'high' ? '🚨' : '🎫';
    await notifyAdmins({
      title: `${priorityIcon} New Support Ticket #${ticket.ticketNumber}`,
      message: `${name} submitted a ${priority} priority ticket: "${subject}"`,
      type: 'system',
      link: '/admin',
    });

    res.status(201).json({
      success: true,
      message: `Ticket #${ticket.ticketNumber} submitted! We'll reply within 24 hours.`,
      ticketNumber: ticket.ticketNumber,
      ticket,
    });
  } catch (error) { next(error); }
};

// ── USER: Get own tickets ─────────────────────────────────────────────────────
// GET /api/support/my-tickets
const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({
      $or: [
        { userId: req.user._id },
        { email: req.user.email },
      ],
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: tickets.length, tickets });
  } catch (error) { next(error); }
};

// ── ADMIN: Get all tickets ────────────────────────────────────────────────────
// GET /api/support/admin/tickets
const getAllTickets = async (req, res, next) => {
  try {
    const { status, category, priority } = req.query;
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    const [tickets, allTickets] = await Promise.all([
      SupportTicket.find(query).populate('userId', 'name email role').sort({ createdAt: -1 }),
      SupportTicket.find({}),
    ]);

    const counts = {
      total: allTickets.length,
      open: allTickets.filter(t => t.status === 'open').length,
      in_progress: allTickets.filter(t => t.status === 'in_progress').length,
      resolved: allTickets.filter(t => t.status === 'resolved').length,
      high: allTickets.filter(t => t.priority === 'high').length,
    };

    res.status(200).json({ success: true, counts, tickets });
  } catch (error) { next(error); }
};

// ── ADMIN: Reply to ticket ────────────────────────────────────────────────────
// POST /api/support/admin/tickets/:id/reply
const replyToTicket = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Reply message is required.' });

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });

    ticket.messages.push({ sender: 'admin', message });
    ticket.status = 'in_progress';
    await ticket.save();

    // Email reply to user
    sendEmail({
      to: ticket.email,
      subject: `💬 Reply to Your Ticket #${ticket.ticketNumber} — ${ticket.subject}`,
      template: 'ticketReply',
      data: {
        name: ticket.name,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        adminMessage: message,
        clientUrl: process.env.CLIENT_URL,
      },
    });

    // In-app notification to user (if they have an account)
    if (ticket.userId) {
      notify({
        userId: ticket.userId,
        title: `💬 Support Reply — Ticket #${ticket.ticketNumber}`,
        message: `We've replied to your support ticket: "${ticket.subject}"`,
        type: 'system',
        link: '/help',
      });
    }

    res.status(200).json({ success: true, message: 'Reply sent!', ticket });
  } catch (error) { next(error); }
};

// ── ADMIN: Update ticket status ───────────────────────────────────────────────
// PUT /api/support/admin/tickets/:id/status
const updateTicketStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['open', 'in_progress', 'resolved'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status.' });

    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, {
      status,
      ...(status === 'resolved' && { resolvedAt: new Date(), resolvedBy: req.user._id }),
    }, { new: true });

    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });

    // Notify user when resolved
    if (status === 'resolved') {
      sendEmail({
        to: ticket.email,
        subject: `✅ Ticket #${ticket.ticketNumber} Resolved`,
        template: 'ticketResolved',
        data: { name: ticket.name, ticketNumber: ticket.ticketNumber, subject: ticket.subject, clientUrl: process.env.CLIENT_URL },
      });

      // In-app notification to user (if they have an account)
      if (ticket.userId) {
        notify({
          userId: ticket.userId,
          title: `✅ Support Ticket #${ticket.ticketNumber} Resolved`,
          message: `Your support ticket "${ticket.subject}" has been resolved. Check your email for details.`,
          type: 'system',
          link: '/help',
        });
      }
    }

    res.status(200).json({ success: true, message: `Ticket marked as ${status}.`, ticket });
  } catch (error) { next(error); }
};

// ── ADMIN: Delete ticket ──────────────────────────────────────────────────────
// DELETE /api/support/admin/tickets/:id
const deleteTicket = async (req, res, next) => {
  try {
    await SupportTicket.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Ticket deleted.' });
  } catch (error) { next(error); }
};

module.exports = { createTicket, getMyTickets, getAllTickets, replyToTicket, updateTicketStatus, deleteTicket };