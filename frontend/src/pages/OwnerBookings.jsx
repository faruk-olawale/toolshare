import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import EscrowStatus from '../components/escrow/EscrowStatus';
import EscrowActions from '../components/escrow/EscrowActions';
import { Calendar, CheckCircle, XCircle, User } from 'lucide-react';

const fmt = (d) => new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_STYLES = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  approved: 'bg-green-50 text-green-700 border-green-100',
  rejected: 'bg-red-50 text-red-700 border-red-100',
  completed: 'bg-blue-50 text-blue-700 border-blue-100',
  cancelled: 'bg-gray-50 text-gray-500 border-gray-100',
  disputed: 'bg-red-50 text-red-700 border-red-100',
};

export default function OwnerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    api.get('/bookings/owner-bookings').then(({ data }) => {
      setBookings(data.bookings);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleAction = async (id, action) => {
    setProcessing(id);
    try {
      const { data } = await api.put(`/bookings/${id}/${action}`);
      toast.success(`Booking ${action === 'approve' ? 'approved' : 'rejected'}!`);
      setBookings(prev => prev.map(b => b._id === id ? data.booking : b));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    } finally { setProcessing(null); }
  };

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
        <h1 className="section-title mb-6">Booking Requests</h1>

        {bookings.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">📬</div>
            <p className="text-gray-500">No booking requests yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(booking => (
              <div key={booking._id} className="card p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{booking.toolId?.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge text-xs ${STATUS_STYLES[booking.status]}`}>{booking.status}</span>
                      {booking.paymentStatus !== 'unpaid' && (
                        <span className={`badge text-xs ${booking.paymentStatus === 'fully_released' ? 'bg-green-50 text-green-700 border-green-100' : booking.paymentStatus === 'partially_released' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-brand-50 text-brand-700 border-brand-100'}`}>
                          {booking.paymentStatus.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-brand-600 font-bold text-lg flex-shrink-0">₦{booking.totalAmount?.toLocaleString()}</p>
                </div>

                {/* Renter info */}
                <div className="bg-gray-50 rounded-xl p-3 mb-3">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-gray-400" />
                    <p className="text-sm text-gray-700"><strong>{booking.renterId?.name}</strong> · {booking.renterId?.email}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar size={14} className="text-gray-400" />
                    <p className="text-sm text-gray-500">{fmt(booking.startDate)} → {fmt(booking.endDate)}</p>
                  </div>
                  {booking.notes && <p className="text-xs text-gray-400 mt-1">Note: {booking.notes}</p>}
                </div>

                {/* Pending actions */}
                {booking.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(booking._id, 'reject')} disabled={processing === booking._id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
                      <XCircle size={14} /> Reject
                    </button>
                    <button onClick={() => handleAction(booking._id, 'approve')} disabled={processing === booking._id}
                      className="flex-1 btn-primary py-2.5 text-sm flex items-center justify-center gap-1.5">
                      <CheckCircle size={14} /> {processing === booking._id ? 'Processing...' : 'Approve'}
                    </button>
                  </div>
                )}

                {/* Escrow */}
                {['paid', 'partially_released', 'fully_released'].includes(booking.paymentStatus) && (
                  <div className="space-y-3 mt-3">
                    <EscrowStatus booking={booking} />
                    <EscrowActions booking={booking} onUpdate={handleUpdate} />
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