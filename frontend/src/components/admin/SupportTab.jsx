import { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function SupportTab({ tickets, setTickets, onRefresh }) {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText]           = useState('');
  const [replyLoading, setReplyLoading]     = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} &middot; {tickets.filter(t => t.status === 'open').length} open
        </p>
        <button onClick={onRefresh} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
          🔄 Refresh
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🎫</p>
          <p className="font-medium">No support tickets yet</p>
        </div>
      ) : tickets.map(ticket => (
        <div key={ticket._id} className={`card border-l-4 ${ticket.status === 'open' ? 'border-l-red-400' : ticket.status === 'in_progress' ? 'border-l-yellow-400' : 'border-l-green-400'}`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-bold text-gray-900 text-sm">#{ticket.ticketNumber}</span>
                <span className={`badge text-xs ${ticket.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>{ticket.priority}</span>
                <span className={`badge text-xs ${ticket.status === 'open' ? 'bg-red-50 text-red-700 border-red-200' : ticket.status === 'in_progress' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'}`}>{ticket.status.replace('_', ' ')}</span>
                <span className="badge text-xs bg-gray-50 text-gray-500 border-gray-200 capitalize">{ticket.category}</span>
              </div>
              <p className="font-semibold text-gray-800 text-sm">{ticket.subject}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                <span className="font-medium text-gray-700">{ticket.name}</span>
                {' · '}
                <a href={`mailto:${ticket.email}`} className="text-brand-600 hover:underline">{ticket.email}</a>
                {' · '}{new Date(ticket.createdAt).toLocaleDateString()}
              </p>
              {ticket.messages?.[0] && (
                <p className="text-xs text-gray-400 mt-1 italic truncate">&ldquo;{ticket.messages[0].message}&rdquo;</p>
              )}
            </div>
            <button onClick={() => { setSelectedTicket(selectedTicket?._id === ticket._id ? null : ticket); setReplyText(''); }}
              className="btn-secondary text-xs px-3 py-1.5 shrink-0">
              {selectedTicket?._id === ticket._id ? 'Close' : 'View & Reply'}
            </button>
          </div>

          {selectedTicket?._id === ticket._id && (
            <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedTicket.messages.map((msg, i) => (
                  <div key={i} className={`rounded-xl px-4 py-3 text-sm ${msg.sender === 'admin' ? 'bg-brand-50 text-brand-900 ml-8' : 'bg-gray-50 text-gray-700 mr-8'}`}>
                    <p className="text-xs font-semibold mb-1 text-gray-400">{msg.sender === 'admin' ? '👤 You (Admin)' : `🙋 ${ticket.name}`}</p>
                    {msg.message}
                  </div>
                ))}
              </div>

              {selectedTicket.status !== 'resolved' && (
                <div className="space-y-2">
                  <textarea rows={3} className="input-field resize-none text-sm"
                    placeholder="Type your reply..." value={replyText}
                    onChange={e => setReplyText(e.target.value)} />
                  <div className="flex gap-2 flex-wrap">
                    <button disabled={!replyText.trim() || replyLoading}
                      onClick={async () => {
                        setReplyLoading(true);
                        try {
                          const { data } = await api.post(`/support/admin/tickets/${ticket._id}/reply`, { message: replyText });
                          setTickets(prev => prev.map(t => t._id === ticket._id ? data.ticket : t));
                          setSelectedTicket(data.ticket);
                          setReplyText('');
                          toast.success('Reply sent!');
                        } catch { toast.error('Failed to send reply'); }
                        setReplyLoading(false);
                      }}
                      className="btn-primary text-sm px-4 py-2 disabled:opacity-50">
                      {replyLoading ? 'Sending...' : '📤 Send Reply'}
                    </button>
                    <button onClick={async () => {
                      try {
                        await api.put(`/support/admin/tickets/${ticket._id}/status`, { status: 'resolved' });
                        setTickets(prev => prev.map(t => t._id === ticket._id ? { ...t, status: 'resolved' } : t));
                        setSelectedTicket(null);
                        toast.success('Ticket resolved!');
                      } catch { toast.error('Failed to resolve'); }
                    }} className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-xl font-medium transition-colors">
                      ✅ Mark Resolved
                    </button>
                    <button onClick={async () => {
                      if (!confirm('Delete this ticket?')) return;
                      try {
                        await api.delete(`/support/admin/tickets/${ticket._id}`);
                        setTickets(prev => prev.filter(t => t._id !== ticket._id));
                        setSelectedTicket(null);
                        toast.success('Ticket deleted');
                      } catch { toast.error('Failed to delete'); }
                    }} className="bg-red-50 hover:bg-red-100 text-red-600 text-sm px-4 py-2 rounded-xl font-medium transition-colors">
                      🗑 Delete
                    </button>
                  </div>
                </div>
              )}
              {ticket.status === 'resolved' && (
                <p className="text-xs text-green-600 font-medium">✅ This ticket has been resolved.</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}