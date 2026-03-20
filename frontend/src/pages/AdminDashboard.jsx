import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Users, Package, BookOpen, TrendingUp, AlertTriangle,
  Shield, RefreshCw, Activity, DollarSign, CheckCircle,
  ArrowUpRight, BarChart2
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

import ToolsTab    from '../components/admin/ToolsTab';
import KycTab      from '../components/admin/KycTab';
import UsersTab    from '../components/admin/UsersTab';
import BookingsTab from '../components/admin/BookingsTab';
import DisputesTab from '../components/admin/DisputesTab';
import SupportTab  from '../components/admin/SupportTab';
import { RejectModal, DeleteUserModal, SuspendUserModal, ToolPreviewModal } from '../components/admin/AdminModals';

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildBookingTrend(bookings) {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({
      month: d.toLocaleDateString('en-NG', { month: 'short' }),
      key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    });
  }
  return months.map(({ month, key }) => {
    const mb = bookings.filter(b => {
      const bd = new Date(b.createdAt || b.startDate);
      return `${bd.getFullYear()}-${String(bd.getMonth() + 1).padStart(2, '0')}` === key;
    });
    return {
      month,
      bookings: mb.length,
      revenue:  mb.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.totalAmount, 0) / 1000,
      completed: mb.filter(b => b.status === 'completed').length,
    };
  });
}

function buildCategoryData(tools) {
  const cats = {};
  tools.forEach(t => { cats[t.category] = (cats[t.category] || 0) + 1; });
  return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
}

const PIE_COLORS = ['#1a5c3a', '#3d9166', '#6db591', '#a8d4bb', '#d4eadd', '#eef6f1'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2" style={{ color: p.color }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <span className="font-bold ml-0.5">{p.name === 'revenue' ? `₦${p.value}k` : p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────
function AdminStatCard({ label, value, icon, gradient, badge, badgeColor }) {
  return (
    <div className={`relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${gradient}`}>
          {icon}
        </div>
        {badge !== undefined && badge > 0 && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeColor || 'bg-red-50 text-red-600'}`}>
            {badge} pending
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 tracking-tight">{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}

function SectionCard({ title, subtitle, children, action, noPad }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className={noPad ? '' : 'p-5'}>{children}</div>
    </div>
  );
}

// ── Main Admin Dashboard ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [tab, setTab]                   = useState('pending');
  const [stats, setStats]               = useState(null);
  const [pendingTools, setPendingTools] = useState([]);
  const [pendingKyc, setPendingKyc]     = useState([]);
  const [allUsers, setAllUsers]         = useState([]);
  const [allBookings, setAllBookings]   = useState([]);
  const [allTools, setAllTools]         = useState([]);
  const [disputes, setDisputes]         = useState([]);
  const [tickets, setTickets]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [lastRefresh, setLastRefresh]   = useState(new Date());

  const [rejectModal,  setRejectModal]  = useState(null);
  const [deleteModal,  setDeleteModal]  = useState(null);
  const [suspendModal, setSuspendModal] = useState(null);
  const [previewTool,  setPreviewTool]  = useState(null);
  const [processing,   setProcessing]   = useState(null);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [statsRes, pendingRes, kycRes, usersRes, bookingsRes, ticketsRes, toolsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/tools/pending'),
        api.get('/admin/kyc/pending'),
        api.get('/admin/users'),
        api.get('/admin/bookings'),
        api.get('/support/admin/tickets'),
        api.get('/tools?showAll=true&limit=200'),
      ]);
      setStats(statsRes.data.stats);
      setPendingTools(pendingRes.data.tools);
      setPendingKyc(kycRes.data.users);
      setAllUsers(usersRes.data.users);
      const bookings = bookingsRes.data.bookings;
      setAllBookings(bookings);
      setAllTools(toolsRes.data.tools || []);
      setDisputes(bookings.filter(b => b.status === 'disputed'));
      setTickets(ticketsRes.data.tickets || []);
      setLastRefresh(new Date());
    } catch { toast.error('Failed to load admin data.'); }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => fetchAll(true), 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // Refresh tickets every 60s on support tab
  useEffect(() => {
    if (tab !== 'support') return;
    const interval = setInterval(async () => {
      try { const { data } = await api.get('/support/admin/tickets'); setTickets(data.tickets || []); } catch {}
    }, 60000);
    return () => clearInterval(interval);
  }, [tab]);

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
      toast.success(`${deleteModal.name}'s account deleted.`);
      setDeleteModal(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    setProcessing(null);
  };

  const handleSuspendUser = async (reason) => {
    setProcessing(suspendModal._id);
    try {
      const { data } = await api.put(`/admin/users/${suspendModal._id}/suspend`, { reason });
      setAllUsers(prev => prev.map(u => u._id === suspendModal._id ? data.user : u));
      toast.success(`${suspendModal.name} suspended.`);
      setSuspendModal(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    setProcessing(null);
  };

  const handleDisputeResolved = (updated) => {
    setDisputes(prev => prev.filter(d => d._id !== updated._id));
    setAllBookings(prev => prev.map(x => x._id === updated._id ? updated : x));
    toast.success('Dispute resolved');
  };

  if (loading) return (
    <div className="py-8 page-container">
      <div className="animate-pulse space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-2"><div className="h-7 bg-gray-100 rounded-lg w-52" /><div className="h-4 bg-gray-100 rounded-lg w-32" /></div>
          <div className="h-9 bg-gray-100 rounded-xl w-24" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 h-56 bg-gray-100 rounded-2xl" />
          <div className="h-56 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    </div>
  );

  const bookingTrend  = buildBookingTrend(allBookings);
  const categoryData  = buildCategoryData(allTools);
  const openTickets   = tickets.filter(t => t.status !== 'resolved').length;
  const revenueK      = Math.round((stats?.totalRevenue || 0) / 1000);
  const grossK        = Math.round((stats?.grossVolume  || 0) / 1000);

  const statItems = [
    { label: 'Total Users',      value: stats?.totalUsers    || 0, icon: <Users size={16} />,         gradient: 'bg-gradient-to-br from-blue-500 to-cyan-500'   },
    { label: 'Active Tools',     value: stats?.totalTools    || 0, icon: <Package size={16} />,       gradient: 'bg-gradient-to-br from-violet-500 to-purple-600', badge: stats?.pendingTools, badgeColor: 'bg-yellow-50 text-yellow-700' },
    { label: 'Total Bookings',   value: stats?.totalBookings || 0, icon: <BookOpen size={16} />,      gradient: 'bg-gradient-to-br from-[#1a5c3a] to-[#3d9166]' },
    { label: 'Paid Bookings',    value: stats?.paidBookings  || 0, icon: <CheckCircle size={16} />,   gradient: 'bg-gradient-to-br from-teal-500 to-emerald-500' },
    { label: 'Pending KYC',      value: stats?.pendingKyc   || 0, icon: <Shield size={16} />,        gradient: 'bg-gradient-to-br from-amber-400 to-orange-500', badge: stats?.pendingKyc, badgeColor: 'bg-amber-50 text-amber-700' },
    { label: 'Open Disputes',    value: disputes.length,           icon: <AlertTriangle size={16} />, gradient: 'bg-gradient-to-br from-red-400 to-rose-500',    badge: disputes.length, badgeColor: 'bg-red-50 text-red-600' },
    { label: 'Platform Revenue', value: `₦${revenueK}k`,          icon: <DollarSign size={16} />,    gradient: 'bg-gradient-to-br from-[#1a5c3a] to-emerald-600' },
    { label: 'Gross Volume',     value: `₦${grossK}k`,            icon: <TrendingUp size={16} />,    gradient: 'bg-gradient-to-br from-indigo-500 to-blue-600'  },
  ];

  const tabs = [
    { key: 'pending',  label: 'Tools',    count: pendingTools.length,  alert: pendingTools.length > 0 },
    { key: 'kyc',      label: 'KYC',      count: pendingKyc.length,    alert: pendingKyc.length > 0 },
    { key: 'users',    label: 'Users',    count: allUsers.length },
    { key: 'bookings', label: 'Bookings', count: allBookings.length },
    { key: 'disputes', label: 'Disputes', count: disputes.length,       alert: disputes.length > 0 },
    { key: 'support',  label: 'Support',  count: openTickets,           alert: openTickets > 0 },
  ];

  return (
    <div className="py-6 animate-fade-in">
      <div className="page-container max-w-7xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              ToolShare Africa · All systems operational
              <span className="text-gray-300">·</span>
              <button onClick={() => fetchAll(true)} className="inline-flex items-center gap-1 hover:text-gray-600 transition-colors">
                <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
                {lastRefresh.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
              </button>
            </p>
          </div>
          <button onClick={() => fetchAll(true)} disabled={refreshing}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {statItems.map((item) => <AdminStatCard key={item.label} {...item} />)}
        </div>

        {/* ── Charts Row ── */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {/* Booking Trend — spans 2 cols */}
          <SectionCard
            title="Booking & Revenue Trend"
            subtitle="Last 6 months"
            action={<span className="flex items-center gap-1 text-xs text-gray-400"><Activity size={11} /> Auto-refresh</span>}
          >
            <div style={{ marginLeft: '-20px' }}>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={bookingTrend} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminBookGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1a5c3a" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1a5c3a" stopOpacity={0}    />
                    </linearGradient>
                    <linearGradient id="adminRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="bookings" name="bookings" stroke="#1a5c3a" strokeWidth={2} fill="url(#adminBookGrad)" dot={{ r: 3, fill: '#1a5c3a', strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="revenue"  name="revenue"  stroke="#6366f1" strokeWidth={2} fill="url(#adminRevGrad)"  dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          {/* Category Distribution */}
          <SectionCard title="Tools by Category" subtitle="Distribution">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    dataKey="value" paddingAngle={3} animationBegin={0} animationDuration={600}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #f0f0f0' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-44 flex items-center justify-center text-gray-300 text-sm">
                <div className="text-center">
                  <BarChart2 size={32} className="mx-auto mb-2 opacity-30" />
                  No tool data yet
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
          {tabs.map(({ key, label, count, alert }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                tab === key ? 'bg-white shadow-sm text-[#1a5c3a]' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center ${
                alert ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-500'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {tab === 'pending'  && <ToolsTab    pendingTools={pendingTools}  processing={processing} onVerify={verifyTool} onReject={(id, type) => setRejectModal({ id, type })} onPreview={setPreviewTool} />}
          {tab === 'kyc'      && <KycTab      pendingKyc={pendingKyc}      processing={processing} onApprove={approveKyc} onReject={(id, type) => setRejectModal({ id, type })} />}
          {tab === 'users'    && <UsersTab    allUsers={allUsers}           processing={processing} setAllUsers={setAllUsers} onSuspend={setSuspendModal} onDelete={setDeleteModal} />}
          {tab === 'bookings' && <BookingsTab allBookings={allBookings} />}
          {tab === 'disputes' && <DisputesTab disputes={disputes}          onResolved={handleDisputeResolved} />}
          {tab === 'support'  && <SupportTab  tickets={tickets}             setTickets={setTickets} onRefresh={fetchAll} />}
        </div>
      </div>

      {/* ── Modals ── */}
      <RejectModal      modal={rejectModal}   onConfirm={handleRejectConfirm} onClose={() => setRejectModal(null)}  processing={processing} />
      <DeleteUserModal  user={deleteModal}    onConfirm={handleDeleteUser}    onClose={() => setDeleteModal(null)}  processing={processing} />
      <SuspendUserModal user={suspendModal}   onConfirm={handleSuspendUser}   onClose={() => setSuspendModal(null)} processing={processing} />
      <ToolPreviewModal
        tool={previewTool}
        onClose={() => setPreviewTool(null)}
        onApprove={() => { verifyTool(previewTool._id); setPreviewTool(null); }}
        onReject={()  => { setRejectModal({ type: 'rejectTool', id: previewTool._id }); setPreviewTool(null); }}
      />
    </div>
  );
}