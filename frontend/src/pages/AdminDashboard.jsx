import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Users, Package, BookOpen, TrendingUp, Eye, AlertTriangle, Shield } from 'lucide-react';

import { getImgUrl, PLACEHOLDER } from '../utils/imgUrl';

export default function AdminDashboard() {
  const [tab, setTab] = useState('pending');
  const [stats, setStats] = useState(null);
  const [pendingTools, setPendingTools] = useState([]);
  const [pendingKyc, setPendingKyc] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [suspendModal, setSuspendModal] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [checklist, setChecklist] = useState({});
  const [resolveModal, setResolveModal] = useState(null);
  const [resolveForm, setResolveForm] = useState({ resolution: '', action: '' });
  const [previewTool, setPreviewTool] = useState(null);
  const [previewImgIdx, setPreviewImgIdx] = useState(0);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes, kycRes, usersRes, bookingsRes, ticketsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/tools/pending'),
        api.get('/admin/kyc/pending'),
        api.get('/admin/users'),
        api.get('/admin/bookings'),
        api.get('/support/admin/tickets'),
      ]);
      setStats(statsRes.data.stats);
      setPendingTools(pendingRes.data.tools);
      setPendingKyc(kycRes.data.users);
      setAllUsers(usersRes.data.users);
      const bookings = bookingsRes.data.bookings;
      setAllBookings(bookings);
      setDisputes(bookings.filter(b => b.status === 'disputed'));
      setTickets(ticketsRes.data.tickets || []);
    } catch { toast.error('Failed to load admin data.'); }
    setLoading(false);
  };

  const verifyTool = async (id) => {
    setProcessing(id);
    try {
      await api.put(`/admin/tools/${id}/verify`);
      toast.success('Tool approved and live! ✅');
      setPendingTools(prev => prev.filter(t => t._id !== id));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    setProcessing(null);
  };

  const approveKyc = async (id) => {
    setProcessing(id);
    try {
      await api.put(`/admin/kyc/${id}/approve`);
      toast.success('KYC approved! ✅');
      setPendingKyc(prev => prev.filter(u => u._id !== id));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    setProcessing(null);
  };

  const handleReject = async () => {
    setProcessing(modal.id);
    try {
      if (modal.type === 'rejectTool') {
        await api.put(`/admin/tools/${modal.id}/reject`, { reason });
        setPendingTools(prev => prev.filter(t => t._id !== modal.id));
        toast.success('Tool rejected.');
      } else {
        await api.put(`/admin/kyc/${modal.id}/reject`, { reason });
        setPendingKyc(prev => prev.filter(u => u._id !== modal.id));
        toast.success('KYC rejected.');
      }
      setModal(null); setReason('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    setProcessing(null);
  };

  const handleDeleteUser = async () => {
    if (!deleteModal) return;
    setProcessing(deleteModal._id);
    try {
      await api.delete(`/admin/users/${deleteModal._id}`);
      setAllUsers(prev => prev.filter(u => u._id !== deleteModal._id));
      setPendingKyc(prev => prev.filter(u => u._id !== deleteModal._id));
      toast.success(`${deleteModal.name}'s account has been deleted.`);
      setDeleteModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    }
    setProcessing(null);
  };


  if (loading) return (
    <div className="py-8 page-container"><div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-100 rounded w-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}</div>
    </div></div>
  );

  const tabs = [
    { key: 'pending', label: 'Tools', count: pendingTools.length, alert: pendingTools.length > 0 },
    { key: 'kyc', label: 'KYC', count: pendingKyc.length, alert: pendingKyc.length > 0 },
    { key: 'users', label: 'Users', count: allUsers.length },
    { key: 'bookings', label: 'Bookings', count: allBookings.length },
    { key: 'support', label: 'Support', count: tickets.filter(t => t.status !== 'resolved').length, alert: tickets.some(t => t.status === 'open') },
  ];

  return (
    <div className="py-6 animate-fade-in">
      <div className="page-container">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-gray-900 mb-1">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">Manage ToolShare Africa</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Users', value: stats.totalUsers, icon: <Users size={15} />, color: 'bg-blue-50 text-blue-600' },
              { label: 'Tools', value: stats.totalTools, icon: <Package size={15} />, color: 'bg-purple-50 text-purple-600' },
              { label: 'Bookings', value: stats.totalBookings, icon: <BookOpen size={15} />, color: 'bg-green-50 text-green-600' },
              { label: 'Pending Tools', value: stats.pendingTools, icon: <AlertTriangle size={15} />, color: 'bg-yellow-50 text-yellow-600' },
              { label: 'Pending KYC', value: stats.pendingKyc, icon: <Shield size={15} />, color: 'bg-orange-50 text-orange-600' },
              { label: 'Platform Revenue', value: `₦${Math.round(stats.totalRevenue || 0).toLocaleString()}`, icon: <TrendingUp size={15} />, color: 'bg-brand-50 text-brand-600' },
              { label: 'Gross Volume', value: `₦${Math.round(stats.grossVolume || 0).toLocaleString()}`, icon: <TrendingUp size={15} />, color: 'bg-green-50 text-green-700' },
              { label: 'Paid Bookings', value: stats.paidBookings || 0, icon: <BookOpen size={15} />, color: 'bg-teal-50 text-teal-600' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="card p-4">
                <div className={`w-8 h-8 ${color} rounded-xl flex items-center justify-center mb-2`}>{icon}</div>
                <div className="text-xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
          {tabs.map(({ key, label, count, alert }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${tab === key ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}>
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${alert ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'}`}>{count}</span>
            </button>
          ))}
        </div>

        {/* Pending Tools */}
        {tab === 'pending' && (
          <div className="space-y-4">
            {pendingTools.length === 0 ? (
              <div className="text-center py-20"><div className="text-5xl mb-3">✅</div><p className="text-gray-500">No tools pending review</p></div>
            ) : pendingTools.map(tool => (
              <div key={tool._id} className="card p-4">
                <div className="flex gap-3 mb-3">
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-earth-100">
                    <img src={getImgUrl(tool.images?.[0])} className="w-full h-full object-cover" onError={e => { e.target.src = PLACEHOLDER; }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{tool.name}</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="badge bg-purple-50 text-purple-700 border-purple-100 text-xs">{tool.category}</span>
                      <span className="badge bg-gray-50 text-gray-600 border-gray-100 text-xs">{tool.location}</span>
                    </div>
                    <div className="text-brand-600 font-bold text-sm mt-1">₦{tool.pricePerDay?.toLocaleString()}/day</div>
                    <p className="text-xs text-gray-400 truncate">{tool.ownerId?.name} · {tool.ownerId?.email}</p>
                    {/* KYC badge on owner */}
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${tool.ownerId?.kyc?.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                      Owner KYC: {tool.ownerId?.kyc?.status || 'not submitted'}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{tool.description}</p>
                {tool.ownershipNote && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-3">
                    <p className="text-xs font-medium text-blue-700 mb-1">Owner's note about ownership:</p>
                    <p className="text-sm text-blue-800">{tool.ownershipNote}</p>
                  </div>
                )}
                {/* Ownership documents */}
                {tool.ownershipDocs?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">Proof of Ownership Documents:</p>
                    <div className="flex flex-wrap gap-2">
                      {tool.ownershipDocs.map((doc, i) => (
                        <a key={i} href={getImgUrl(doc)} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100">
                          📄 Document {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button onClick={() => { setPreviewTool(tool); setPreviewImgIdx(0); }} className="btn-secondary py-2 px-3 text-sm flex items-center justify-center gap-1">
                    <Eye size={13} /> Preview
                  </button>
                  <button onClick={() => { setModal({ type: 'rejectTool', id: tool._id }); setReason(''); }}
                    disabled={processing === tool._id}
                    className="btn-secondary py-2 px-4 text-sm text-red-500 border-red-100 hover:bg-red-50 flex items-center justify-center gap-1">
                    <XCircle size={14} /> Reject
                  </button>
                  <button onClick={() => verifyTool(tool._id)} disabled={processing === tool._id}
                    className="btn-primary py-2 px-4 text-sm flex items-center justify-center gap-1 flex-1">
                    <CheckCircle size={14} /> {processing === tool._id ? 'Processing...' : 'Approve & Go Live'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* KYC Verification */}
        {tab === 'kyc' && (
          <div className="space-y-4">
            {pendingKyc.length === 0 ? (
              <div className="text-center py-20"><div className="text-5xl mb-3">✅</div><p className="text-gray-500">No KYC submissions pending</p></div>
            ) : pendingKyc.map(user => (
              <div key={user._id} className="card p-4">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-500">{user.email} · {user.phone}</p>
                    <div className="flex gap-2 mt-1">
                      <span className={`badge text-xs ${user.role === 'owner' ? 'bg-brand-50 text-brand-700 border-brand-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>{user.role}</span>
                      <span className="badge text-xs bg-yellow-50 text-yellow-700 border-yellow-100">KYC Pending</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(user.kyc?.submittedAt).toLocaleDateString()}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">ID Type</p>
                    <p className="text-sm font-medium text-gray-800 capitalize">{user.kyc?.idType?.replace('_', ' ')}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">ID Number</p>
                    <p className="text-sm font-medium text-gray-800">{user.kyc?.idNumber}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {user.kyc?.idDocument && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1 font-medium">ID Document</p>
                      <a href={getImgUrl(user.kyc.idDocument)} target="_blank" rel="noreferrer">
                        <img src={getImgUrl(user.kyc.idDocument)} className="w-full h-32 object-cover rounded-xl border border-gray-200 hover:opacity-90 transition" />
                      </a>
                    </div>
                  )}
                  {user.kyc?.selfie && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1 font-medium">Selfie with ID</p>
                      <a href={getImgUrl(user.kyc.selfie)} target="_blank" rel="noreferrer">
                        <img src={getImgUrl(user.kyc.selfie)} className="w-full h-32 object-cover rounded-xl border border-gray-200 hover:opacity-90 transition" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button onClick={() => { setModal({ type: 'rejectKyc', id: user._id }); setReason(''); }}
                    disabled={processing === user._id}
                    className="btn-secondary py-2 px-4 text-sm text-red-500 border-red-100 hover:bg-red-50 flex items-center justify-center gap-1">
                    <XCircle size={14} /> Reject
                  </button>
                  <button onClick={() => approveKyc(user._id)} disabled={processing === user._id}
                    className="btn-primary py-2 px-4 text-sm flex items-center justify-center gap-1 flex-1">
                    <CheckCircle size={14} /> {processing === user._id ? 'Processing...' : 'Approve Identity'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{['Name', 'Email', 'Role', 'KYC', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allUsers.map(u => (
                    <tr key={u._id} className={`hover:bg-gray-50 ${u.suspended ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{u.name}</td>
                      <td className="px-4 py-3 text-gray-500">{u.email}</td>
                      <td className="px-4 py-3"><span className={`badge text-xs ${u.role === 'owner' ? 'bg-brand-50 text-brand-700 border-brand-100' : u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>{u.role}</span></td>
                      <td className="px-4 py-3"><span className={`badge text-xs ${u.kyc?.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' : u.kyc?.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : u.kyc?.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>{u.kyc?.status || 'not submitted'}</span></td>
                      <td className="px-4 py-3">
                        {u.suspended
                          ? <span className="badge text-xs bg-red-50 text-red-700 border-red-200">🚫 Suspended</span>
                          : <span className="badge text-xs bg-green-50 text-green-700 border-green-100">✅ Active</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {u.role !== 'admin' && (
                          <div className="flex items-center gap-1">
                            {u.suspended ? (
                              <button onClick={async () => {
                                if (!confirm(`Reinstate ${u.name}'s account?`)) return;
                                try {
                                  const { data } = await api.put(`/admin/users/${u._id}/unsuspend`);
                                  setAllUsers(prev => prev.map(x => x._id === u._id ? data.user : x));
                                  toast.success(`${u.name} reinstated`);
                                } catch { toast.error('Failed to reinstate'); }
                              }} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 hover:bg-green-50 px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                                ✅ Reinstate
                              </button>
                            ) : (
                              <button onClick={() => setSuspendModal(u)}
                                className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800 hover:bg-orange-50 px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                                🚫 Suspend
                              </button>
                            )}
                            <button onClick={() => setDeleteModal(u)}
                              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors">
                              🗑️
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bookings */}
        {tab === 'support' && (
          <div className="space-y-4">
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
                    <p className="text-xs text-gray-400 mt-0.5">{ticket.name} · {ticket.email} · {new Date(ticket.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => {
                    setSelectedTicket(selectedTicket?._id === ticket._id ? null : ticket);
                    setReplyText(''); // clear reply text when switching tickets
                  }}
                    className="btn-secondary text-xs px-3 py-1.5 shrink-0">
                    {selectedTicket?._id === ticket._id ? 'Close' : 'View & Reply'}
                  </button>
                </div>

                {selectedTicket?._id === ticket._id && (
                  <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
                    {/* Message thread - use selectedTicket to always show latest */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {selectedTicket.messages.map((msg, i) => (
                        <div key={i} className={`rounded-xl px-4 py-3 text-sm ${msg.sender === 'admin' ? 'bg-brand-50 text-brand-900 ml-8' : 'bg-gray-50 text-gray-700 mr-8'}`}>
                          <p className="text-xs font-semibold mb-1 text-gray-400">{msg.sender === 'admin' ? '👤 You (Admin)' : `🙋 ${ticket.name}`}</p>
                          {msg.message}
                        </div>
                      ))}
                    </div>

                    {/* Reply box */}
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
        )}

        {tab === 'bookings' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{['Tool', 'Renter', 'Amount', 'Status', 'Payment', 'Date'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allBookings.map(b => (
                    <tr key={b._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{b.toolId?.name}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{b.renterId?.name}</td>
                      <td className="px-4 py-3 font-semibold text-brand-600 whitespace-nowrap">₦{b.totalAmount?.toLocaleString()}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><span className={`badge text-xs ${b.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' : b.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : b.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-red-50 text-red-700 border-red-100'}`}>{b.status}</span></td>
                      <td className="px-4 py-3 whitespace-nowrap"><span className={`badge text-xs ${b.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>{b.paymentStatus}</span></td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(b.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-slide-up">
            <h3 className="font-display font-bold text-lg text-gray-900 mb-2">
              {modal.type === 'rejectTool' ? 'Reject Tool Listing' : 'Reject KYC Submission'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">Provide a reason so the user knows what to fix:</p>
            <textarea className="input-field resize-none mb-4" rows={4}
              placeholder={modal.type === 'rejectTool' ? 'e.g. No proof of ownership provided, images unclear...' : 'e.g. ID document is blurry, selfie does not match ID...'}
              value={reason} onChange={e => setReason(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleReject} disabled={!reason || processing}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-3 rounded-xl transition-colors disabled:opacity-50">
                {processing ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    {/* Delete User Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-slide-up">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🗑️</span>
            </div>
            <h3 className="font-display font-bold text-lg text-gray-900 mb-2 text-center">Delete Account</h3>
            <p className="text-sm text-gray-500 text-center mb-1">You are about to permanently delete:</p>
            <p className="text-center font-semibold text-gray-800 mb-1">{deleteModal.name}</p>
            <p className="text-center text-sm text-gray-400 mb-4">{deleteModal.email} · {deleteModal.role}</p>
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-5">
              <p className="text-xs text-red-600 text-center">⚠️ This cannot be undone. All their tools, bookings and data will be permanently deleted.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDeleteUser} disabled={processing === deleteModal._id}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-3 rounded-xl transition-colors disabled:opacity-50">
                {processing === deleteModal._id ? 'Deleting...' : '🗑️ Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend User Modal */}
      {suspendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-slide-up">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🚫</span>
            </div>
            <h3 className="font-display font-bold text-lg text-gray-900 mb-1 text-center">Suspend Account</h3>
            <p className="text-center font-semibold text-gray-800 mb-0.5">{suspendModal.name}</p>
            <p className="text-center text-sm text-gray-400 mb-4">{suspendModal.email} · {suspendModal.role}</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason for suspension <span className="text-red-500">*</span></label>
              <textarea rows={3} className="input-field resize-none"
                placeholder="e.g. Tool not returned after multiple reminders, fraudulent activity..."
                value={suspendReason} onChange={e => setSuspendReason(e.target.value)} />
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-5">
              <p className="text-xs text-orange-700">The user will be notified by email and will not be able to log in until reinstated.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setSuspendModal(null); setSuspendReason(''); }} className="btn-secondary flex-1">Cancel</button>
              <button
                disabled={!suspendReason.trim() || processing === suspendModal._id}
                onClick={async () => {
                  setProcessing(suspendModal._id);
                  try {
                    const { data } = await api.put(`/admin/users/${suspendModal._id}/suspend`, { reason: suspendReason });
                    setAllUsers(prev => prev.map(u => u._id === suspendModal._id ? data.user : u));
                    toast.success(`${suspendModal.name} has been suspended`);
                    setSuspendModal(null);
                    setSuspendReason('');
                  } catch (err) { toast.error(err.response?.data?.message || 'Failed to suspend'); }
                  setProcessing(null);
                }}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-3 rounded-xl transition-colors disabled:opacity-50">
                {processing === suspendModal._id ? 'Suspending...' : '🚫 Suspend Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tool Preview Modal */}
      {previewTool && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPreviewTool(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Images */}
            <div className="relative bg-gray-100 rounded-t-2xl overflow-hidden" style={{height: '260px'}}>
              <img
                src={previewTool.images?.length ? getImgUrl(previewTool.images[previewImgIdx]) : PLACEHOLDER}
                className="w-full h-full object-cover"
                onError={e => { e.target.src = PLACEHOLDER; }}
              />
              {previewTool.images?.length > 1 && (
                <>
                  <button onClick={() => setPreviewImgIdx(i => (i - 1 + previewTool.images.length) % previewTool.images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center text-lg">‹</button>
                  <button onClick={() => setPreviewImgIdx(i => (i + 1) % previewTool.images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center text-lg">›</button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {previewTool.images.map((_, i) => (
                      <button key={i} onClick={() => setPreviewImgIdx(i)}
                        className={`w-2 h-2 rounded-full transition-all ${i === previewImgIdx ? 'bg-white' : 'bg-white/50'}`} />
                    ))}
                  </div>
                </>
              )}
              <button onClick={() => setPreviewTool(null)}
                className="absolute top-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center text-lg">✕</button>
              <span className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">Pending Review</span>
            </div>

            {/* Details */}
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display font-bold text-gray-900 text-lg">{previewTool.name}</h2>
                <span className="text-brand-600 font-bold text-lg whitespace-nowrap">₦{previewTool.pricePerDay?.toLocaleString()}/day</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="badge bg-purple-50 text-purple-700 border-purple-100 text-xs">{previewTool.category}</span>
                <span className="badge bg-gray-50 text-gray-600 border-gray-100 text-xs">📍 {previewTool.location}</span>
                <span className="badge bg-blue-50 text-blue-600 border-blue-100 text-xs">{previewTool.condition}</span>
              </div>
              <p className="text-sm text-gray-600">{previewTool.description}</p>

              {/* Owner info */}
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-500 mb-1">Listed by</p>
                <p className="text-sm font-medium text-gray-800">{previewTool.ownerId?.name}</p>
                <p className="text-xs text-gray-400">{previewTool.ownerId?.email}</p>
              </div>

              {/* Ownership docs */}
              {previewTool.ownershipDocs?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">Proof of Ownership ({previewTool.ownershipDocs.length} file{previewTool.ownershipDocs.length > 1 ? 's' : ''})</p>
                  <div className="flex flex-wrap gap-2">
                    {previewTool.ownershipDocs.map((doc, i) => (
                      <a key={i} href={getImgUrl(doc)} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-100">
                        📄 Document {i + 1} ↗
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button onClick={() => { setModal({ type: 'rejectTool', id: previewTool._id }); setPreviewTool(null); setReason(''); }}
                  className="btn-secondary flex-1 py-2.5 text-sm text-red-500 border-red-100 hover:bg-red-50 flex items-center justify-center gap-1">
                  <XCircle size={14} /> Reject
                </button>
                <button onClick={() => { verifyTool(previewTool._id); setPreviewTool(null); }}
                  className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-1">
                  <CheckCircle size={14} /> Approve & Go Live
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}