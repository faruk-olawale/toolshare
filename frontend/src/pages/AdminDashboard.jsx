import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Users, Package, BookOpen, TrendingUp, Eye, AlertTriangle, Shield, Trash2, Check } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
const PLACEHOLDER = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80';

const ID_FORMATS = {
  nin: { label: 'NIN', digits: '11 digits', example: '12345678901' },
  passport: { label: 'Passport', digits: 'Letter + 8 digits', example: 'A12345678' },
  drivers_license: { label: "Driver's License", digits: 'Letters + digits', example: 'ABC123456789' },
  voters_card: { label: "Voter's Card", digits: 'Letters + digits', example: 'ABC123456' },
};

export default function AdminDashboard() {
  const [tab, setTab] = useState('pending');
  const [stats, setStats] = useState(null);
  const [pendingTools, setPendingTools] = useState([]);
  const [pendingKyc, setPendingKyc] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [checklist, setChecklist] = useState({});
  const [resolveModal, setResolveModal] = useState(null);
  const [resolveForm, setResolveForm] = useState({ resolution: '', action: '' });

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
      const allBookings = bookingsRes.data.bookings;
      setAllBookings(allBookings);
      setDisputes(allBookings.filter(b => b.status === 'disputed'));
    } catch { toast.error('Failed to load admin data.'); }
    setLoading(false);
  };

  const verifyTool = async (id) => {
    setProcessing(id);
    try {
      await api.put(`/admin/tools/${id}/verify`);
      toast.success('Tool approved and live! ✅');
      setPendingTools(prev => prev.filter(t => t._id !== id));
      setStats(prev => ({ ...prev, pendingTools: prev.pendingTools - 1 }));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    setProcessing(null);
  };

  const approveKyc = async (id) => {
    const checks = checklist[id] || {};
    const allChecked = ['nameMatch', 'faceMatch', 'idValid', 'notExpired', 'clearPhoto'].every(k => checks[k]);
    if (!allChecked) return toast.error('Please complete all checklist items before approving.');
    setProcessing(id);
    try {
      await api.put(`/admin/kyc/${id}/approve`);
      toast.success('KYC approved! ✅');
      setPendingKyc(prev => prev.filter(u => u._id !== id));
      setSelectedKyc(null);
      setStats(prev => ({ ...prev, pendingKyc: prev.pendingKyc - 1 }));
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
        setSelectedKyc(null);
        toast.success('KYC rejected.');
      }
      setModal(null); setReason('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    setProcessing(null);
  };

  const handleDeleteUser = async () => {
    setProcessing(deleteModal._id);
    try {
      await api.delete(`/admin/users/${deleteModal._id}`);
      toast.success(`${deleteModal.name}'s account deleted.`);
      setAllUsers(prev => prev.filter(u => u._id !== deleteModal._id));
      setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
      setDeleteModal(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete.'); }
    setProcessing(null);
  };

  const handleResolveDispute = async () => {
    if (!resolveForm.resolution || !resolveForm.action) return toast.error('Please fill all fields.');
    setProcessing(resolveModal._id);
    try {
      await api.put(`/escrow/${resolveModal._id}/resolve`, resolveForm);
      toast.success('Dispute resolved!');
      setDisputes(prev => prev.filter(b => b._id !== resolveModal._id));
      setResolveModal(null);
      setResolveForm({ resolution: '', action: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    setProcessing(null);
  };

  const toggleCheck = (userId, key) => {
    setChecklist(prev => ({
      ...prev,
      [userId]: { ...(prev[userId] || {}), [key]: !prev[userId]?.[key] },
    }));
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
    { key: 'disputes', label: 'Disputes', count: disputes.length, alert: disputes.length > 0 },
    { key: 'users', label: 'Users', count: allUsers.length },
    { key: 'bookings', label: 'Bookings', count: allBookings.length },
  ];

  const KYC_CHECKS = [
    { key: 'nameMatch', label: 'Name on ID matches account name', desc: 'Compare the full name on the ID document with the registered name' },
    { key: 'faceMatch', label: 'Selfie face matches ID photo', desc: 'The person in the selfie is clearly the same person on the ID' },
    { key: 'idValid', label: 'ID number format is correct', desc: `Format should be: ${ID_FORMATS[selectedKyc?.kyc?.idType]?.digits || 'valid format'}` },
    { key: 'notExpired', label: 'ID is not expired', desc: 'Check the expiry date on the document if visible' },
    { key: 'clearPhoto', label: 'Documents are clear and readable', desc: 'All text and photo on the ID is clearly visible, no blur' },
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
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${tool.ownerId?.kyc?.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                      Owner KYC: {tool.ownerId?.kyc?.status || 'not submitted'}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{tool.description}</p>
                {tool.ownershipNote && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-3">
                    <p className="text-xs font-medium text-blue-700 mb-1">Owner's note:</p>
                    <p className="text-sm text-blue-800">{tool.ownershipNote}</p>
                  </div>
                )}
                {tool.ownershipDocs?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">Proof of Ownership:</p>
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

        {/* KYC Tab */}
        {tab === 'kyc' && (
          <div className="space-y-4">
            {pendingKyc.length === 0 ? (
              <div className="text-center py-20"><div className="text-5xl mb-3">✅</div><p className="text-gray-500">No KYC submissions pending</p></div>
            ) : !selectedKyc ? (
              // KYC List
              pendingKyc.map(user => (
                <div key={user._id} className="card p-4 cursor-pointer hover:border-brand-200 transition-colors" onClick={() => setSelectedKyc(user)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-500">{user.email} · {user.phone}</p>
                      <div className="flex gap-2 mt-1">
                        <span className={`badge text-xs ${user.role === 'owner' ? 'bg-brand-50 text-brand-700 border-brand-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>{user.role}</span>
                        <span className="badge text-xs bg-yellow-50 text-yellow-700 border-yellow-100">
                          {user.kyc?.idType?.replace('_', ' ')} · {user.kyc?.idNumber}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-400">{new Date(user.kyc?.submittedAt).toLocaleDateString()}</p>
                      <span className="text-brand-500 text-sm font-medium">Review →</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // KYC Detail Review
              <div>
                <button onClick={() => setSelectedKyc(null)} className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
                  ← Back to list
                </button>

                <div className="card p-5 mb-4">
                  <h2 className="font-display font-bold text-lg text-gray-900 mb-1">Reviewing: {selectedKyc.name}</h2>
                  <p className="text-sm text-gray-500 mb-4">{selectedKyc.email} · {selectedKyc.phone} · <span className="capitalize">{selectedKyc.role}</span></p>

                  {/* Registered details vs ID details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">Registered Account Details</p>
                      <div className="space-y-2">
                        <div><p className="text-xs text-blue-400">Full Name</p><p className="font-semibold text-blue-900">{selectedKyc.name}</p></div>
                        <div><p className="text-xs text-blue-400">Email</p><p className="font-semibold text-blue-900">{selectedKyc.email}</p></div>
                        <div><p className="text-xs text-blue-400">Phone</p><p className="font-semibold text-blue-900">{selectedKyc.phone || 'Not provided'}</p></div>
                        <div><p className="text-xs text-blue-400">Role</p><p className="font-semibold text-blue-900 capitalize">{selectedKyc.role}</p></div>
                      </div>
                    </div>
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                      <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-3">Submitted ID Details</p>
                      <div className="space-y-2">
                        <div><p className="text-xs text-orange-400">ID Type</p><p className="font-semibold text-orange-900 capitalize">{selectedKyc.kyc?.idType?.replace('_', ' ')}</p></div>
                        <div><p className="text-xs text-orange-400">ID Number</p><p className="font-semibold text-orange-900 font-mono">{selectedKyc.kyc?.idNumber}</p></div>
                        <div><p className="text-xs text-orange-400">Expected Format</p><p className="font-semibold text-orange-900">{ID_FORMATS[selectedKyc.kyc?.idType]?.digits}</p></div>
                        <div><p className="text-xs text-orange-400">Submitted</p><p className="font-semibold text-orange-900">{new Date(selectedKyc.kyc?.submittedAt).toLocaleDateString()}</p></div>
                      </div>
                    </div>
                  </div>

                  {/* Document images side by side */}
                  <p className="text-sm font-semibold text-gray-700 mb-3">📸 Document Photos — click to view full size</p>
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5 font-medium">ID Document</p>
                      <a href={`${BASE_URL}${selectedKyc.kyc?.idDocument}`} target="_blank" rel="noreferrer">
                        <img src={`${BASE_URL}${selectedKyc.kyc?.idDocument}`}
                          className="w-full h-40 object-cover rounded-xl border-2 border-gray-200 hover:border-brand-300 hover:opacity-90 transition" />
                      </a>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5 font-medium">Selfie with ID</p>
                      <a href={`${BASE_URL}${selectedKyc.kyc?.selfie}`} target="_blank" rel="noreferrer">
                        <img src={`${BASE_URL}${selectedKyc.kyc?.selfie}`}
                          className="w-full h-40 object-cover rounded-xl border-2 border-gray-200 hover:border-brand-300 hover:opacity-90 transition" />
                      </a>
                    </div>
                  </div>

                  {/* Verification Checklist */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5">
                    <p className="text-sm font-semibold text-gray-800 mb-3">✅ Verification Checklist — tick all before approving</p>
                    <div className="space-y-3">
                      {KYC_CHECKS.map(({ key, label, desc }) => (
                        <label key={key} className="flex items-start gap-3 cursor-pointer group">
                          <div onClick={() => toggleCheck(selectedKyc._id, key)}
                            className={`w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors cursor-pointer ${checklist[selectedKyc._id]?.[key] ? 'bg-green-500 border-green-500' : 'border-gray-300 group-hover:border-green-400'}`}>
                            {checklist[selectedKyc._id]?.[key] && <Check size={12} className="text-white" />}
                          </div>
                          <div onClick={() => toggleCheck(selectedKyc._id, key)}>
                            <p className={`text-sm font-medium ${checklist[selectedKyc._id]?.[key] ? 'text-green-700 line-through' : 'text-gray-700'}`}>{label}</p>
                            <p className="text-xs text-gray-400">{desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>

                    {/* Progress */}
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                        <span>Verification progress</span>
                        <span>{Object.values(checklist[selectedKyc._id] || {}).filter(Boolean).length} / {KYC_CHECKS.length} checks</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: `${(Object.values(checklist[selectedKyc._id] || {}).filter(Boolean).length / KYC_CHECKS.length) * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => { setModal({ type: 'rejectKyc', id: selectedKyc._id }); setReason(''); }}
                      disabled={processing === selectedKyc._id}
                      className="btn-secondary py-3 px-4 text-sm text-red-500 border-red-100 hover:bg-red-50 flex items-center justify-center gap-2">
                      <XCircle size={15} /> Reject KYC
                    </button>
                    <button
                      onClick={() => approveKyc(selectedKyc._id)}
                      disabled={processing === selectedKyc._id || !['nameMatch', 'faceMatch', 'idValid', 'notExpired', 'clearPhoto'].every(k => checklist[selectedKyc._id]?.[k])}
                      className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-40">
                      <CheckCircle size={15} />
                      {processing === selectedKyc._id ? 'Approving...' : ['nameMatch', 'faceMatch', 'idValid', 'notExpired', 'clearPhoto'].every(k => checklist[selectedKyc._id]?.[k]) ? 'Approve Identity ✅' : 'Complete checklist to approve'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Disputes */}
        {tab === 'disputes' && (
          <div className="space-y-4">
            {disputes.length === 0 ? (
              <div className="text-center py-20"><div className="text-5xl mb-3">✅</div><p className="text-gray-500">No active disputes</p></div>
            ) : disputes.map(b => (
              <div key={b._id} className="card p-4 border-red-100">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge text-xs bg-red-50 text-red-700 border-red-100">🚨 Dispute</span>
                      <span className="text-sm font-bold text-gray-900">{b.toolId?.name}</span>
                    </div>
                    <p className="text-xs text-gray-500">Raised by: <strong>{b.dispute?.raisedByRole}</strong> · {new Date(b.dispute?.raisedAt).toLocaleDateString()}</p>
                  </div>
                  <p className="text-brand-600 font-bold flex-shrink-0">₦{b.totalAmount?.toLocaleString()}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-blue-50 rounded-xl p-3">
                    <p className="text-xs text-blue-400 mb-0.5">Renter</p>
                    <p className="text-sm font-semibold text-blue-900">{b.renterId?.name}</p>
                    <p className="text-xs text-blue-600">{b.renterId?.email}</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-3">
                    <p className="text-xs text-orange-400 mb-0.5">Owner</p>
                    <p className="text-sm font-semibold text-orange-900">{b.ownerId?.name}</p>
                    <p className="text-xs text-orange-600">{b.ownerId?.email}</p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-3">
                  <p className="text-xs font-medium text-red-600 mb-1">Issue reported:</p>
                  <p className="text-sm text-red-800">{b.dispute?.reason}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 mb-3 text-xs text-gray-500">
                  <p>Payment status: <strong>{b.paymentStatus?.replace('_', ' ')}</strong></p>
                  <p>Escrow: Receipt confirmed: <strong>{b.escrow?.renterConfirmedReceipt ? 'Yes' : 'No'}</strong> · Return confirmed: <strong>{b.escrow?.ownerConfirmedReturn ? 'Yes' : 'No'}</strong></p>
                </div>

                <button onClick={() => setResolveModal(b)}
                  className="btn-primary w-full py-2.5 text-sm">
                  Resolve Dispute →
                </button>
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
                  <tr>{['Name', 'Email', 'Role', 'KYC', 'Joined', 'Action'].map(h => (
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
                      <td className="px-4 py-3">
                        {u.role !== 'admin' && (
                          <button onClick={() => setDeleteModal(u)} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors">
                            <Trash2 size={13} /> Delete
                          </button>
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
                      <td className="px-4 py-3 whitespace-nowrap"><span className={`badge text-xs ${b.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' : b.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : b.status === 'disputed' ? 'bg-red-50 text-red-700 border-red-100' : b.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-red-50 text-red-700 border-red-100'}`}>{b.status}</span></td>
                      <td className="px-4 py-3 whitespace-nowrap"><span className={`badge text-xs ${b.paymentStatus === 'fully_released' ? 'bg-green-50 text-green-700 border-green-100' : b.paymentStatus === 'partially_released' ? 'bg-blue-50 text-blue-700 border-blue-100' : b.paymentStatus === 'paid' ? 'bg-brand-50 text-brand-700 border-brand-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>{b.paymentStatus?.replace('_', ' ')}</span></td>
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
              placeholder={modal.type === 'rejectTool' ? 'e.g. No proof of ownership, images unclear...' : 'e.g. ID document is blurry, name does not match account name...'}
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
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="font-display font-bold text-lg text-gray-900 mb-2 text-center">Delete Account</h3>
            <p className="text-sm text-gray-500 text-center mb-1">You are about to permanently delete:</p>
            <p className="text-center font-semibold text-gray-800 mb-1">{deleteModal.name}</p>
            <p className="text-center text-sm text-gray-400 mb-5">{deleteModal.email} · {deleteModal.role}</p>
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-5">
              <p className="text-xs text-red-600 text-center">⚠️ This cannot be undone. All their data will be permanently deleted.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDeleteUser} disabled={processing === deleteModal._id}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                <Trash2 size={15} /> {processing === deleteModal._id ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Dispute Modal */}
      {resolveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-slide-up">
            <h3 className="font-display font-bold text-lg text-gray-900 mb-1">Resolve Dispute</h3>
            <p className="text-sm text-gray-500 mb-4">{resolveModal.toolId?.name} · ₦{resolveModal.totalAmount?.toLocaleString()}</p>

            <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
              <p className="text-xs font-medium text-red-600 mb-1">Issue reported:</p>
              <p className="text-sm text-red-800">{resolveModal.dispute?.reason}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Decision</label>
              <div className="space-y-2">
                {[
                  { value: 'release_owner', label: '✅ Release funds to Owner', desc: 'Owner wins — renter was at fault' },
                  { value: 'refund_renter', label: '↩️ Refund the Renter', desc: 'Renter wins — owner was at fault' },
                ].map(({ value, label, desc }) => (
                  <label key={value} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${resolveForm.action === value ? 'border-brand-300 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="action" value={value} className="mt-0.5"
                      checked={resolveForm.action === value} onChange={e => setResolveForm({ ...resolveForm, action: e.target.value })} />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{label}</p>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Resolution Note</label>
              <textarea className="input-field resize-none" rows={3}
                placeholder="Explain your decision to both parties..."
                value={resolveForm.resolution} onChange={e => setResolveForm({ ...resolveForm, resolution: e.target.value })} />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setResolveModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleResolveDispute} disabled={!resolveForm.action || !resolveForm.resolution || processing === resolveModal._id}
                className="btn-primary flex-1 disabled:opacity-50">
                {processing === resolveModal._id ? 'Resolving...' : 'Resolve Dispute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}