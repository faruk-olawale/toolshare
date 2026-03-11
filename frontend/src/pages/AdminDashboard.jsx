import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Users, Package, BookOpen, TrendingUp, AlertTriangle, Shield } from 'lucide-react';

import ToolsTab     from '../components/admin/ToolsTab';
import KycTab       from '../components/admin/KycTab';
import UsersTab     from '../components/admin/UsersTab';
import BookingsTab  from '../components/admin/BookingsTab';
import DisputesTab  from '../components/admin/DisputesTab';
import SupportTab   from '../components/admin/SupportTab';
import { RejectModal, DeleteUserModal, SuspendUserModal, ToolPreviewModal } from '../components/admin/AdminModals';

export default function AdminDashboard() {
  const [tab, setTab]               = useState('pending');
  const [stats, setStats]           = useState(null);
  const [pendingTools, setPendingTools] = useState([]);
  const [pendingKyc, setPendingKyc] = useState([]);
  const [allUsers, setAllUsers]     = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [disputes, setDisputes]     = useState([]);
  const [tickets, setTickets]       = useState([]);
  const [loading, setLoading]       = useState(true);

  // Modal state
  const [rejectModal, setRejectModal]   = useState(null); // { type, id }
  const [deleteModal, setDeleteModal]   = useState(null); // user object
  const [suspendModal, setSuspendModal] = useState(null); // user object
  const [previewTool, setPreviewTool]   = useState(null); // tool object

  const [processing, setProcessing] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  // Auto-refresh tickets every 60s when on support tab
  useEffect(() => {
    if (tab !== 'support') return;
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get('/support/admin/tickets');
        setTickets(data.tickets || []);
      } catch {}
    }, 60000);
    return () => clearInterval(interval);
  }, [tab]);

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

  // ── Actions ──────────────────────────────────────────────────────────────────
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

  const handleRejectConfirm = async (reason) => {
    setProcessing(rejectModal.id);
    try {
      if (rejectModal.type === 'rejectTool') {
        await api.put(`/admin/tools/${rejectModal.id}/reject`, { reason });
        setPendingTools(prev => prev.filter(t => t._id !== rejectModal.id));
        toast.success('Tool rejected.');
      } else {
        await api.put(`/admin/kyc/${rejectModal.id}/reject`, { reason });
        setPendingKyc(prev => prev.filter(u => u._id !== rejectModal.id));
        toast.success('KYC rejected.');
      }
      setRejectModal(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    setProcessing(null);
  };

  const handleDeleteUser = async () => {
    setProcessing(deleteModal._id);
    try {
      await api.delete(`/admin/users/${deleteModal._id}`);
      setAllUsers(prev => prev.filter(u => u._id !== deleteModal._id));
      setPendingKyc(prev => prev.filter(u => u._id !== deleteModal._id));
      toast.success(`${deleteModal.name}'s account has been deleted.`);
      setDeleteModal(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete user.'); }
    setProcessing(null);
  };

  const handleSuspendUser = async (reason) => {
    setProcessing(suspendModal._id);
    try {
      const { data } = await api.put(`/admin/users/${suspendModal._id}/suspend`, { reason });
      setAllUsers(prev => prev.map(u => u._id === suspendModal._id ? data.user : u));
      toast.success(`${suspendModal.name} has been suspended`);
      setSuspendModal(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to suspend'); }
    setProcessing(null);
  };

  const handleDisputeResolved = (updated) => {
    setDisputes(prev => prev.filter(d => d._id !== updated._id));
    setAllBookings(prev => prev.map(x => x._id === updated._id ? updated : x));
    toast.success('Dispute resolved');
  };

  if (loading) return (
    <div className="py-8 page-container"><div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-100 rounded w-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}
      </div>
    </div></div>
  );

  const tabs = [
    { key: 'pending',   label: 'Tools',    count: pendingTools.length,                                    alert: pendingTools.length > 0 },
    { key: 'kyc',       label: 'KYC',      count: pendingKyc.length,                                      alert: pendingKyc.length > 0 },
    { key: 'users',     label: 'Users',    count: allUsers.length },
    { key: 'bookings',  label: 'Bookings', count: allBookings.length },
    { key: 'disputes',  label: 'Disputes', count: disputes.length,                                        alert: disputes.length > 0 },
    { key: 'support',   label: 'Support',  count: tickets.filter(t => t.status !== 'resolved').length,    alert: tickets.some(t => t.status === 'open') },
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
              { label: 'Users',           value: stats.totalUsers,                                          icon: <Users size={15} />,        color: 'bg-blue-50 text-blue-600' },
              { label: 'Tools',           value: stats.totalTools,                                          icon: <Package size={15} />,      color: 'bg-purple-50 text-purple-600' },
              { label: 'Bookings',        value: stats.totalBookings,                                       icon: <BookOpen size={15} />,     color: 'bg-green-50 text-green-600' },
              { label: 'Pending Tools',   value: stats.pendingTools,                                        icon: <AlertTriangle size={15} />, color: 'bg-yellow-50 text-yellow-600' },
              { label: 'Pending KYC',     value: stats.pendingKyc,                                          icon: <Shield size={15} />,       color: 'bg-orange-50 text-orange-600' },
              { label: 'Platform Revenue',value: `₦${Math.round(stats.totalRevenue || 0).toLocaleString()}`, icon: <TrendingUp size={15} />,   color: 'bg-brand-50 text-brand-600' },
              { label: 'Gross Volume',    value: `₦${Math.round(stats.grossVolume  || 0).toLocaleString()}`, icon: <TrendingUp size={15} />,   color: 'bg-green-50 text-green-700' },
              { label: 'Paid Bookings',   value: stats.paidBookings || 0,                                   icon: <BookOpen size={15} />,     color: 'bg-teal-50 text-teal-600' },
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

        {/* Tab content */}
        {tab === 'pending'  && <ToolsTab    pendingTools={pendingTools} processing={processing} onVerify={verifyTool} onReject={(id, type) => setRejectModal({ id, type })} onPreview={setPreviewTool} />}
        {tab === 'kyc'      && <KycTab      pendingKyc={pendingKyc} processing={processing} onApprove={approveKyc} onReject={(id, type) => setRejectModal({ id, type })} />}
        {tab === 'users'    && <UsersTab    allUsers={allUsers} processing={processing} setAllUsers={setAllUsers} onSuspend={setSuspendModal} onDelete={setDeleteModal} />}
        {tab === 'bookings' && <BookingsTab allBookings={allBookings} />}
        {tab === 'disputes' && <DisputesTab disputes={disputes} onResolved={handleDisputeResolved} />}
        {tab === 'support'  && <SupportTab  tickets={tickets} setTickets={setTickets} onRefresh={fetchAll} />}
      </div>

      {/* Modals */}
      <RejectModal     modal={rejectModal}  onConfirm={handleRejectConfirm} onClose={() => setRejectModal(null)}  processing={processing} />
      <DeleteUserModal user={deleteModal}   onConfirm={handleDeleteUser}    onClose={() => setDeleteModal(null)}  processing={processing} />
      <SuspendUserModal user={suspendModal} onConfirm={handleSuspendUser}   onClose={() => setSuspendModal(null)} processing={processing} />
      <ToolPreviewModal
        tool={previewTool}
        onClose={() => setPreviewTool(null)}
        onApprove={() => { verifyTool(previewTool._id); setPreviewTool(null); }}
        onReject={() => { setRejectModal({ type: 'rejectTool', id: previewTool._id }); setPreviewTool(null); }}
      />
    </div>
  );
}