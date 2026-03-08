import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import EscrowStatus from '../components/escrow/EscrowStatus';
import EscrowActions from '../components/escrow/EscrowActions';
import ReviewForm from '../components/reviews/ReviewForm';
import {
  Calendar, User, Phone, Mail, CheckCircle, XCircle,
  Package, Clock, AlertTriangle, Info, X, ChevronDown, ChevronUp,
  Banknote, RotateCcw
} from 'lucide-react';

const fmt  = (d) => new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtT = (d) => new Date(d).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const STATUS_STYLES = {
  pending:   'bg-yellow-50 text-yellow-700 border-yellow-100',
  approved:  'bg-green-50 text-green-700 border-green-100',
  rejected:  'bg-red-50 text-red-700 border-red-100',
  completed: 'bg-blue-50 text-blue-700 border-blue-100',
  cancelled: 'bg-gray-50 text-gray-500 border-gray-100',
  disputed:  'bg-orange-50 text-orange-700 border-orange-100',
};

const PAYMENT_STYLES = {
  unpaid:            'bg-gray-50 text-gray-500 border-gray-100',
  paid:              'bg-brand-50 text-brand-700 border-brand-100',
  partially_released:'bg-blue-50 text-blue-700 border-blue-100',
  fully_released:    'bg-green-50 text-green-700 border-green-100',
  refunded:          'bg-purple-50 text-purple-700 border-purple-100',
  refund_pending:    'bg-yellow-50 text-yellow-700 border-yellow-100',
};

// ── Return Confirmation Modal ──────────────────────────────────────────────────
function ReturnModal({ booking, onClose, onCompleted }) {
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const { data } = await api.put(`/bookings/${booking._id}/complete`);
      toast.success('Return confirmed! Deposit refund initiated.');
      onCompleted(data.booking);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm return.');
    }
    setConfirming(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
              <RotateCcw size={18} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Confirm Tool Return</h3>
              <p className="text-xs text-gray-400">{booking.toolId?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <p className="text-sm font-semibold text-green-800 mb-1">✅ Confirm you have received your tool back</p>
            <p className="text-xs text-green-700 leading-relaxed">
              By confirming, you declare the tool has been returned. This will mark the booking as complete and
              {booking.deposit?.amount > 0 && booking.deposit?.paid
                ? ` initiate a deposit refund of ₦${booking.deposit.amount.toLocaleString()} to the renter.`
                : ' close the booking.'}
            </p>
          </div>

          {booking.deposit?.paid && booking.deposit?.amount > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
              <Banknote size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                <strong>₦{booking.deposit.amount.toLocaleString()}</strong> security deposit will be automatically refunded to {booking.renterId?.name} within 3–5 business days.
              </p>
            </div>
          )}

          <p className="text-xs text-gray-400 text-center">
            ⚠️ Only confirm once the tool is physically back in your possession and in acceptable condition.
          </p>
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 btn-secondary py-2.5 text-sm">
            Not Yet
          </button>
          <button onClick={handleConfirm} disabled={confirming}
            className="flex-1 py-2.5 text-sm font-semibold bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors disabled:opacity-60">
            {confirming ? 'Confirming...' : '✅ Confirm Return'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reject Modal ───────────────────────────────────────────────────────────────
function RejectModal({ booking, onClose, onRejected }) {
  const [reason, setReason]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    setLoading(true);
    try {
      const { data } = await api.put(`/bookings/${booking._id}/reject`, { reason });
      toast.success('Booking rejected.');
      onRejected(data.booking);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject booking.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
              <XCircle size={18} className="text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Reject Booking</h3>
              <p className="text-xs text-gray-400">{booking.renterId?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-red-50 border border-red-100 rounded-xl p-3">
            <p className="text-xs text-red-700">
              The renter will be notified.
              {booking.deposit?.paid && ` Their deposit of ₦${booking.deposit.amount.toLocaleString()} will be automatically refunded.`}
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reason (optional)</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
              placeholder="Let the renter know why you're rejecting..."
              className="input-field text-sm resize-none" />
          </div>
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 btn-secondary py-2.5 text-sm">Cancel</button>
          <button onClick={handleReject} disabled={loading}
            className="flex-1 py-2.5 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-60">
            {loading ? 'Rejecting...' : 'Reject Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Booking Card ───────────────────────────────────────────────────────────────
function BookingCard({ booking, onUpdate, reviewedIds, setReviewedIds }) {
  const [expanded, setExpanded]         = useState(false);
  const [showReturn, setShowReturn]     = useState(false);
  const [showReject, setShowReject]     = useState(false);
  const [showReview, setShowReview]     = useState(false);
  const [showNonReturn, setShowNonReturn] = useState(false);
  const [processing, setProcessing]     = useState(false);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const { data } = await api.put(`/bookings/${booking._id}/approve`);
      toast.success('Booking approved! Renter has been notified.');
      onUpdate(data.booking);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve.');
    }
    setProcessing(false);
  };

  const daysUntilStart = Math.ceil((new Date(booking.startDate) - new Date()) / (1000 * 60 * 60 * 24));
  const isOverdue = booking.status === 'approved' && new Date(booking.endDate) < new Date();

  return (
    <>
      <div className={`card overflow-hidden transition-all ${isOverdue ? 'ring-2 ring-orange-200' : ''}`}>

        {/* Overdue banner */}
        {isOverdue && (
          <div className="bg-orange-50 border-b border-orange-100 px-4 py-2 flex items-center gap-2">
            <AlertTriangle size={14} className="text-orange-500" />
            <p className="text-xs font-semibold text-orange-700">Return overdue — please confirm the tool was returned</p>
          </div>
        )}

        <div className="p-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 truncate">{booking.toolId?.name}</h3>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className={`badge text-xs ${STATUS_STYLES[booking.status]}`}>
                  {booking.status}
                </span>
                {booking.paymentStatus !== 'unpaid' && (
                  <span className={`badge text-xs ${PAYMENT_STYLES[booking.paymentStatus]}`}>
                    {booking.paymentStatus.replace(/_/g, ' ')}
                  </span>
                )}
                {booking.deposit?.paid && (
                  <span className="badge text-xs bg-purple-50 text-purple-700 border-purple-100">
                    deposit paid
                  </span>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-brand-600 font-bold text-lg">₦{booking.totalAmount?.toLocaleString()}</p>
              {booking.deposit?.amount > 0 && (
                <p className="text-xs text-gray-400">+₦{booking.deposit.amount.toLocaleString()} deposit</p>
              )}
            </div>
          </div>

          {/* Renter + dates */}
          <div className="bg-gray-50 rounded-xl p-3 mb-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <User size={13} className="text-gray-400 flex-shrink-0" />
              <p className="text-sm text-gray-700 font-medium">{booking.renterId?.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={13} className="text-gray-400 flex-shrink-0" />
              <p className="text-xs text-gray-500">{booking.renterId?.email}</p>
            </div>
            {booking.renterId?.phone && (
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-gray-400 flex-shrink-0" />
                <p className="text-xs text-gray-500">{booking.renterId?.phone}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar size={13} className="text-gray-400 flex-shrink-0" />
              <p className="text-xs text-gray-500">{fmt(booking.startDate)} → {fmt(booking.endDate)}</p>
            </div>
            {booking.notes && (
              <p className="text-xs text-gray-400 italic pl-5">"{booking.notes}"</p>
            )}
          </div>

          {/* Countdown for pending */}
          {booking.status === 'pending' && booking.expiresAt && (
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-100 rounded-xl p-2.5 mb-3">
              <Clock size={13} className="text-yellow-600 flex-shrink-0" />
              <p className="text-xs text-yellow-700">
                <strong>Response deadline:</strong> {fmtT(booking.expiresAt)} — booking auto-expires if not actioned
              </p>
            </div>
          )}

          {/* Upcoming rental info */}
          {booking.status === 'approved' && daysUntilStart > 0 && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl p-2.5 mb-3">
              <Info size={13} className="text-green-600 flex-shrink-0" />
              <p className="text-xs text-green-700">
                Rental starts in <strong>{daysUntilStart} day{daysUntilStart !== 1 ? 's' : ''}</strong> — prepare for handover
              </p>
            </div>
          )}

          {/* Cancellation info */}
          {booking.status === 'cancelled' && booking.cancellation?.cancelledAt && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-3">
              <p className="text-xs font-semibold text-gray-600 mb-1">Cancellation Details</p>
              <p className="text-xs text-gray-500">
                Cancelled by <strong>{booking.cancellation.cancelledByRole}</strong> on {fmt(booking.cancellation.cancelledAt)}
              </p>
              {booking.cancellation.reason && (
                <p className="text-xs text-gray-400 mt-0.5">Reason: "{booking.cancellation.reason}"</p>
              )}
              {booking.refund?.amount > 0 && (
                <p className="text-xs text-blue-600 mt-1 font-medium">
                  ₦{booking.refund.amount.toLocaleString()} refund processing to renter
                </p>
              )}
            </div>
          )}

          {/* Escrow */}
          {['paid', 'partially_released', 'fully_released'].includes(booking.paymentStatus) && (
            <div className="space-y-2 mb-3">
              <EscrowStatus booking={booking} />
              <EscrowActions booking={booking} onUpdate={onUpdate} />
            </div>
          )}

          {/* Expand for more details */}
          <button onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-gray-600 py-1 transition-colors">
            {expanded ? <><ChevronUp size={13} /> Less details</> : <><ChevronDown size={13} /> More details</>}
          </button>

          {expanded && (
            <div className="mt-3 pt-3 border-t border-gray-50 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-gray-400 mb-0.5">Booking ID</p>
                  <p className="font-mono text-gray-600 text-xs">{booking._id?.slice(-8).toUpperCase()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-gray-400 mb-0.5">Created</p>
                  <p className="text-gray-600">{fmt(booking.createdAt)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-gray-400 mb-0.5">Deposit</p>
                  <p className="text-gray-600">
                    {booking.deposit?.paid
                      ? `₦${booking.deposit.amount.toLocaleString()} paid`
                      : booking.deposit?.amount > 0
                        ? `₦${booking.deposit.amount.toLocaleString()} unpaid`
                        : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-gray-400 mb-0.5">Payment</p>
                  <p className="text-gray-600 capitalize">{booking.paymentStatus?.replace(/_/g, ' ')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-3 space-y-2">

            {/* Pending — approve / reject */}
            {booking.status === 'pending' && (
              <div className="flex gap-2">
                <button onClick={() => setShowReject(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-red-500 border border-red-200 hover:bg-red-50 rounded-xl transition-colors">
                  <XCircle size={14} /> Reject
                </button>
                <button onClick={handleApprove} disabled={processing}
                  className="flex-1 btn-primary py-2.5 text-sm flex items-center justify-center gap-1.5 disabled:opacity-60">
                  <CheckCircle size={14} /> {processing ? 'Approving...' : 'Approve'}
                </button>
              </div>
            )}

            {/* Approved + rental ended — confirm return */}
            {booking.status === 'approved' && !booking.escrow?.ownerConfirmedReturn && (
              <button onClick={() => setShowReturn(true)}
                className={`w-full py-2.5 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                  isOverdue
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
                }`}>
                <RotateCcw size={14} />
                {isOverdue ? '⚠️ Confirm Return (Overdue)' : 'Confirm Tool Returned'}
              </button>
            )}

            {/* Tool not returned at all — report non-return */}
            {booking.status === 'approved' && isOverdue && !booking.dispute?.active && (
              <button onClick={() => setShowNonReturn(true)}
                className="w-full py-2.5 text-sm font-semibold rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors flex items-center justify-center gap-2 mt-1">
                🚨 Tool Not Returned — Report
              </button>
            )}

            {/* Disputed */}
            {booking.status === 'disputed' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                <p className="text-xs text-red-700 font-semibold">🚨 Non-return dispute active — Admin has been notified</p>
                <p className="text-xs text-red-500 mt-1">Renter's deposit has been forfeited</p>
              </div>
            )}

            {/* Completed + return confirmed */}
            {booking.status === 'completed' && booking.escrow?.ownerConfirmedReturn && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                <p className="text-xs text-green-700 font-medium">
                  ✅ Return confirmed on {fmt(booking.escrow.ownerConfirmedReturnAt)}
                  {booking.deposit?.refunded && ` · Deposit refunded to renter`}
                </p>
              </div>
            )}

            {/* Review */}
            {booking.status === 'completed' && (
              <div className="mt-2">
                {reviewedIds.has(booking._id) ? (
                  <div className="bg-green-50 border border-green-100 rounded-xl p-2.5 text-center">
                    <p className="text-xs text-green-700">✅ Review submitted</p>
                  </div>
                ) : showReview ? (
                  <ReviewForm booking={booking} onSubmitted={() => {
                    setReviewedIds(prev => new Set([...prev, booking._id]));
                    setShowReview(false);
                  }} />
                ) : (
                  <button onClick={() => setShowReview(true)}
                    className="w-full py-2.5 text-sm font-medium bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-xl transition-colors flex items-center justify-center gap-2">
                    ⭐ Review This Renter
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showReturn && (
        <ReturnModal booking={booking} onClose={() => setShowReturn(false)}
          onCompleted={onUpdate} />
      )}
      {showReject && (
        <RejectModal booking={booking} onClose={() => setShowReject(false)}
          onRejected={onUpdate} />
      )}
      {showNonReturn && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-slide-up">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">🚨</span>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Report Tool Not Returned</h3>
            <p className="text-sm text-gray-500 mb-4">
              Only use this if the renter has <strong>not returned the tool</strong> and is not responding.
              This will <strong className="text-red-600">forfeit their security deposit</strong> and alert the admin team.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 text-sm text-red-700">
              <p className="font-semibold mb-1">This will:</p>
              <p>• Mark the booking as disputed</p>
              <p>• Forfeit the renter's ₦{booking.deposit?.amount?.toLocaleString() || 0} deposit</p>
              <p>• Notify the renter by email + SMS</p>
              <p>• Alert the admin team immediately</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowNonReturn(false)} className="btn-secondary flex-1">Cancel</button>
              <button
                disabled={processing}
                onClick={async () => {
                  setProcessing(true);
                  try {
                    await api.put(`/bookings/${booking._id}/non-return`);
                    toast.success('Non-return reported. Admin notified, deposit forfeited.');
                    setShowNonReturn(false);
                    onUpdate();
                  } catch (err) {
                    toast.error(err.response?.data?.message || 'Failed to report');
                  }
                  setProcessing(false);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-3 rounded-xl transition-colors disabled:opacity-50">
                {processing ? 'Reporting...' : '🚨 Confirm Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function OwnerBookings() {
  const [bookings, setBookings]       = useState([]);
  const [reviewedIds, setReviewedIds] = useState(new Set());
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/bookings/owner-bookings');
        setBookings(data.bookings);
        const completed = data.bookings.filter(b => b.status === 'completed');
        const reviewed  = new Set();
        await Promise.all(completed.map(async (b) => {
          try {
            const r = await api.get(`/reviews/booking/${b._id}`);
            if (r.data.reviews?.length >= 2) reviewed.add(b._id);
          } catch {}
        }));
        setReviewedIds(reviewed);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const handleUpdate = (updated) => {
    setBookings(prev => prev.map(b => b._id === updated._id ? updated : b));
  };

  const counts  = bookings.reduce((acc, b) => { acc[b.status] = (acc[b.status] || 0) + 1; return acc; }, {});
  const pending = bookings.filter(b => b.status === 'pending').length;
  const overdue = bookings.filter(b => b.status === 'approved' && new Date(b.endDate) < new Date()).length;
  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

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
        <div className="mb-6">
          <h1 className="section-title">Booking Requests</h1>
          <p className="text-sm text-gray-400 mt-1">{bookings.length} total booking{bookings.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Alert banners */}
        {pending > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock size={16} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-yellow-800">
                {pending} pending request{pending > 1 ? 's' : ''} awaiting your response
              </p>
              <p className="text-xs text-yellow-600 mt-0.5">Requests expire after 48 hours if not actioned</p>
            </div>
          </div>
        )}

        {overdue > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={16} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-orange-800">
                {overdue} rental{overdue > 1 ? 's' : ''} past end date — confirm tool returned
              </p>
              <p className="text-xs text-orange-600 mt-0.5">Renter's deposit is held until you confirm return</p>
            </div>
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

        {/* Booking list */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">
              {filter === 'pending' ? '⏳' : filter === 'completed' ? '🏁' : '📬'}
            </div>
            <p className="text-gray-500">
              {filter === 'all' ? 'No booking requests yet' : `No ${filter} bookings`}
            </p>
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
              />
            ))}
          </div>
        )}

        {/* Policy info */}
        <div className="mt-8 bg-gray-50 border border-gray-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
            <Info size={12} /> Platform Policies
          </p>
          <div className="space-y-1 text-xs text-gray-500">
            <p>• Renter cancels 7+ days before → <strong>full refund</strong></p>
            <p>• Renter cancels 3–6 days before → <strong>50% refund</strong></p>
            <p>• Renter cancels 1–2 days before → <strong>25% refund</strong></p>
            <p>• Renter cancels same day → <strong>no refund</strong></p>
            <p>• You reject or cancel → <strong>full refund to renter always</strong></p>
            <p>• Security deposit refunded when you confirm tool returned</p>
          </div>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}