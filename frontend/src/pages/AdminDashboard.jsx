import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Users, Package, BookOpen, TrendingUp, Eye, AlertTriangle } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
const PLACEHOLDER = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80';

export default function AdminDashboard() {
  const [tab, setTab] = useState('pending');
  const [stats, setStats] = useState(null);
  const [pendingTools, setPendingTools] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes, usersRes, bookingsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/tools/pending'),
        api.get('/admin/users'),
        api.get('/admin/bookings'),
      ]);
      setStats(statsRes.data.stats);
      setPendingTools(pendingRes.data.tools);
      setAllUsers(usersRes.data.users);
      setAllBookings(bookingsRes.data.bookings);
    } catch { toast.error('Failed to load admin data.'); }
    setLoading(false);
  };

  const verify = async (id) => {
    setProcessing(id);
    try {
      await api.put(`/admin/tools/${id}/verify`);
      toast.success('Tool verified and live! ✅');
      setPendingTools(prev => prev.filter(t => t._id !== id));
      setStats(prev => ({ ...prev, pendingTools: prev.pendingTools - 1, totalTools: prev.totalTools }));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to verify.'); }
    setProcessing(null);
  };

  const reject = async () => {
    setProcessing(rejectModal);
    try {
      await api.put(`/admin/tools/${rejectModal}/reject`, { reason: rejectReason });
      toast.success('Tool rejected.');
      setPendingTools(prev => prev.filter(t => t._id !== rejectModal));
      setRejectModal(null);
      setRejectReason('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to reject.'); }
    setProcessing(null);
  };

  if (loading) return (
    <div className="py-8 page-container">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-100 rounded w-48" />
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}</div>
      </div>
    </div>
  );

  const tabs = [
    { key: 'pending', label: 'Pending Tools', count: pendingTools.length },
    { key: 'users', label: 'Users', count: allUsers.length },
    { key: 'bookings', label: 'Bookings', count: allBookings.length },
  ];

  return (
    <div className="py-8 animate-fade-in">
      <div className="page-container">
        <div className="mb-8">
          <h1 className="section-title mb-1">Admin Dashboard</h1>
          <p className="text-gray-500">Manage ToolShare Africa platform</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Total Users', value: stats.totalUsers, icon: <Users size={18} />, color: 'bg-blue-50 text-blue-600' },
              { label: 'Total Tools', value: stats.totalTools, icon: <Package size={18} />, color: 'bg-purple-50 text-purple-600' },
              { label: 'Bookings', value: stats.totalBookings, icon: <BookOpen size={18} />, color: 'bg-green-50 text-green-600' },
              { label: 'Pending Review', value: stats.pendingTools, icon: <AlertTriangle size={18} />, color: 'bg-yellow-50 text-yellow-600' },
              { label: 'Revenue', value: `₦${(stats.totalRevenue || 0).toLocaleString()}`, icon: <TrendingUp size={18} />, color: 'bg-brand-50 text-brand-600' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="card p-4">
                <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center mb-3`}>{icon}</div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {tabs.map(({ key, label, count }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${tab === key ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}>
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${key === 'pending' && count > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'}`}>{count}</span>
            </button>
          ))}
        </div>

        {/* Pending Tools */}
        {tab === 'pending' && (
          <div>
            {pendingTools.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-3">✅</div>
                <p className="text-gray-500">No tools pending review</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingTools.map(tool => (
                  <div key={tool._id} className="card p-5">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-earth-100">
                        <img src={tool.images?.[0] ? `${BASE_URL}${tool.images[0]}` : PLACEHOLDER}
                          className="w-full h-full object-cover"
                          onError={e => { e.target.src = PLACEHOLDER; }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-display font-bold text-lg text-gray-900">{tool.name}</h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className="badge bg-purple-50 text-purple-700 border border-purple-100">{tool.category}</span>
                              <span className="badge bg-gray-50 text-gray-600 border border-gray-100">{tool.location}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-brand-600 font-bold text-lg">₦{tool.pricePerDay?.toLocaleString()}/day</div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{tool.description}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="text-xs text-gray-400">
                            Owner: <span className="text-gray-700 font-medium">{tool.ownerId?.name}</span> · {tool.ownerId?.email}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <a href={`/tools/${tool._id}`} target="_blank" className="btn-secondary py-2 px-3 text-sm flex items-center gap-1">
                            <Eye size={13} /> Preview
                          </a>
                          <button onClick={() => { setRejectModal(tool._id); setRejectReason(''); }}
                            disabled={processing === tool._id}
                            className="btn-secondary py-2 px-4 text-sm text-red-500 border-red-100 hover:bg-red-50 flex items-center gap-1">
                            <XCircle size={14} /> Reject
                          </button>
                          <button onClick={() => verify(tool._id)} disabled={processing === tool._id}
                            className="btn-primary py-2 px-4 text-sm flex items-center gap-1">
                            <CheckCircle size={14} />
                            {processing === tool._id ? 'Processing...' : 'Approve & Go Live'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{['Name', 'Email', 'Role', 'Location', 'Joined'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allUsers.map(user => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{user.name}</td>
                      <td className="px-4 py-3 text-gray-500">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${user.role === 'owner' ? 'bg-brand-50 text-brand-700 border-brand-100' : user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{user.location || '—'}</td>
                      <td className="px-4 py-3 text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bookings */}
        {tab === 'bookings' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{['Tool', 'Renter', 'Owner', 'Amount', 'Status', 'Payment', 'Date'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allBookings.map(b => (
                    <tr key={b._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{b.toolId?.name}</td>
                      <td className="px-4 py-3 text-gray-500">{b.renterId?.name}</td>
                      <td className="px-4 py-3 text-gray-500">{b.ownerId?.name}</td>
                      <td className="px-4 py-3 font-semibold text-brand-600">₦{b.totalAmount?.toLocaleString()}</td>
                      <td className="px-4 py-3"><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                      <td className="px-4 py-3"><span className={b.paymentStatus === 'paid' ? 'badge-paid' : 'badge-unpaid'}>{b.paymentStatus}</span></td>
                      <td className="px-4 py-3 text-gray-400">{new Date(b.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-slide-up">
            <h3 className="font-display font-bold text-lg text-gray-900 mb-4">Reject Tool Listing</h3>
            <p className="text-sm text-gray-500 mb-4">Provide a reason so the owner knows what to fix:</p>
            <textarea
              className="input-field resize-none mb-4"
              rows={4}
              placeholder="e.g. Images are unclear, description is too short, price seems unreasonable..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={reject} disabled={!rejectReason || processing}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-3 rounded-xl transition-colors disabled:opacity-50">
                {processing ? 'Rejecting...' : 'Reject Listing'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}