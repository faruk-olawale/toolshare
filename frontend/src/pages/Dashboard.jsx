import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import KYCBanner from '../components/kyc/KYCBanner';
import {
  PlusCircle, Package, BookOpen, TrendingUp, Clock,
  CheckCircle, ArrowRight, ArrowUpRight, ArrowDownRight,
  RefreshCw, Activity, Zap
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (d) => new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });

const STATUS_CONFIG = {
  pending:   { dot: 'bg-amber-400',  text: 'text-amber-700',  bg: 'bg-amber-50  border-amber-100'  },
  approved:  { dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50  border-green-100'  },
  completed: { dot: 'bg-blue-500',   text: 'text-blue-700',   bg: 'bg-blue-50   border-blue-100'   },
  rejected:  { dot: 'bg-red-400',    text: 'text-red-600',    bg: 'bg-red-50    border-red-100'     },
  cancelled: { dot: 'bg-gray-400',   text: 'text-gray-500',   bg: 'bg-gray-50   border-gray-100'   },
  disputed:  { dot: 'bg-amber-500',  text: 'text-amber-700',  bg: 'bg-amber-50  border-amber-100'  },
};

function buildChartData(bookings) {
  const months = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({
      month: d.toLocaleDateString('en-NG', { month: 'short' }),
      key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    });
  }
  return months.map(({ month, key }) => {
    const mb = bookings.filter(b => {
      const bd = new Date(b.createdAt || b.startDate || b.date);
      return `${bd.getFullYear()}-${String(bd.getMonth() + 1).padStart(2, '0')}` === key;
    });
    return {
      month,
      bookings: mb.length,
      revenue:  mb.filter(b => b.paymentStatus === 'paid' || b.totalAmount)
                  .reduce((s, b) => s + (b.totalAmount || 0), 0) / 1000,
    };
  });
}

// ── Reusable UI components ────────────────────────────────────────────────────

function StatCard({ label, value, icon, iconBg, iconColor, trend, trendLabel, link, loading }) {
  if (loading) return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="w-10 h-10 bg-gray-100 rounded-xl mb-4" />
      <div className="h-7 bg-gray-100 rounded-lg w-20 mb-1" />
      <div className="h-4 bg-gray-100 rounded-lg w-28" />
    </div>
  );
  return (
    <Link to={link} className="group relative bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden block">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
          }`}>
            {trend >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 tracking-tight tabular-nums">{value}</div>
      <div className="text-[13px] text-gray-500 mt-0.5">{label}</div>
      {trendLabel && <div className="text-[11px] text-gray-400 mt-1">{trendLabel}</div>}
    </Link>
  );
}

function ChartCard({ title, subtitle, children, action }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-[13px] font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.cancelled;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {status}
    </span>
  );
}

function SectionCard({ title, children, action, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <h3 className="text-[13px] font-semibold text-gray-900">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ background: p.color }} />
          {p.name}: <span className="font-bold ml-1">{p.name === 'revenue' ? `₦${p.value}k` : p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ── Skeleton rows ─────────────────────────────────────────────────────────────
function SkeletonRows({ count = 4 }) {
  return (
    <div className="space-y-2">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2.5 animate-pulse">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-gray-100 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
          <div className="h-6 w-16 bg-gray-100 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, can, upgradeListing } = useAuth();
  const [stats,       setStats]       = useState(null);
  const [kycStatus,   setKycStatus]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [chartData,   setChartData]   = useState([]);
  const hasFetched = useRef(false); // ✅ prevent StrictMode double-fetch

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    const controller = new AbortController();
    try {
      const kycRes = await api.get('/kyc/status', { signal: controller.signal });
      setKycStatus(kycRes.data.kyc);

      if (user.role === 'owner') {
        const [toolsRes, bookingsRes] = await Promise.all([
          api.get('/tools/my-tools',        { signal: controller.signal }),
          api.get('/bookings/owner-bookings', { signal: controller.signal }),
        ]);
        const bookings = bookingsRes.data.bookings;
        const tools    = toolsRes.data.tools || [];

        const toolEvents    = tools.filter(t => t.adminVerified || t.adminNote).map(t => ({
          _id: `tool-${t._id}`, type: 'tool', toolName: t.name,
          status: t.adminVerified ? 'approved' : 'rejected',
          adminNote: t.adminNote, date: t.updatedAt,
        }));
        const bookingEvents = bookings.map(b => ({
          _id: b._id, type: 'booking', toolName: b.toolId?.name || 'Tool',
          status: b.status, totalAmount: b.totalAmount,
          startDate: b.startDate, date: b.updatedAt,
          paymentStatus: b.paymentStatus, createdAt: b.createdAt,
        }));
        const allActivity = [...toolEvents, ...bookingEvents]
          .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

        setStats({
          totalTools:    toolsRes.data.count,
          pendingTools:  tools.filter(t => !t.adminVerified && !t.adminNote).length,
          approvedTools: tools.filter(t => t.adminVerified).length,
          totalBookings: bookings.length,
          pending:       bookings.filter(b => b.status === 'pending').length,
          approved:      bookings.filter(b => b.status === 'approved').length,
          completed:     bookings.filter(b => b.status === 'completed').length,
          earnings:      bookings.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.totalAmount, 0),
          recentBookings: bookings.slice(0, 5),
          recentActivity: allActivity,
        });
        setChartData(buildChartData(bookingEvents));
      } else {
        const { data } = await api.get('/bookings/my-bookings', { signal: controller.signal });
        const bookings = data.bookings;
        setStats({
          totalBookings: bookings.length,
          pending:       bookings.filter(b => b.status === 'pending').length,
          approved:      bookings.filter(b => b.status === 'approved').length,
          completed:     bookings.filter(b => b.status === 'completed').length,
          spent:         bookings.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.totalAmount, 0),
          recentBookings: bookings.slice(0, 5),
        });
        setChartData(buildChartData(bookings));
      }
      setLastRefresh(new Date());
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchAll();
  }, [fetchAll]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => fetchAll(true), 60000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const isOwner     = can.list;  // canList capability
  const kycApproved = kycStatus?.status === 'approved';
  const hour        = new Date().getHours();
  const greeting    = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const statCards = isOwner ? [
    { label: 'My Tools',         value: loading ? '—' : stats?.totalTools || 0,                        icon: <Package size={17} />,    iconBg: 'bg-[#eef6f1]', iconColor: 'text-[#1a5c3a]', link: '/my-tools' },
    { label: 'Total Bookings',   value: loading ? '—' : stats?.totalBookings || 0,                      icon: <BookOpen size={17} />,   iconBg: 'bg-[#eef6f1]', iconColor: 'text-[#1a5c3a]', link: '/booking-requests' },
    { label: 'Pending',          value: loading ? '—' : stats?.pending || 0,                            icon: <Clock size={17} />,      iconBg: 'bg-amber-50',   iconColor: 'text-amber-600',  link: '/booking-requests' },
    { label: 'Total Earnings',   value: loading ? '—' : `₦${(stats?.earnings || 0).toLocaleString()}`, icon: <TrendingUp size={17} />, iconBg: 'bg-[#d4eadd]', iconColor: 'text-[#154d30]', link: '/booking-requests' },
  ] : [
    { label: 'My Bookings',  value: loading ? '—' : stats?.totalBookings || 0,                        icon: <BookOpen size={17} />,   iconBg: 'bg-[#eef6f1]', iconColor: 'text-[#1a5c3a]', link: '/bookings' },
    { label: 'Pending',      value: loading ? '—' : stats?.pending || 0,                               icon: <Clock size={17} />,      iconBg: 'bg-amber-50',   iconColor: 'text-amber-600',  link: '/bookings' },
    { label: 'Active',       value: loading ? '—' : stats?.approved || 0,                              icon: <CheckCircle size={17} />,iconBg: 'bg-[#d4eadd]', iconColor: 'text-[#154d30]', link: '/bookings' },
    { label: 'Total Spent',  value: loading ? '—' : `₦${(stats?.spent || 0).toLocaleString()}`,       icon: <TrendingUp size={17} />, iconBg: 'bg-[#eef6f1]', iconColor: 'text-[#1a5c3a]', link: '/bookings' },
  ];

  const quickActions = isOwner ? [
    { label: kycApproved ? 'List a new tool' : 'Complete KYC to list',    to: kycApproved ? '/tools/new' : '/kyc', icon: '➕', desc: kycApproved ? 'Add equipment to your listings' : 'Required before listing' },
    { label: 'My Tools',              to: '/my-tools',         icon: '🔧', desc: `${stats?.totalTools || 0} total listings` },
    { label: 'Booking Requests',      to: '/booking-requests', icon: '📋', desc: `${stats?.pending || 0} pending approval` },
    { label: 'Payout Settings',       to: '/bank-details',     icon: '🏦', desc: 'Manage bank details' },
  ] : [
    { label: 'Browse Tools', to: '/tools', icon: '🔍', desc: 'Find equipment near you' },
    { label: 'My Bookings',      to: '/bookings', icon: '📋', desc: `${stats?.totalBookings || 0} total bookings` },
    { label: 'Explore Tools',    to: '/tools',    icon: '📂', desc: 'Construction, farming & more' },
    { label: 'Help Center',      to: '/help',     icon: '❓', desc: 'FAQs and guides' },
  ];

  return (
    <div className="animate-fade-in w-full max-w-6xl mx-auto min-w-0">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            {greeting}, {user.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-400 text-[13px] mt-1 flex items-center gap-2 flex-wrap">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${kycApproved ? 'bg-green-500' : 'bg-amber-400'}`} />
            <span className="capitalize">{user.role}</span>
            <span className="text-gray-200">·</span>
            <span>{user.location || 'Nigeria'}</span>
            <span className="text-gray-200">·</span>
            <button
              onClick={() => fetchAll(true)}
              className="inline-flex items-center gap-1 hover:text-gray-600 transition-colors"
            >
              <RefreshCw size={10} className={refreshing ? 'animate-spin' : ''} />
              Updated {lastRefresh.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
            </button>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isOwner ? (
            kycApproved ? (
              <Link to="/tools/new" className="btn-primary flex items-center gap-2 text-sm py-2.5 px-5">
                <PlusCircle size={15} /> List Tool
              </Link>
            ) : (
              <Link to="/kyc" className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors">
                🪪 Verify Identity
              </Link>
            )
          ) : (
            <Link to="/tools" className="btn-primary flex items-center gap-2 text-sm py-2.5 px-5">
              Browse Tools <ArrowRight size={15} />
            </Link>
          )}
        </div>
      </div>

      {/* ── KYC Banner ── */}
      <KYCBanner kyc={kycStatus} />

      {/* ── Upgrade to listing banner — shown to renters who haven't enabled listing ── */}
      {!isOwner && !loading && kycStatus?.status !== 'pending' && (
        <div className="flex items-center gap-4 bg-gray-900 rounded-2xl p-4 mb-6">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">💰</div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[13px] font-semibold">Own tools sitting idle?</p>
            <p className="text-gray-400 text-xs mt-0.5">Earn money from equipment you already own — it takes 5 minutes to list.</p>
          </div>
          <button
            onClick={async () => {
              try {
                const data = await upgradeListing();
                if (data.redirect) window.location.href = data.redirect;
              } catch {}
            }}
            className="flex-shrink-0 bg-[#1a5c3a] hover:bg-[#154d30] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
          >
            Start Listing →
          </button>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(card => <StatCard key={card.label} {...card} loading={loading} />)}
      </div>

      {/* ── Charts ── */}
      {(loading || chartData.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <ChartCard
            title="Booking Activity"
            subtitle="Last 7 months"
            action={
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <Activity size={11} className={refreshing ? 'animate-pulse text-green-500' : ''} />
                {refreshing ? 'Refreshing...' : 'Live'}
              </span>
            }
          >
            {loading ? (
              <div className="h-[180px] animate-pulse bg-gray-50 rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bookGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1a5c3a" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1a5c3a" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="bookings" name="bookings"
                    stroke="#1a5c3a" strokeWidth={2} fill="url(#bookGrad)"
                    dot={{ r: 3, fill: '#1a5c3a', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#1a5c3a', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard
            title={isOwner ? 'Earnings Overview' : 'Spending Overview'}
            subtitle="₦ thousands · last 7 months"
          >
            {loading ? (
              <div className="h-[180px] animate-pulse bg-gray-50 rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="revenue" fill="#1a5c3a" radius={[4, 4, 0, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      )}

      {/* ── Quick Actions + Recent Activity ── */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Quick Actions */}
        <SectionCard title="Quick Actions">
          <div className="space-y-1">
            {quickActions.map(({ label, to, icon, desc }) => (
              <Link key={label} to={to}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors group cursor-pointer">
                <div className="w-9 h-9 bg-gray-100 group-hover:bg-[#eef6f1] rounded-xl flex items-center justify-center text-base flex-shrink-0 transition-colors">
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-800 group-hover:text-[#1a5c3a] transition-colors truncate">{label}</p>
                  <p className="text-[11px] text-gray-400 truncate">{desc}</p>
                </div>
                <ArrowRight size={13} className="text-gray-300 group-hover:text-[#3d9166] flex-shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        </SectionCard>

        {/* Recent Activity */}
        <SectionCard
          title="Recent Activity"
          action={
            <Link to={isOwner ? '/booking-requests' : '/bookings'}
              className="text-[12px] text-[#1a5c3a] hover:underline font-medium flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          }
        >
          {loading ? <SkeletonRows count={4} /> : (() => {
            // Tool status alerts for owners
            const toolAlerts = isOwner
              ? (stats?.recentActivity?.filter(a => a.type === 'tool') || []).slice(0, 2)
              : [];
            const rows = isOwner
              ? (stats?.recentActivity?.filter(a => a.type === 'booking') || []).slice(0, 4)
              : (stats?.recentBookings || []).slice(0, 4);

            if (!toolAlerts.length && !rows.length) return (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">📭</div>
                <p className="text-gray-400 text-[13px]">No activity yet.</p>
                {!kycApproved && (
                  <Link to="/kyc" className="text-[12px] text-[#1a5c3a] hover:underline mt-2 block">
                    Complete KYC to get started →
                  </Link>
                )}
              </div>
            );

            return (
              <div className="space-y-1">
                {/* Tool alerts */}
                {toolAlerts.map(event => (
                  <div key={event._id} className={`flex items-start gap-3 p-3 rounded-xl border ${
                    event.status === 'approved' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
                  }`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${
                      event.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {event.status === 'approved' ? '✅' : '❌'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-gray-800 truncate">{event.toolName}</p>
                      <p className={`text-[11px] ${event.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                        {event.status === 'approved' ? 'Listing approved — now live' : event.adminNote ? `Rejected: ${event.adminNote}` : 'Rejected by admin'}
                      </p>
                    </div>
                  </div>
                ))}
                {/* Booking rows */}
                {rows.map(booking => (
                  <div key={booking._id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className="w-8 h-8 bg-gray-100 group-hover:bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 text-sm transition-colors">
                      {booking.status === 'pending'   ? '⏳'
                      : booking.status === 'approved'  ? '✅'
                      : booking.status === 'completed' ? '🏁'
                      : booking.status === 'disputed'  ? '🚨' : '❌'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-gray-800 truncate">
                        {booking.toolName || booking.toolId?.name || 'Tool'}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {booking.totalAmount ? `₦${booking.totalAmount.toLocaleString()}` : ''}
                        {booking.startDate   ? ` · ${fmt(booking.startDate)}` : ''}
                      </p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                ))}
              </div>
            );
          })()}
        </SectionCard>
      </div>

      {/* ── Owner: Tool Approval Summary ── */}
      {isOwner && !loading && stats?.pendingTools > 0 && (
        <div className="mt-4 flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap size={16} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-amber-800">
              {stats.pendingTools} tool{stats.pendingTools > 1 ? 's' : ''} awaiting admin approval
            </p>
            <p className="text-[11px] text-amber-600">Tools must be approved before they appear in search results.</p>
          </div>
          <Link to="/my-tools" className="text-[12px] font-semibold text-amber-700 hover:underline flex-shrink-0">
            View →
          </Link>
        </div>
      )}

    </div>
  );
}