import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Calendar, MapPin, Shield, ArrowLeft, CreditCard, Lock, CheckCircle } from 'lucide-react';

import { getImgUrl, PLACEHOLDER } from '../utils/imgUrl';

const fmt         = (d) => new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

export default function PaymentPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [booking, setBooking]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [paying, setPaying]     = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/bookings/${id}`);
        const b = data.booking;

        // Guard: must be approved and unpaid
        if (b.status !== 'approved') {
          setError(`This booking is "${b.status}" — only approved bookings can be paid.`);
        } else if (b.paymentStatus === 'paid') {
          setError('This booking has already been paid.');
        }

        setBooking(b);
      } catch (err) {
        const msg = err.response?.data?.message || '';
        if (err.response?.status === 404) {
          setError('Booking not found. It may have expired or been deleted.');
        } else if (err.response?.status === 403) {
          setError('You are not authorized to view this booking.');
        } else {
          setError(msg || 'Failed to load booking. Please go back and try again.');
        }
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handlePay = async () => {
    setPaying(true);
    try {
      const { data } = await api.post('/payments/initiate', { bookingId: id });
      // Redirect to Paystack checkout — they redirect back to /bookings?payment=success
      window.location.href = data.data.authorizationUrl;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment. Try again.');
      setPaying(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="py-8 page-container max-w-lg">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-100 rounded w-32" />
        <div className="h-48 bg-gray-100 rounded-2xl" />
        <div className="h-32 bg-gray-100 rounded-2xl" />
        <div className="h-12 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );

  // ── Error / Guard ──────────────────────────────────────────────────────────
  if (error) return (
    <div className="py-8 page-container max-w-lg">
      <div className="card p-8 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="font-bold text-gray-900 text-lg mb-2">Cannot Process Payment</h2>
        <p className="text-gray-500 text-sm mb-6">{error}</p>
        <Link to="/bookings" className="btn-primary">← Back to My Bookings</Link>
      </div>
    </div>
  );

  const tool       = booking.toolId;
  const days       = Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24));
  const platformFee = Math.round(booking.totalAmount * 0.10);

  return (
    <div className="py-6 animate-fade-in">
      <div className="page-container max-w-lg px-4 sm:px-6">

        {/* Back link */}
        <Link to="/bookings" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-5 transition-colors">
          <ArrowLeft size={15} /> Back to bookings
        </Link>

        <h1 className="text-xl font-bold text-gray-900 mb-5">Complete Payment</h1>

        {/* Tool summary card */}
        <div className="card p-4 mb-4">
          <div className="flex gap-3">
            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-earth-100">
              <img
                src={getImgUrl(tool?.images?.[0])}
                className="w-full h-full object-cover"
                onError={e => { e.target.src = PLACEHOLDER; }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 truncate">{tool?.name}</h2>
              {tool?.location && (
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                  <MapPin size={11} /> {tool.location}
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                <Calendar size={11} /> {fmt(booking.startDate)} → {fmt(booking.endDate)}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{days} day{days !== 1 ? 's' : ''} · ₦{tool?.pricePerDay?.toLocaleString()}/day</p>
            </div>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="card p-4 mb-4">
          <h3 className="font-semibold text-gray-800 text-sm mb-3">Payment Summary</h3>
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Rental ({days} day{days !== 1 ? 's' : ''} × ₦{tool?.pricePerDay?.toLocaleString()})</span>
              <span className="text-gray-800">₦{booking.totalAmount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Platform fee (10%)</span>
              <span className="text-gray-800">₦{platformFee.toLocaleString()}</span>
            </div>
            {booking.deposit?.amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1">
                  Security deposit
                  <span className="text-xs text-green-600">(refundable)</span>
                </span>
                <span className="text-gray-800">₦{booking.deposit.amount.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-2.5 flex justify-between font-bold">
              <span className="text-gray-900">Total Due</span>
              <span className="text-brand-600 text-lg">
                ₦{(booking.totalAmount + (booking.deposit?.amount || 0)).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Deposit info */}
        {booking.deposit?.amount > 0 && (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-4 flex items-start gap-3">
            <Shield size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">Refundable Security Deposit</p>
              <p className="text-xs text-green-700 mt-0.5 leading-relaxed">
                ₦{booking.deposit.amount.toLocaleString()} is held as a security deposit and will be fully refunded to you once the tool is returned in good condition.
              </p>
            </div>
          </div>
        )}

        {/* Owner info */}
        {booking.ownerId?.name && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-5">
            <p className="text-xs text-gray-400 mb-1">Renting from</p>
            <p className="text-sm font-semibold text-gray-800">{booking.ownerId.name}</p>
            {booking.ownerId.phone && (
              <p className="text-xs text-gray-500 mt-0.5">📞 {booking.ownerId.phone}</p>
            )}
          </div>
        )}

        {/* Security note */}
        <div className="flex items-center gap-2 mb-5 justify-center">
          <Lock size={13} className="text-gray-400" />
          <p className="text-xs text-gray-400">Secured by Paystack · 256-bit SSL encryption</p>
        </div>

        {/* Pay button */}
        <button
          onClick={handlePay}
          disabled={paying}
          className="w-full btn-primary py-4 text-base font-bold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {paying ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Redirecting to Paystack...
            </>
          ) : (
            <>
              <CreditCard size={18} />
              Pay ₦{(booking.totalAmount + (booking.deposit?.amount || 0)).toLocaleString()} Securely
            </>
          )}
        </button>

        {/* Cancellation note */}
        <div className="mt-4 bg-gray-50 border border-gray-100 rounded-xl p-3">
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            By paying, you agree to our{' '}
            <Link to="/terms" className="underline">terms</Link>.
            Cancellation refunds: 100% (7+ days), 50% (3–6 days), 25% (1–2 days), 0% (same day).
          </p>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}