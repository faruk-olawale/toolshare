import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import api from '../../services/api';

export default function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();

  const fetchUnread = async () => {
    try {
      const { data } = await api.get('/notifications');
      setUnread(data.unreadCount || 0);
    } catch {}
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <button
      onClick={() => navigate('/notifications')}
      className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
      title="Notifications"
    >
      <Bell size={20} className="text-gray-600" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}