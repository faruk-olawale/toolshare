import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { PlusCircle, Package, BookOpen, TrendingUp, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (user.role === 'owner') {
          const [toolsRes, bookingsRes] = await Promise.all([
            api.get('/tools/my-tools'),
            api.get('/bookings/owner'),
          ]);
          const bookings = bookingsRes.data.bookings;
          setStats({
            totalTools: toolsRes.data.count,
            totalBookings: bookings.length,
            pending: bookings.filter((b) => b.status === 'pending').length,
            approved: bookings.filter((b) => b.status === 'approved').length,
            completed: bookings.filter((b) => b.status === 'completed').length,
            earnings: bookings.filter((b) => b.paymentStatus === 'paid').reduce((sum, b) => sum + b.totalAmount, 0),
            recentBookings: bookings.slice(0, 5),
          });
        } else {
          const { data } = await api.get('/bookings/user');
          const bookings = data.bookings;
          setStats({
            totalBookings: bookings.length,
            pending: bookings.filter((b) => b.status === 'pending').length,
            approved: bookings.filter((b) => b.status === 'approved').length,
            completed: bookings.filter((b) => b.status === 'completed').length,
            spent: bookings.filter((b) => b.paymentStatus === 'paid').reduce((sum, b) => sum + b.totalAmount, 0),
            recentBookings: bookings.slice(0, 5),
          });
        }
      } catch { }
      setLoading(false);
    };
    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="py-8 page-container">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-100 rounded-xl w-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user.role === 'owner';

  const statCards = isOwner ? [
    { label: 'My Tools', value: stats?.totalTools || 0, icon: <Package size={20} />, color: 'bg-blue-50 text-blue-600', link: '/my-tools' },
    { label: 'Total Bookings', value: stats?.totalBookings || 0, icon: <BookOpen size={20} />, color: 'bg-purple-50 text-purple-600', link: '/booking-requests' },
    { label: 'Pending Requests', value: stats?.pending || 0, icon: <Clock size={20} />, color: 'bg-yellow-50 text-yellow-600', link: '/booking-requests' },
    { label: 'Total Earnings', value: `₦${(stats?.earnings || 0).toLocaleString()}`, icon: <TrendingUp size={20} />, color: 'bg-green-50 text-green-600', link: '/booking-requests' },
  ] : [
    { label: 'My Bookings', value: stats?.totalBookings || 0, icon: <BookOpen size={20} />, color: 'bg-blue-50 text-blue-600', link: '/bookings' },
    { label: 'Pending', value: stats?.pending || 0, icon: <Clock size={20} />, color: 'bg-yellow-50 text-yellow-600', link: '/bookings' },
    { label: 'Active', value: stats?.approved || 0, icon: <CheckCircle size={20} />, color: 'bg-green-50 text-green-600', link: '/bookings' },
    { label: 'Total Spent', value: `₦${(stats?.spent || 0).toLocaleString()}`, icon: <TrendingUp size={20} />, color: 'bg-purple-50 text-purple-600', link: '/bookings' },
  ];

  return (
    <div className="py-8 animate-fade-in">
      <div className="page-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="section-title">
              Welcome back, {user.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-gray-500 mt-1 capitalize">{user.role} Account · {user.location || 'Nigeria'}</p>
          </div>
          {isOwner ? (
            <Link to="/tools/new" className="btn-primary flex items-center gap-2">
              <PlusCircle size={18} /> List Tool
            </Link>
          ) : (
            <Link to="/tools" className="btn-primary flex items-center gap-2">
              Browse Tools <ArrowRight size={18} />
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ label, value, icon, color, link }) => (
            <Link key={label} to={link} className="card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
                {icon}
              </div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-sm text-gray-500">{label}</div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="card p-6">
            <h3 className="font-display font-semibold text-lg text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {(isOwner ? [
                { label: 'List a new tool', to: '/tools/new', icon: '➕' },
                { label: 'View my tools', to: '/my-tools', icon: '🔧' },
                { label: 'Check booking requests', to: '/booking-requests', icon: '📋' },
              ] : [
                { label: 'Browse available tools', to: '/tools', icon: '🔍' },
                { label: 'View my bookings', to: '/bookings', icon: '📋' },
                { label: 'Explore categories', to: '/tools', icon: '📂' },
              ]).map(({ label, to, icon }) => (
                <Link key={label} to={to} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <span className="text-xl">{icon}</span>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-brand-600">{label}</span>
                  <ArrowRight size={14} className="ml-auto text-gray-300 group-hover:text-brand-400" />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-lg text-gray-900">Recent Activity</h3>
              <Link to={isOwner ? '/booking-requests' : '/bookings'} className="text-sm text-brand-600 hover:underline">View all</Link>
            </div>
            {stats?.recentBookings?.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-gray-500 text-sm">No activity yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats?.recentBookings?.map((booking) => (
                  <div key={booking._id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-9 h-9 bg-white rounded-xl border border-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">
                        {booking.status === 'pending' ? '⏳' : booking.status === 'approved' ? '✅' : booking.status === 'completed' ? '🏁' : '❌'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {booking.toolId?.name || 'Tool'}
                      </p>
                      <p className="text-xs text-gray-500">
                        ₦{booking.totalAmount?.toLocaleString()} · {new Date(booking.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`badge text-xs ${
                      booking.status === 'pending' ? 'badge-pending' :
                      booking.status === 'approved' ? 'badge-approved' :
                      booking.status === 'completed' ? 'badge-completed' : 'badge-rejected'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}