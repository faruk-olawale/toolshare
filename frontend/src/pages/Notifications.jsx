import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Bell, Trash2, CheckCheck } from 'lucide-react';

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const typeStyles = (type) => {
  if (type.includes('approved') || type === 'kyc_approved')
    return { bg: 'bg-green-50 border-green-100', icon: '✅', badge: 'bg-green-100 text-green-700' };
  if (type.includes('rejected') || type === 'kyc_rejected')
    return { bg: 'bg-red-50 border-red-100', icon: '❌', badge: 'bg-red-100 text-red-700' };
  if (type === 'booking_new')
    return { bg: 'bg-blue-50 border-blue-100', icon: '📥', badge: 'bg-blue-100 text-blue-700' };
  if (type === 'payment')
    return { bg: 'bg-purple-50 border-purple-100', icon: '💰', badge: 'bg-purple-100 text-purple-700' };
  if (type === 'dispute')
    return { bg: 'bg-orange-50 border-orange-100', icon: '🚨', badge: 'bg-orange-100 text-orange-700' };
  if (type === 'review')
    return { bg: 'bg-yellow-50 border-yellow-100', icon: '⭐', badge: 'bg-yellow-100 text-yellow-700' };
  return { bg: 'bg-gray-50 border-gray-100', icon: '🔔', badge: 'bg-gray-100 text-gray-600' };
};

const typeLabel = (type) => ({
  tool_approved:    'Tool Approved',
  tool_rejected:    'Tool Rejected',
  kyc_approved:     'KYC Approved',
  kyc_rejected:     'KYC Rejected',
  booking_new:      'New Booking',
  booking_approved: 'Booking Approved',
  booking_rejected: 'Booking Rejected',
  booking_completed:'Booking Completed',
  payment:          'Payment',
  review:           'Review',
  dispute:          'Dispute',
  system:           'System',
}[type] || 'Notification');

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState('all'); // all | unread
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const handleClick = async (n) => {
    if (!n.read) {
      try {
        await api.put(`/notifications/${n._id}/read`);
        setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, read: true } : x));
      } catch {}
    }
    if (n.link) navigate(n.link);
  };

  const deleteOne = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch {}
  };

  const clearAll = async () => {
    try {
      await Promise.all(notifications.map(n => api.delete(`/notifications/${n._id}`)));
      setNotifications([]);
    } catch {}
  };

  const displayed = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="py-8 animate-fade-in">
      <div className="page-container max-w-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="section-title mb-1">Message Center</h1>
            <p className="text-gray-400 text-sm">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium px-3 py-2 rounded-xl hover:bg-brand-50 transition-colors">
                <CheckCheck size={16} /> Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={clearAll}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-medium px-3 py-2 rounded-xl hover:bg-red-50 transition-colors">
                <Trash2 size={16} /> Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {['all', 'unread'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${filter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {f} {f === 'unread' && unreadCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bell size={28} className="text-gray-300" />
            </div>
            <h3 className="font-display font-bold text-gray-900 mb-1">
              {filter === 'unread' ? 'No unread messages' : 'No messages yet'}
            </h3>
            <p className="text-sm text-gray-400">
              {filter === 'unread' ? "You're all caught up!" : "We'll notify you about bookings, approvals, and more."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map(n => {
              const style = typeStyles(n.type);
              return (
                <div key={n._id}
                  onClick={() => handleClick(n)}
                  className={`card p-4 cursor-pointer hover:shadow-md transition-all border ${!n.read ? 'border-brand-100 bg-brand-50/30' : 'border-transparent'}`}>
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 text-base ${style.bg}`}>
                      {style.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={`text-sm leading-snug ${!n.read ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="w-2.5 h-2.5 bg-brand-500 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed mb-2">{n.message}</p>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
                          {typeLabel(n.type)}
                        </span>
                        <span className="text-xs text-gray-300">{timeAgo(n.createdAt)}</span>
                        {n.link && (
                          <span className="text-xs text-brand-500 font-medium">Tap to view →</span>
                        )}
                      </div>
                    </div>

                    {/* Delete */}
                    <button onClick={(e) => deleteOne(e, n._id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}