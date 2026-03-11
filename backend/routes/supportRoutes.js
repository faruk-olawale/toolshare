const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { supportLimiter } = require('../middleware/rateLimiter');
const {
  supportTicketValidation, supportReplyValidation,
  supportStatusValidation, mongoIdParam,
} = require('../middleware/validate');
const {
  createTicket, getMyTickets, getAllTickets,
  replyToTicket, updateTicketStatus, deleteTicket,
} = require('../controllers/supportController');

router.post('/tickets',                       supportLimiter, supportTicketValidation, createTicket);
router.get('/my-tickets',                     protect, getMyTickets);
router.get('/admin/tickets',                  protect, authorize('admin'), getAllTickets);
router.post('/admin/tickets/:id/reply',       protect, authorize('admin'), ...mongoIdParam('id'), supportReplyValidation, replyToTicket);
router.put('/admin/tickets/:id/status',       protect, authorize('admin'), ...mongoIdParam('id'), supportStatusValidation, updateTicketStatus);
router.delete('/admin/tickets/:id',           protect, authorize('admin'), ...mongoIdParam('id'), deleteTicket);

module.exports = router;