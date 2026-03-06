const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createTicket, getMyTickets, getAllTickets,
  replyToTicket, updateTicketStatus, deleteTicket,
} = require('../controllers/supportController');

// Public/user routes
router.post('/tickets', createTicket); // no auth needed — guests can submit too
router.get('/my-tickets', protect, getMyTickets);

// Admin routes
router.get('/admin/tickets', protect, authorize('admin'), getAllTickets);
router.post('/admin/tickets/:id/reply', protect, authorize('admin'), replyToTicket);
router.put('/admin/tickets/:id/status', protect, authorize('admin'), updateTicketStatus);
router.delete('/admin/tickets/:id', protect, authorize('admin'), deleteTicket);

module.exports = router;