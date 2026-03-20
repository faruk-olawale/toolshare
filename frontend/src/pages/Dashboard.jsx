import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import KYCBanner from '../components/kyc/KYCBanner';
import {
  PlusCircle, Package, BookOpen, TrendingUp, Clock,
  CheckCircle, ArrowRight, ArrowUpRight, ArrowDownRight,
  RefreshCw, Activity
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (d) => new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });

const STATUS_CONFIG = {
  pending:   { dot: 'bg-amber-400',  text: 'text-amber-700',  bg: 'bg-amber-50 border-amber-100'  },
  approved:  { dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50 border-green-100'  },
  completed: { dot: 'bg-blue-500',   text: 'text-blue-700',   bg: 'bg-blue-50 border-blue-100'    },
  rejected:  { dot: 'bg-red-400',    text: 'text-red-700',    bg: 'bg-red-50 border-red-100'      },
  cancelled: { dot: 'bg-gray-400',   text: 'text-gray-500',   bg: 'bg-gray-50 border-gray-100'    },
  disputed:  { dot: 'bg-orange-400', text: 'text-orange-700', bg: 'bg-orange-50 border-orange-100'},
};

// Build chart data from bookings array — last 7 months
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
    const monthBookings = bookings.filter(b => {
      const bDate = new Date(b.createdAt || b.startDate || b.date);
      return `${bDate.getFullYear()}-${String(bDate.getMonth() + 1).padStart(2, '0')}` === key;
    });
    return {
      month,
      bookings: monthBookings.length,
      revenue:  monthBookings.filter(b => b.paymentStatus === 'paid' || b.totalAmount)
                             .reduce((s, b) => s + (b.totalAmount || 0), 0) / 1000,
    };
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, gradient, trend, trendLabel, link }) {
  return (
    <Link to={link} className="group relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${gradient} rounded-2xl`} style={{ opacity: 0.03 }} />
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${gradient} text-white shadow-sm`}>
          {icon}
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
      <div className="text-2xl font-bold text-gray-900 tracking-tight mb-0.5">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
      {trendLabel && <div className="text-xs text-gray-400 mt-1">{trendLabel}</div>}
    </Link>
  );
}

function ChartCard({ title, subtitle, children, action }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
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
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <span className="font-bold ml-1">{p.name === 'revenue' ? `₦${p.value}k` : p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats]         = useState(null);
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [chartData, setChartData] = useState([]);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    const controller = new AbortController();
    try {
      const kycRes = await api.get('/kyc/status', { signal: controller.signal });
      setKycStatus(kycRes.data.kyc);

      if (user.role === 'owner') {
        const [toolsRes, bookingsRes] = await Promise.all([
          api.get('/tools/my-tools', { signal: controller.signal }),
          api.get('/bookings/owner-bookings', { signal: controller.signal }),
        ]);
        const bookings = bookingsRes.data.bookings;
        const tools    = toolsRes.data.tools || [];

        const toolEvents = tools.filter(t => t.adminVerified || t.adminNote).map(t => ({
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

        const newStats = {
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
        };
        setStats(newStats);
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

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchAll(true), 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  if (loading) return (
    <div className="py-8 page-container">
      <div className="animate-pulse space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 bg-gray-100 rounded-lg w-56" />
            <div className="h-4 bg-gray-100 rounded-lg w-36" />
          </div>
          <div className="h-10 bg-gray-100 rounded-xl w-28" />
        </div>
        <div className="h-16 bg-[#eef6f1] rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="h-64 bg-gray-100 rounded-2xl" />
          <div className="h-64 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    </div>
  );

  const isOwner     = user.role === 'owner';
  const kycApproved = kycStatus?.status === 'approved';

  const statCards = isOwner ? [
    { label: 'My Tools',         value: stats?.totalTools || 0,                        icon: <Package size={18} />,    gradient: 'bg-gradient-to-br from-violet-500 to-purple-600',  link: '/my-tools' },
    { label: 'Total Bookings',   value: stats?.totalBookings || 0,                      icon: <BookOpen size={18} />,   gradient: 'bg-gradient-to-br from-blue-500 to-cyan-500',      link: '/booking-requests' },
    { label: 'Pending Requests', value: stats?.pending || 0,                            icon: <Clock size={18} />,      gradient: 'bg-gradient-to-br from-amber-400 to-orange-500',  link: '/booking-requests' },
    { label: 'Total Earnings',   value: `₦${(stats?.earnings || 0).toLocaleString()}`, icon: <TrendingUp size={18} />, gradient: 'bg-gradient-to-br from-[#1a5c3a] to-[#3d9166]',   link: '/booking-requests', trend: 0, trendLabel: 'vs last month' },
  ] : [
    { label: 'My Bookings',  value: stats?.totalBookings || 0,                        icon: <BookOpen size={18} />,   gradient: 'bg-gradient-to-br from-blue-500 to-cyan-500',     link: '/bookings' },
    { label: 'Pending',      value: stats?.pending || 0,                               icon: <Clock size={18} />,      gradient: 'bg-gradient-to-br from-amber-400 to-orange-500', link: '/bookings' },
    { label: 'Active',       value: stats?.approved || 0,                              icon: <CheckCircle size={18} />,gradient: 'bg-gradient-to-br from-[#1a5c3a] to-[#3d9166]',  link: '/bookings' },
    { label: 'Total Spent',  value: `₦${(stats?.spent || 0).toLocaleString()}`,       icon: <TrendingUp size={18} />, gradient: 'bg-gradient-to-br from-violet-500 to-purple-600', link: '/bookings' },
  ];

  const quickActions = isOwner ? [
    { label: kycApproved ? 'List a new tool' : 'Complete KYC to list tools', to: kycApproved ? '/tools/new' : '/kyc', icon: '➕', desc: kycApproved ? 'Add equipment to your listings' : 'Required before listing' },
    { label: 'View my tools',          to: '/my-tools',         icon: '🔧', desc: `${stats?.totalTools || 0} total listings` },
    { label: 'Booking requests',       to: '/booking-requests', icon: '📋', desc: `${stats?.pending || 0} pending approval` },
    { label: 'Payout settings',        to: '/bank-details',     icon: '🏦', desc: 'Manage bank details' },
  ] : [
    { label: kycApproved ? 'Browse tools' : 'Complete KYC first', to: kycApproved ? '/tools' : '/kyc', icon: '🔍', desc: kycApproved ? 'Find equipment near you' : 'Required to book' },
    { label: 'My bookings',    to: '/bookings', icon: '📋', desc: `${stats?.totalBookings || 0} total bookings` },
    { label: 'Explore by category', to: '/tools', icon: '📂', desc: 'Construction, farming & more' },
    { label: 'Help center',    to: '/help',     icon: '❓', desc: 'FAQs and guides' },
  ];

  return (
    <div className="py-8 animate-fade-in">
      <div className="page-container max-w-6xl">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-400 text-sm mt-1 capitalize flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${kycApproved ? 'bg-green-500' : 'bg-amber-400'}`} />
              {user.role} · {user.location || 'Nigeria'}
              <span className="text-gray-300">·</span>
              <button onClick={() => fetchAll(true)} className="inline-flex items-center gap-1 hover:text-gray-600 transition-colors">
                <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
                {lastRefresh.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
              </button>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isOwner ? (
              kycApproved ? (
                <Link to="/tools/new" className="btn-primary flex items-center gap-2 text-sm py-2.5 px-5">
                  <PlusCircle size={16} /> List Tool
                </Link>
              ) : (
                <Link to="/kyc" className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors">
                  🪪 Verify Identity
                </Link>
              )
            ) : (
              <Link to="/tools" className="btn-primary flex items-center gap-2 text-sm py-2.5 px-5">
                Browse Tools <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>

        {/* ── KYC Banner ── */}
        <KYCBanner kyc={kycStatus} />

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {statCards.map((card) => <StatCard key={card.label} {...card} />)}
        </div>

        {/* ── Charts ── */}
        {chartData.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <ChartCard
              title="Booking Activity"
              subtitle="Last 7 months"
              action={<span className="text-xs text-gray-400 flex items-center gap-1"><Activity size={11} /> Live</span>}
            >
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bookingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1a5c3a" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1a5c3a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="bookings" name="bookings" stroke="#1a5c3a" strokeWidth={2} fill="url(#bookingGrad)" dot={{ r: 3, fill: '#1a5c3a', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#1a5c3a' }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title={isOwner ? 'Earnings Overview' : 'Spending Overview'}
              subtitle="₦ thousands · last 7 months"
            >
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="revenue" fill="#1a5c3a" radius={[4, 4, 0, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* ── Quick Actions + Recent Activity ── */}
        <div className="grid md:grid-cols-2 gap-4">

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">Quick Actions</h3>
            <div className="space-y-1">
              {quickActions.map(({ label, to, icon, desc }) => (
                <Link key={label} to={to} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer">
                  <div className="w-9 h-9 bg-gray-100 group-hover:bg-[#eef6f1] rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-colors">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 group-hover:text-[#1a5c3a] transition-colors truncate">{label}</p>
                    <p className="text-xs text-gray-400 truncate">{desc}</p>
                  </div>
                  <ArrowRight size={14} className="text-gray-300 group-hover:text-[#3d9166] flex-shrink-0 transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 text-sm">Recent Activity</h3>
              <Link to={isOwner ? '/booking-requests' : '/bookings'} className="text-xs text-[#1a5c3a] hover:underline font-medium">
                View all →
              </Link>
            </div>

            {/* Tool approval alerts for owners */}
            {isOwner && stats?.recentActivity?.filter(a => a.type === 'tool').slice(0, 2).map(event => (
              <div key={event._id} className={`flex items-start gap-3 p-3 rounded-xl mb-2 border ${event.status === 'approved' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${event.status === 'approved' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {event.status === 'approved' ? '✅' : '❌'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{event.toolName}</p>
                  <p className={`text-xs ${event.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                    {event.status === 'approved' ? 'Listing approved — now live' : event.adminNote ? `Rejected: ${event.adminNote}` : 'Listing rejected by admin'}
                  </p>
                </div>
              </div>
            ))}

            {/* Booking rows */}
            {(() => {
              const rows = isOwner
                ? stats?.recentActivity?.filter(a => a.type === 'booking')
                : stats?.recentBookings;
              if (!rows?.length && !stats?.recentActivity?.filter(a => a.type === 'tool')?.length) {
                return (
                  <div className="text-center py-8">
                    <div className="text-3xl mb-2">📭</div>
                    <p className="text-gray-400 text-sm">No activity yet.</p>
                    {!kycApproved && (
                      <Link to="/kyc" className="text-xs text-[#1a5c3a] hover:underline mt-2 block">Complete KYC to get started →</Link>
                    )}
                  </div>
                );
              }
              return (
                <div className="space-y-1">
                  {rows?.slice(0, 4).map(booking => (
                    <div key={booking._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 text-sm">
                        {booking.status === 'pending' ? '⏳' : booking.status === 'approved' ? '✅' : booking.status === 'completed' ? '🏁' : booking.status === 'disputed' ? '🚨' : '❌'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{booking.toolName || booking.toolId?.name || 'Tool'}</p>
                        <p className="text-xs text-gray-400">
                          {booking.totalAmount ? `₦${booking.totalAmount.toLocaleString()}` : ''}
                          {booking.startDate ? ` · ${fmt(booking.startDate)}` : ''}
                        </p>
                      </div>
                      <StatusBadge status={booking.status} />
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

      </div>
    </div>
  );
}