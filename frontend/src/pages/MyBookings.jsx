import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ReviewForm from '../components/reviews/ReviewForm';
import toast from 'react-hot-toast';
import EscrowStatus from '../components/escrow/EscrowStatus';
import EscrowActions from '../components/escrow/EscrowActions';
import { Calendar, MapPin, Phone, X, AlertTriangle, Info, ChevronDown, ChevronUp, Banknote, Clock } from 'lucide-react';

import { getImgUrl, PLACEHOLDER } from '../utils/imgUrl';

const fmt         = (d) => new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_STYLES = {
  pending:   'bg-yellow-50 text-yellow-700 border-yellow-100',
  approved:  'bg-green-50 text-green-700 border-green-100',
  rejected:  'bg-red-50 text-red-700 border-red-100',
  completed: 'bg-blue-50 text-blue-700 border-blue-100',
  cancelled: 'bg-gray-50 text-gray-500 border-gray-100',
  disputed:  'bg-orange-50 text-orange-700 border-orange-100',
};

// ── Cancellation Policy Modal ──────────────────────────────────────────────────
function CancelModal({ booking, onClose, onCancelled }) {
  const [policy, setPolicy]     = useState(null);
  const [reason, setReason]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api.get(`/bookings/${booking._id}/cancel-policy`)
      .then(({ data }) => setPolicy(data))
      .catch(() => setPolicy(null))
      .finally(() => setLoading(false));
  }, [booking._id]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const { data } = await api.put(`/bookings/${booking._id}/cancel`, { reason });
      toast.success(data.message);
      onCancelled(data.booking);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed');
    }
    setCancelling(false);
  };

  const pct = policy?.policy?.percent;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Cancel Booking</h3>
              <p className="text-xs text-gray-400">{booking.toolId?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Refund preview */}
          {loading ? (
            <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />
          ) : policy ? (
            <div className={`rounded-xl p-4 border ${
              pct === 100 ? 'bg-green-50 border-green-100' :
              pct > 0     ? 'bg-yellow-50 border-yellow-100' :
                            'bg-red-50 border-red-100'
            }`}>
              <div className="flex items-start gap-2">
                <Info size={14} className={`mt-0.5 flex-shrink-0 ${
                  pct === 100 ? 'text-green-600' : pct > 0 ? 'text-yellow-600' : 'text-red-600'
                }`} />
                <div>
                  <p className={`text-sm font-semibold ${
                    pct === 100 ? 'text-green-800' : pct > 0 ? 'text-yellow-800' : 'text-red-800'
                  }`}>{policy.policy?.label}</p>
                  <p className={`text-xs mt-0.5 ${
                    pct === 100 ? 'text-green-700' : pct > 0 ? 'text-yellow-700' : 'text-red-700'
                  }`}>
                    {policy.refundAmount > 0
                      ? `You will receive ₦${policy.refundAmount?.toLocaleString()} back within 3–5 business days`
                      : 'No refund applies for this cancellation'}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Policy table */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-600 mb-2">Cancellation Policy</p>
            <div className="space-y-1.5 text-xs">
              {[
                { label: '7+ days notice', value: '100% refund', color: 'text-green-600' },
                { label: '3–6 days notice', value: '50% refund', color: 'text-yellow-600' },
                { label: '1–2 days notice', value: '25% refund', color: 'text-orange-600' },
                { label: 'Same day or later', value: 'No refund', color: 'text-red-600' },
              ].map(row => (
                <div key={row.label} className="flex justify-between">
                  <span className="text-gray-500">{row.label}</span>
                  <span className={`font-medium ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reason (optional)</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
              placeholder="Let the owner know why you're cancelling..."
              className="input-field text-sm resize-none" />
          </div>
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 btn-secondary py-2.5 text-sm">Keep Booking</button>
          <button onClick={handleCancel} disabled={cancelling}
            className="flex-1 py-2.5 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-60">
            {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Booking Card ───────────────────────────────────────────────────────────────
function BookingCard({ booking, onUpdate, reviewedIds, setReviewedIds, onCancel }) {
  const [expanded, setExpanded] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const daysUntilStart = Math.ceil((new Date(booking.startDate) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div className="card p-4">
      {/* Tool header */}
      <div className="flex gap-3 mb-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-earth-100">
          <img
            src={getImgUrl(booking.toolId?.images?.[0])}
            className="w-full h-full object-cover"
            onError={e => { e.target.src = PLACEHOLDER; }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-900 truncate">{booking.toolId?.name}</h3>
            <span className={`badge text-xs flex-shrink-0 ${STATUS_STYLES[booking.status]}`}>
              {booking.status}
            </span>
          </div>
          {booking.toolId?.location && (
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
              <MapPin size={11} /> {booking.toolId.location}
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
            <Calendar size={11} /> {fmt(booking.startDate)} → {fmt(booking.endDate)}
          </div>
          <p className="text-brand-600 font-bold text-sm mt-1">
            ₦{booking.totalAmount?.toLocaleString()}
            {booking.deposit?.amount > 0 && (
              <span className="text-gray-400 font-normal text-xs ml-2">
                + ₦{booking.deposit.amount.toLocaleString()} deposit
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Status-specific banners */}

      {/* Pending — waiting on owner */}
      {booking.status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 mb-3 flex items-start gap-2">
          <Clock size={13} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-yellow-800">Awaiting owner approval</p>
            <p className="text-xs text-yellow-700 mt-0.5">You'll be notified once the owner responds. Request expires in 48 hours.</p>
          </div>
        </div>
      )}

      {/* Approved + deposit not paid */}
      {booking.status === 'approved' && booking.deposit?.amount > 0 && !booking.deposit?.paid && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-3 flex items-start gap-2">
          <Banknote size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-800">Security Deposit Required</p>
            <p className="text-xs text-amber-700 mt-0.5">
              A refundable deposit of <strong>₦{booking.deposit.amount.toLocaleString()}</strong> confirms your booking.
              It will be refunded when the tool is returned.
            </p>
          </div>
        </div>
      )}

      {/* Approved + upcoming */}
      {booking.status === 'approved' && daysUntilStart > 0 && booking.paymentStatus !== 'unpaid' && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-3 flex items-start gap-2">
          <Info size={13} className="text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-green-800">
              Rental starts in {daysUntilStart} day{daysUntilStart !== 1 ? 's' : ''}
            </p>
            {booking.ownerId?.phone && (
              <p className="text-xs text-green-700 mt-0.5">Arrange pickup with the owner.</p>
            )}
          </div>
        </div>
      )}

      {/* Refund processing */}
      {['cancelled', 'rejected'].includes(booking.status) && booking.refund?.amount > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3 flex items-start gap-2">
          <Banknote size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-blue-800">Refund Processing</p>
            <p className="text-xs text-blue-700 mt-0.5">
              ₦{booking.refund.amount.toLocaleString()} will be refunded within 3–5 business days.
            </p>
          </div>
        </div>
      )}

      {/* Deposit refund on completion */}
      {booking.status === 'completed' && booking.deposit?.refunded && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-3 flex items-start gap-2">
          <Banknote size={13} className="text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-green-800">Deposit Refunded</p>
            <p className="text-xs text-green-700 mt-0.5">
              ₦{booking.deposit.amount.toLocaleString()} security deposit was refunded to you.
            </p>
          </div>
        </div>
      )}

      {/* Cancellation details */}
      {booking.status === 'cancelled' && booking.cancellation?.cancelledAt && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-3">
          <p className="text-xs text-gray-600">
            Cancelled by <strong>{booking.cancellation.cancelledByRole}</strong> on {fmt(booking.cancellation.cancelledAt)}
            {booking.cancellation.reason && ` · "${booking.cancellation.reason}"`}
          </p>
          {booking.cancellation.policy && (
            <p className="text-xs text-gray-400 mt-0.5">Policy applied: {booking.cancellation.policy}</p>
          )}
        </div>
      )}

      {/* Owner contact */}
      {booking.status === 'approved' && booking.ownerId?.phone && booking.paymentStatus !== 'unpaid' && (
        <div className="bg-gray-50 rounded-xl p-3 mb-3 flex items-center gap-2">
          <Phone size={13} className="text-gray-400" />
          <p className="text-sm text-gray-600">
            Owner: <strong>{booking.ownerId?.name}</strong> · {booking.ownerId?.phone}
          </p>
        </div>
      )}

      {/* Expand for booking details */}
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-gray-600 py-1 transition-colors mb-2">
        {expanded ? <><ChevronUp size={12} /> Less</> : <><ChevronDown size={12} /> Booking details</>}
      </button>

      {expanded && (
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div className="bg-gray-50 rounded-lg p-2.5">
            <p className="text-gray-400 mb-0.5">Booking ID</p>
            <p className="font-mono text-gray-600">{booking._id?.slice(-8).toUpperCase()}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5">
            <p className="text-gray-400 mb-0.5">Booked on</p>
            <p className="text-gray-600">{fmt(booking.createdAt)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5">
            <p className="text-gray-400 mb-0.5">Deposit</p>
            <p className="text-gray-600">
              {booking.deposit?.paid
                ? `₦${booking.deposit.amount.toLocaleString()} ✓`
                : booking.deposit?.amount > 0
                  ? `₦${booking.deposit.amount.toLocaleString()} (unpaid)`
                  : 'None'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5">
            <p className="text-gray-400 mb-0.5">Payment</p>
            <p className="text-gray-600 capitalize">{booking.paymentStatus?.replace(/_/g, ' ')}</p>
          </div>
        </div>
      )}

      {/* Pay button */}
      {booking.status === 'approved' && booking.paymentStatus === 'unpaid' && (
        <Link to={`/bookings/${booking._id}/pay`}
          className="btn-primary w-full text-center py-2.5 text-sm mb-2 block">
          Pay Now — ₦{booking.totalAmount?.toLocaleString()} →
        </Link>
      )}

      {/* Escrow */}
      {['paid', 'partially_released', 'fully_released'].includes(booking.paymentStatus) && (
        <div className="space-y-2 mb-2">
          <EscrowStatus booking={booking} />
          <EscrowActions booking={booking} onUpdate={onUpdate} />
        </div>
      )}

      {/* Cancel button */}
      {['pending', 'approved'].includes(booking.status) && booking.paymentStatus !== 'paid' && (
        <button onClick={() => onCancel(booking)}
          className="w-full py-2.5 text-sm font-medium text-red-500 border border-red-100 hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2 mt-1">
          <X size={13} /> Cancel Booking
        </button>
      )}

      {/* Rejected */}
      {booking.status === 'rejected' && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 mt-1">
          <p className="text-xs text-red-600">
            Booking was declined.{' '}
            <Link to="/tools" className="underline font-medium">Browse other tools →</Link>
          </p>
        </div>
      )}

      {/* Review */}
      {booking.status === 'completed' && (
        <div className="mt-2">
          {reviewedIds.has(booking._id) ? (
            <div className="bg-green-50 border border-green-100 rounded-xl p-2.5 text-center">
              <p className="text-xs text-green-700">✅ Review submitted. Thank you!</p>
            </div>
          ) : showReview ? (
            <ReviewForm booking={booking} onSubmitted={() => {
              setReviewedIds(prev => new Set([...prev, booking._id]));
              setShowReview(false);
            }} />
          ) : (
            <button onClick={() => setShowReview(true)}
              className="w-full py-2.5 text-sm font-medium bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-xl transition-colors flex items-center justify-center gap-2">
              ⭐ Leave a Review
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function MyBookings() {
  const location                        = useLocation();
  const navigate                        = useNavigate();
  const [bookings, setBookings]         = useState([]);
  const [reviewedIds, setReviewedIds]   = useState(new Set());
  const [cancelModal, setCancelModal]   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('all');
  const [paymentVerifying, setPaymentVerifying] = useState(false);

  // Handle Paystack redirect: /bookings?payment=success&ref=TSA-XXXX
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('payment');
    const ref = params.get('ref');
    if (paymentStatus === 'success' && ref) {
      setPaymentVerifying(true);
      api.post('/payments/verify', { reference: ref })
        .then(() => {
          toast.success('🎉 Payment successful! Your booking is confirmed.');
          navigate('/bookings', { replace: true });
        })
        .catch(() => {
          toast.error('Payment verification failed. Please contact support.');
          navigate('/bookings', { replace: true });
        })
        .finally(() => setPaymentVerifying(false));
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/bookings/my-bookings');
        setBookings(data.bookings);
        const completed = data.bookings.filter(b => b.status === 'completed');
        const reviewed  = new Set();
        await Promise.all(completed.map(async (b) => {
          try {
            const r = await api.get(`/reviews/booking/${b._id}`);
            if (r.data.reviews?.length > 0) reviewed.add(b._id);
          } catch {}
        }));
        setReviewedIds(reviewed);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const handleUpdate    = (updated) => setBookings(prev => prev.map(b => b._id === updated._id ? updated : b));
  const handleCancelled = (updated) => setBookings(prev => prev.map(b => b._id === updated._id ? updated : b));

  const counts   = bookings.reduce((acc, b) => { acc[b.status] = (acc[b.status] || 0) + 1; return acc; }, {});
  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);
  const pending  = bookings.filter(b => b.status === 'pending').length;
  const approved = bookings.filter(b => b.status === 'approved').length;

  if (paymentVerifying) return (
    <div className="py-20 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      <p className="text-gray-600 font-medium">Verifying your payment...</p>
      <p className="text-sm text-gray-400">Please wait, do not refresh</p>
    </div>
  );

  if (loading) return (
    <div className="py-8 page-container max-w-3xl">
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="py-6 animate-fade-in">
      <div className="page-container max-w-3xl px-4 sm:px-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="section-title">My Bookings</h1>
            <p className="text-sm text-gray-400 mt-1">{bookings.length} total booking{bookings.length !== 1 ? 's' : ''}</p>
          </div>
          <Link to="/tools" className="btn-secondary text-sm py-2 px-4">Browse More</Link>
        </div>

        {/* Summary cards */}
        {bookings.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Pending', count: pending, color: 'bg-yellow-50 text-yellow-700', icon: '⏳' },
              { label: 'Active', count: approved, color: 'bg-green-50 text-green-700', icon: '✅' },
              { label: 'Completed', count: counts.completed || 0, color: 'bg-blue-50 text-blue-700', icon: '🏁' },
            ].map(({ label, count, color, icon }) => (
              <div key={label} className={`rounded-2xl p-3 text-center ${color}`}>
                <div className="text-xl mb-0.5">{icon}</div>
                <div className="text-xl font-bold">{count}</div>
                <div className="text-xs font-medium opacity-80">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        {bookings.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-5">
            {['all', 'pending', 'approved', 'completed', 'cancelled', 'rejected'].map(s => {
              const count = s === 'all' ? bookings.length : (counts[s] || 0);
              if (s !== 'all' && !count) return null;
              return (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
                    filter === s ? 'bg-brand-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {s} <span className="opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">📋</div>
            <p className="text-gray-500 mb-4">{filter === 'all' ? 'No bookings yet' : `No ${filter} bookings`}</p>
            <Link to="/tools" className="btn-primary">Browse Tools →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(booking => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onUpdate={handleUpdate}
                reviewedIds={reviewedIds}
                setReviewedIds={setReviewedIds}
                onCancel={setCancelModal}
              />
            ))}
          </div>
        )}

        <div className="h-8" />
      </div>

      {cancelModal && (
        <CancelModal
          booking={cancelModal}
          onClose={() => setCancelModal(null)}
          onCancelled={handleCancelled}
        />
      )}
    </div>
  );
}