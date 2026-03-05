import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import EscrowStatus from '../components/escrow/EscrowStatus';
import EscrowActions from '../components/escrow/EscrowActions';
import { Calendar, MapPin, Phone } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
const PLACEHOLDER = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80';
const fmt = (d) => new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_STYLES = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  approved: 'bg-green-50 text-green-700 border-green-100',
  rejected: 'bg-red-50 text-red-700 border-red-100',
  completed: 'bg-blue-50 text-blue-700 border-blue-100',
  cancelled: 'bg-gray-50 text-gray-500 border-gray-100',
  disputed: 'bg-red-50 text-red-700 border-red-100',
};

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/bookings/my-bookings').then(({ data }) => {
      setBookings(data.bookings);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleUpdate = (updated) => {
    setBookings(prev => prev.map(b => b._id === updated._id ? updated : b));
  };

  if (loading) return (
    <div className="py-8 page-container max-w-3xl">
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="py-8 animate-fade-in">
      <div className="page-container max-w-3xl">
        <h1 className="section-title mb-6">My Bookings</h1>

        {bookings.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">📋</div>
            <p className="text-gray-500 mb-4">No bookings yet</p>
            <Link to="/tools" className="btn-primary">Browse Tools →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(booking => (
              <div key={booking._id} className="card p-4">
                {/* Tool info */}
                <div className="flex gap-3 mb-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-earth-100">
                    <img src={booking.toolId?.images?.[0] ? `${BASE_URL}${booking.toolId.images[0]}` : PLACEHOLDER}
                      className="w-full h-full object-cover" onError={e => { e.target.src = PLACEHOLDER; }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-gray-900 truncate">{booking.toolId?.name}</h3>
                      <span className={`badge text-xs flex-shrink-0 ${STATUS_STYLES[booking.status]}`}>{booking.status}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <MapPin size={11} /> {booking.toolId?.location}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                      <Calendar size={11} /> {fmt(booking.startDate)} → {fmt(booking.endDate)}
                    </div>
                    <p className="text-brand-600 font-bold text-sm mt-1">₦{booking.totalAmount?.toLocaleString()}</p>
                  </div>
                </div>

                {/* Owner contact — only after approved */}
                {booking.status === 'approved' && booking.ownerId?.phone && (
                  <div className="bg-gray-50 rounded-xl p-3 mb-3 flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    <p className="text-sm text-gray-600">Owner: <strong>{booking.ownerId?.name}</strong> · {booking.ownerId?.phone}</p>
                  </div>
                )}

                {/* Payment button */}
                {booking.status === 'approved' && booking.paymentStatus === 'unpaid' && (
                  <Link to={`/bookings/${booking._id}/pay`}
                    className="btn-primary w-full text-center py-2.5 text-sm mb-3 block">
                    Pay Now — ₦{booking.totalAmount?.toLocaleString()} →
                  </Link>
                )}

                {/* Escrow status + actions */}
                {['paid', 'partially_released', 'fully_released'].includes(booking.paymentStatus) && (
                  <div className="space-y-3">
                    <EscrowStatus booking={booking} />
                    <EscrowActions booking={booking} onUpdate={handleUpdate} />
                  </div>
                )}

                {/* Rejection note */}
                {booking.status === 'rejected' && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                    <p className="text-xs text-red-600">Booking was rejected. <Link to="/tools" className="underline">Browse other tools</Link></p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}