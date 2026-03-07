import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { MessageSquare, Trash2, CheckCheck, Bell } from 'lucide-react';

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const typeConfig = (type) => {
  const map = {
    tool_approved:     { bg: 'bg-green-50 border-green-100',   icon: '✅', badge: 'bg-green-100 text-green-700',   label: 'Tool Approved' },
    tool_rejected:     { bg: 'bg-red-50 border-red-100',       icon: '❌', badge: 'bg-red-100 text-red-700',       label: 'Tool Rejected' },
    kyc_approved:      { bg: 'bg-green-50 border-green-100',   icon: '🪪', badge: 'bg-green-100 text-green-700',   label: 'KYC Approved' },
    kyc_rejected:      { bg: 'bg-red-50 border-red-100',       icon: '🪪', badge: 'bg-red-100 text-red-700',       label: 'KYC Rejected' },
    booking_new:       { bg: 'bg-blue-50 border-blue-100',     icon: '📥', badge: 'bg-blue-100 text-blue-700',     label: 'New Booking' },
    booking_approved:  { bg: 'bg-green-50 border-green-100',   icon: '🎉', badge: 'bg-green-100 text-green-700',   label: 'Booking Approved' },
    booking_rejected:  { bg: 'bg-red-50 border-red-100',       icon: '❌', badge: 'bg-red-100 text-red-700',       label: 'Booking Rejected' },
    booking_completed: { bg: 'bg-blue-50 border-blue-100',     icon: '🏁', badge: 'bg-blue-100 text-blue-700',     label: 'Booking Completed' },
    payment:           { bg: 'bg-purple-50 border-purple-100', icon: '💰', badge: 'bg-purple-100 text-purple-700', label: 'Payment' },
    review:            { bg: 'bg-yellow-50 border-yellow-100', icon: '⭐', badge: 'bg-yellow-100 text-yellow-700', label: 'Review' },
    dispute:           { bg: 'bg-orange-50 border-orange-100', icon: '🚨', badge: 'bg-orange-100 text-orange-700', label: 'Dispute' },
  };
  return map[type] || { bg: 'bg-gray-50 border-gray-100', icon: '🔔', badge: 'bg-gray-100 text-gray-600', label: 'Notification' };
};

export default function MessageCenter() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState('all');
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
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

  const displayed   = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 md:bg-transparent">

      {/* Page wrapper — full width on mobile, constrained on desktop */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-8">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-gray-900">
                Message Center
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                  : 'All caught up — nothing new!'}
              </p>
            </div>

            {/* Action buttons — stack on very small screens */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs sm:text-sm text-brand-600 hover:text-brand-700 font-medium px-2.5 sm:px-3 py-2 rounded-xl hover:bg-brand-50 transition-colors whitespace-nowrap"
                >
                  <CheckCheck size={14} />
                  <span className="hidden sm:inline">Mark all read</span>
                  <span className="sm:hidden">Read all</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1 text-xs sm:text-sm text-red-500 hover:text-red-600 font-medium px-2.5 sm:px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                  <span className="hidden sm:inline">Clear all</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Chat teaser banner */}
        <div className="bg-gradient-to-r from-brand-50 to-blue-50 border border-brand-100 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
            <MessageSquare size={18} className="text-brand-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800">Direct messaging coming soon</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Soon you'll be able to chat directly with renters and owners.
            </p>
          </div>
          <span className="text-xs bg-brand-100 text-brand-700 font-semibold px-2.5 py-1 rounded-full flex-shrink-0">
            Soon
          </span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-full sm:w-fit">
          {['all', 'unread'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 sm:flex-none px-4 py-2 sm:py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                filter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f}
              {f === 'unread' && unreadCount > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
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
          <div className="bg-white rounded-2xl border border-gray-100 py-16 px-6 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bell size={28} className="text-gray-300" />
            </div>
            <h3 className="font-display font-bold text-gray-900 mb-1">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              {filter === 'unread'
                ? "You're all caught up!"
                : 'Booking updates, approvals and alerts will appear here.'}
            </p>
          </div>

        ) : (
          <div className="space-y-2">
            {displayed.map(n => {
              const cfg = typeConfig(n.type);
              return (
                <div
                  key={n._id}
                  onClick={() => handleClick(n)}
                  className={`bg-white rounded-2xl border cursor-pointer active:scale-[0.99] hover:shadow-md transition-all duration-150 ${
                    !n.read ? 'border-brand-100 ring-1 ring-brand-100' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-3 p-4">

                    {/* Type icon */}
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 text-base ${cfg.bg}`}>
                      {cfg.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <p className={`text-sm leading-snug ${!n.read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="w-2.5 h-2.5 bg-brand-500 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>

                      <p className="text-sm text-gray-500 leading-relaxed mb-2.5">
                        {n.message}
                      </p>

                      {/* Meta row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                        <span className="text-xs text-gray-300">{timeAgo(n.createdAt)}</span>
                        {n.link && (
                          <span className="text-xs text-brand-500 font-medium">
                            Tap to view →
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => deleteOne(e, n._id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 active:bg-red-100 transition-colors flex-shrink-0 -mr-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom padding for mobile scroll */}
        <div className="h-6 md:h-0" />
      </div>
    </div>
  );
}