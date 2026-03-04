import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import BookingStatusBadge from '../components/bookings/BookingStatusBadge';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, CreditCard } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
const PLACEHOLDER = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);

  useEffect(() => {
    api.get('/bookings/user').then(({ data }) => setBookings(data.bookings)).finally(() => setLoading(false));
  }, []);

  const handlePay = async (bookingId) => {
    setPayingId(bookingId);
    try {
      const { data } = await api.post('/payments/initiate', { bookingId });
      window.open(data.data.authorizationUrl, '_blank');

      // Poll for verification after redirect
      setTimeout(async () => {
        try {
          await api.post('/payments/verify', { reference: data.data.reference });
          toast.success('Payment verified! ✅');
          const refreshed = await api.get('/bookings/user');
          setBookings(refreshed.data.bookings);
        } catch {
          toast('Payment window opened. Refresh after completing payment.', { icon: 'ℹ️' });
        }
      }, 10000);

    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment initiation failed.');
    } finally {
      setPayingId(null);
    }
  };

  if (loading) return (
    <div className="py-8 page-container">
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-5 animate-pulse">
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-100 rounded w-1/2" />
                <div className="h-4 bg-gray-100 rounded w-1/3" />
                <div className="h-4 bg-gray-100 rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="py-8 animate-fade-in">
      <div className="page-container max-w-3xl">
        <div className="mb-8">
          <h1 className="section-title mb-1">My Bookings</h1>
          <p className="text-gray-500">{bookings.length} booking{bookings.length !== 1 ? 's' : ''} total</p>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-display font-semibold text-gray-800 mb-2">No Bookings Yet</h3>
            <p className="text-gray-500 mb-6">Browse available tools and make your first booking.</p>
            <Link to="/tools" className="btn-primary">Browse Tools</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const img = booking.toolId?.images?.[0] ? `${BASE_URL}${booking.toolId.images[0]}` : PLACEHOLDER;
              const days = Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24));

              return (
                <div key={booking._id} className="card p-5">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-earth-100">
                      <img src={img} className="w-full h-full object-cover" onError={(e) => { e.target.src = PLACEHOLDER; }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-display font-semibold text-gray-900 text-lg leading-snug">
                          {booking.toolId?.name || 'Tool'}
                        </h3>
                        <BookingStatusBadge status={booking.status} paymentStatus={booking.paymentStatus} />
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin size={13} /> {booking.toolId?.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={13} />
                          {new Date(booking.startDate).toLocaleDateString()} – {new Date(booking.endDate).toLocaleDateString()}
                          <span className="text-gray-400">({days} day{days > 1 ? 's' : ''})</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-brand-600 font-bold text-lg">₦{booking.totalAmount?.toLocaleString()}</span>
                          <span className="text-gray-400 text-sm"> total</span>
                        </div>

                        {booking.status === 'approved' && booking.paymentStatus === 'unpaid' && (
                          <button
                            onClick={() => handlePay(booking._id)}
                            disabled={payingId === booking._id}
                            className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"
                          >
                            <CreditCard size={15} />
                            {payingId === booking._id ? 'Processing...' : 'Pay Now'}
                          </button>
                        )}

                        {booking.paymentStatus === 'paid' && (
                          <span className="badge-paid">✅ Payment Confirmed</span>
                        )}
                      </div>

                      {booking.ownerId && (
                        <p className="text-xs text-gray-400 mt-2">
                          Owner: {booking.ownerId.name} · {booking.ownerId.phone}
                        </p>
                      )}
                    </div>
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
