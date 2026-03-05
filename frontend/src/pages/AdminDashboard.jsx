import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Users, Package, BookOpen, TrendingUp, Eye, AlertTriangle, Shield } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
const PLACEHOLDER = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80';

export default function AdminDashboard() {
  const [tab, setTab] = useState('pending');
  const [stats, setStats] = useState(null);
  const [pendingTools, setPendingTools] = useState([]);
  const [pendingKyc, setPendingKyc] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type: 'rejectTool'|'rejectKyc', id }
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes, kycRes, usersRes, bookingsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/tools/pending'),
        api.get('/admin/kyc/pending'),
        api.get('/admin/users'),
        api.get('/admin/bookings'),
      ]);
      setStats(statsRes.data.stats);
      setPendingTools(pendingRes.data.tools);
      setPendingKyc(kycRes.data.users);
      setAllUsers(usersRes.data.users);
      setAllBookings(bookingsRes.data.bookings);
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

  if (loading) return (
    <div className="py-8 page-container"><div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-100 rounded w-48" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}</div>
    </div></div>
  );

  const tabs = [
    { key: 'pending', label: 'Tools', count: pendingTools.length, alert: pendingTools.length > 0 },
    { key: 'kyc', label: 'KYC', count: pendingKyc.length, alert: pendingKyc.length > 0 },
    { key: 'users', label: 'Users', count: allUsers.length },
    { key: 'bookings', label: 'Bookings', count: allBookings.length },
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
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
            {[
              { label: 'Users', value: stats.totalUsers, icon: <Users size={15} />, color: 'bg-blue-50 text-blue-600' },
              { label: 'Tools', value: stats.totalTools, icon: <Package size={15} />, color: 'bg-purple-50 text-purple-600' },
              { label: 'Bookings', value: stats.totalBookings, icon: <BookOpen size={15} />, color: 'bg-green-50 text-green-600' },
              { label: 'Pending Tools', value: stats.pendingTools, icon: <AlertTriangle size={15} />, color: 'bg-yellow-50 text-yellow-600' },
              { label: 'Pending KYC', value: stats.pendingKyc, icon: <Shield size={15} />, color: 'bg-orange-50 text-orange-600' },
              { label: 'Revenue', value: `₦${(stats.totalRevenue || 0).toLocaleString()}`, icon: <TrendingUp size={15} />, color: 'bg-brand-50 text-brand-600' },
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
                    <img src={tool.images?.[0] ? `${BASE_URL}${tool.images[0]}` : PLACEHOLDER} className="w-full h-full object-cover" onError={e => { e.target.src = PLACEHOLDER; }} />
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
                        <a key={i} href={`${BASE_URL}${doc}`} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100">
                          📄 Document {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-2">
                  <a href={`/tools/${tool._id}`} target="_blank" className="btn-secondary py-2 px-3 text-sm flex items-center justify-center gap-1">
                    <Eye size={13} /> Preview
                  </a>
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
                      <a href={`${BASE_URL}${user.kyc.idDocument}`} target="_blank" rel="noreferrer">
                        <img src={`${BASE_URL}${user.kyc.idDocument}`} className="w-full h-32 object-cover rounded-xl border border-gray-200 hover:opacity-90 transition" />
                      </a>
                    </div>
                  )}
                  {user.kyc?.selfie && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1 font-medium">Selfie with ID</p>
                      <a href={`${BASE_URL}${user.kyc.selfie}`} target="_blank" rel="noreferrer">
                        <img src={`${BASE_URL}${user.kyc.selfie}`} className="w-full h-32 object-cover rounded-xl border border-gray-200 hover:opacity-90 transition" />
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
                  <tr>{['Name', 'Email', 'Role', 'KYC', 'Joined'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allUsers.map(u => (
                    <tr key={u._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{u.name}</td>
                      <td className="px-4 py-3 text-gray-500">{u.email}</td>
                      <td className="px-4 py-3"><span className={`badge text-xs ${u.role === 'owner' ? 'bg-brand-50 text-brand-700 border-brand-100' : u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>{u.role}</span></td>
                      <td className="px-4 py-3"><span className={`badge text-xs ${u.kyc?.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' : u.kyc?.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : u.kyc?.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>{u.kyc?.status || 'not submitted'}</span></td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</td>
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
    </div>
  );
}