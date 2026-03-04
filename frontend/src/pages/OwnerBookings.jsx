import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import BookingStatusBadge from '../components/bookings/BookingStatusBadge';
import { Calendar, Phone, Mail, CheckCircle, XCircle, FlagTriangleRight } from 'lucide-react';

export default function OwnerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    api.get('/bookings/owner').then(({ data }) => setBookings(data.bookings)).finally(() => setLoading(false));
  }, []);

  const handleAction = async (id, action) => {
    setProcessing(id + action);
    try {
      const { data } = await api.put(`/bookings/${id}/${action}`);
      setBookings((prev) => prev.map((b) => b._id === id ? { ...b, status: data.booking.status } : b));
      toast.success(action === 'approve' ? 'Booking approved! ✅' : action === 'reject' ? 'Booking rejected.' : 'Booking completed! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} booking.`);
    } finally {
      setProcessing(null);
    }
  };

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);
  const counts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    approved: bookings.filter((b) => b.status === 'approved').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
  };

  if (loading) return (
    <div className="py-8 page-container">
      <div className="space-y-4 animate-pulse">
        {[...Array(4)].map((_, i) => <div key={i} className="card h-40" />)}
      </div>
    </div>
  );

  return (
    <div className="py-8 animate-fade-in">
      <div className="page-container max-w-4xl">
        <div className="mb-8">
          <h1 className="section-title mb-1">Booking Requests</h1>
          <p className="text-gray-500">Manage incoming rental requests for your tools</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {Object.entries(counts).map(([key, count]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize flex items-center gap-1.5 ${
                filter === key ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {key}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  key === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'
                }`}>{count}</span>
              )}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-display font-semibold text-gray-800 mb-2">No {filter === 'all' ? '' : filter} Bookings</h3>
            <p className="text-gray-500">New booking requests will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((booking) => {
              const days = Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24));
              return (
                <div key={booking._id} className={`card p-6 ${booking.status === 'pending' ? 'border-yellow-200 ring-1 ring-yellow-100' : ''}`}>
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display font-bold text-xl text-gray-900">{booking.toolId?.name}</h3>
                        <span className="text-xs bg-earth-100 text-earth-700 px-2 py-0.5 rounded-full">{booking.toolId?.category}</span>
                      </div>
                      <BookingStatusBadge status={booking.status} paymentStatus={booking.paymentStatus} />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-brand-600">₦{booking.totalAmount?.toLocaleString()}</div>
                      <div className="text-sm text-gray-400">{days} day{days > 1 ? 's' : ''}</div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Renter Info</p>
                      <p className="font-semibold text-gray-800">{booking.renterId?.name}</p>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                        <Phone size={12} /> {booking.renterId?.phone || 'Not provided'}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                        <Mail size={12} /> {booking.renterId?.email}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Rental Period</p>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar size={14} className="text-brand-500" />
                        <span className="text-sm">
                          {new Date(booking.startDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {' → '}
                          {new Date(booking.endDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 text-sm text-blue-700">
                      <span className="font-medium">Note:</span> {booking.notes}
                    </div>
                  )}

                  {/* Actions */}
                  {booking.status === 'pending' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAction(booking._id, 'reject')}
                        disabled={!!processing}
                        className="btn-secondary flex-1 flex items-center justify-center gap-2 text-red-500 border-red-100 hover:bg-red-50"
                      >
                        <XCircle size={16} /> Reject
                      </button>
                      <button
                        onClick={() => handleAction(booking._id, 'approve')}
                        disabled={!!processing}
                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={16} />
                        {processing === booking._id + 'approve' ? 'Approving...' : 'Approve'}
                      </button>
                    </div>
                  )}

                  {booking.status === 'approved' && booking.paymentStatus === 'paid' && (
                    <button
                      onClick={() => handleAction(booking._id, 'complete')}
                      disabled={!!processing}
                      className="btn-outline w-full flex items-center justify-center gap-2"
                    >
                      <FlagTriangleRight size={16} />
                      {processing === booking._id + 'complete' ? 'Completing...' : 'Mark as Completed'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
