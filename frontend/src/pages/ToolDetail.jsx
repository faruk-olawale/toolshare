import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MapPin, Phone, Mail, Calendar, AlertCircle, ChevronLeft, CheckCircle, MessageSquare } from 'lucide-react';
import StarRating from '../components/reviews/StarRating';
import ReviewList from '../components/reviews/ReviewList';
import AvailabilityCalendar from '../components/tools/AvailabilityCalendar';
import { getImgUrl, PLACEHOLDER } from '../utils/imgUrl';

// ── Booking confirmation modal ────────────────────────────────────────────────
function ConfirmModal({ tool, booking, totalDays, totalCost, onConfirm, onClose, submitting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg">Confirm Booking Request</h3>
          <p className="text-sm text-gray-500 mt-1">Review your request before sending</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-[#d4eadd] rounded-xl overflow-hidden flex-shrink-0">
              <img src={getImgUrl(tool.images?.[0])} className="w-full h-full object-cover" onError={e => e.target.src = PLACEHOLDER} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{tool.name}</p>
              <p className="text-sm text-gray-500">{tool.location}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Start date</span>
              <span className="font-medium">{new Date(booking.startDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">End date</span>
              <span className="font-medium">{new Date(booking.endDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Duration</span>
              <span className="font-medium">{totalDays} day{totalDays !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
              <span className="font-semibold text-gray-900">Estimated total</span>
              <span className="font-bold text-[#1a5c3a]">₦{totalCost.toLocaleString()}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400">Payment is only required after the owner approves your request.</p>
        </div>
        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
          <button onClick={onConfirm} disabled={submitting} className="flex-1 btn-primary">
            {submitting ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ToolDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tool, setTool]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [activeImg, setActiveImg]     = useState(0);
  const [booking, setBooking]         = useState({ startDate: '', endDate: '', notes: '' });
  const [submitting, setSubmitting]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [reviews, setReviews]         = useState([]);
  const [avgRating, setAvgRating]     = useState(null);
  const [kycStatus, setKycStatus]     = useState(null);
  const [bookedRanges, setBookedRanges] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    api.get(`/tools/${id}`)
      .then(({ data }) => setTool(data.tool))
      .catch(() => toast.error('Tool not found.'))
      .finally(() => setLoading(false));
    api.get(`/bookings/tool-bookings/${id}`)
      .then(({ data }) => setBookedRanges(data.bookings || []))
      .catch(() => {});
    api.get(`/reviews/tool/${id}`)
      .then(({ data }) => { setReviews(data.reviews || []); setAvgRating(data.averageRating); })
      .catch(() => {});
    if (user) {
      api.get('/kyc/status').then(({ data }) => setKycStatus(data.kyc?.status)).catch(() => {});
    }
  }, [id, user]);

  const totalDays = booking.startDate && booking.endDate
    ? Math.max(0, Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24)))
    : 0;
  const totalCost = totalDays * (tool?.pricePerDay || 0);

  const handleBookClick = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to book this tool.');
      return navigate('/login');
    }
    if (user.role !== 'renter') return toast.error('Only renters can book tools.');
    if (kycStatus !== 'approved') {
      toast.error('Complete identity verification (KYC) before booking.');
      return navigate('/kyc');
    }
    if (!booking.startDate || !booking.endDate) return toast.error('Please select both start and end dates.');
    if (totalDays <= 0) return toast.error('End date must be after start date.');
    setShowConfirm(true);
  };

  const handleBookConfirm = async () => {
    setSubmitting(true);
    try {
      await api.post('/bookings', { toolId: id, ...booking });
      toast.success('Booking request sent! The owner will respond soon. 📩');
      setShowConfirm(false);
      navigate('/bookings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="py-8 page-container">
      <div className="animate-pulse space-y-6">
        <div className="h-96 bg-gray-100 rounded-2xl" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    </div>
  );

  if (!tool) return (
    <div className="py-20 text-center">
      <h2 className="text-2xl font-display font-bold text-gray-800 mb-3">Tool Not Found</h2>
      <Link to="/tools" className="btn-primary">Browse Other Tools</Link>
    </div>
  );

  const images = tool.images?.length > 0 ? tool.images : [null];

  return (
    <div className="py-8 animate-fade-in">
      <div className="page-container">
        {/* Back button — uses browser history to preserve filters */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm"
        >
          <ChevronLeft size={16} /> Back
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── Images + Details ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking card on mobile — shown above content */}
            <div className="lg:hidden">
              <BookingCard
                tool={tool}
                user={user}
                kycStatus={kycStatus}
                booking={booking}
                setBooking={setBooking}
                bookedRanges={bookedRanges}
                showCalendar={showCalendar}
                setShowCalendar={setShowCalendar}
                totalDays={totalDays}
                totalCost={totalCost}
                onSubmit={handleBookClick}
                submitting={submitting}
              />
            </div>

            {/* Main Image */}
            <div className="card overflow-hidden">
              <div className="h-80 sm:h-96 bg-[#d4eadd]">
                <img
                  src={getImgUrl(images[activeImg])}
                  alt={tool.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = PLACEHOLDER; }}
                />
              </div>
              {images.length > 1 && (
                <div className="flex gap-3 p-4 overflow-x-auto">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                        i === activeImg ? 'border-[#1a5c3a]' : 'border-transparent'
                      }`}
                    >
                      <img src={getImgUrl(img)} className="w-full h-full object-cover" onError={(e) => { e.target.src = PLACEHOLDER; }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tool Info */}
            <div className="card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <span className="text-xs font-medium text-[#1a5c3a] bg-[#eef6f1] px-3 py-1 rounded-full border border-[#d4eadd]">
                    {tool.category}
                  </span>
                  <h1 className="text-3xl font-display font-bold text-gray-900 mt-2">{tool.name}</h1>
                  <div className="flex items-center gap-2 mt-2 text-gray-500">
                    <MapPin size={15} />
                    <span className="text-sm">{tool.location}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-[#1a5c3a]">₦{tool.pricePerDay?.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">per day</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-5">
                <div className={`badge ${tool.available ? 'badge-approved' : 'badge-rejected'}`}>
                  {tool.available ? '✅ Available' : '❌ Unavailable'}
                </div>
                {tool.condition && (
                  <div className="badge bg-blue-50 text-blue-700 border border-blue-200">
                    Condition: {tool.condition}
                  </div>
                )}
              </div>

              <h3 className="font-semibold text-gray-800 mb-2">About This Tool</h3>
              <p className="text-gray-600 leading-relaxed">{tool.description}</p>
            </div>

            {/* Owner Info — contact details only for logged-in users */}
            {tool.ownerId && (
              <div className="card p-6">
                <h3 className="font-semibold text-gray-800 mb-4">About the Owner</h3>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-[#3d9166] rounded-2xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-2xl font-bold">{tool.ownerId.name?.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{tool.ownerId.name}</p>
                    <div className="flex flex-wrap gap-4 mt-2">
                      {tool.ownerId.location && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin size={13} /> {tool.ownerId.location}
                        </div>
                      )}
                      {/* Phone & email only shown to logged-in users */}
                      {user && tool.ownerId.phone && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Phone size={13} /> {tool.ownerId.phone}
                        </div>
                      )}
                      {user && tool.ownerId.email && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Mail size={13} /> {tool.ownerId.email}
                        </div>
                      )}
                    </div>
                    {/* Message owner button for logged-in renters */}
                    {user && user.role === 'renter' && (
                      <Link
                        to={`/messages?userId=${tool.ownerId._id}`}
                        className="inline-flex items-center gap-2 mt-3 text-sm text-[#1a5c3a] hover:underline font-medium"
                      >
                        <MessageSquare size={14} /> Message owner
                      </Link>
                    )}
                    {!user && (
                      <p className="text-xs text-gray-400 mt-2">
                        <Link to="/login" className="text-[#1a5c3a] hover:underline">Sign in</Link> to view contact details
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Booking Card — desktop only (sticky) ── */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24">
              <BookingCard
                tool={tool}
                user={user}
                kycStatus={kycStatus}
                booking={booking}
                setBooking={setBooking}
                bookedRanges={bookedRanges}
                showCalendar={showCalendar}
                setShowCalendar={setShowCalendar}
                totalDays={totalDays}
                totalCost={totalCost}
                onSubmit={handleBookClick}
                submitting={submitting}
              />
            </div>
          </div>
        </div>

        {/* ── Reviews — full width below grid ── */}
        <div className="card p-6 mt-8">
          <h2 className="font-display font-bold text-xl text-gray-900 mb-4">
            ⭐ Reviews {avgRating && <span className="text-[#1a5c3a] ml-2">{avgRating} / 5</span>}
          </h2>
          <ReviewList reviews={reviews} averageRating={avgRating} />
        </div>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <ConfirmModal
          tool={tool}
          booking={booking}
          totalDays={totalDays}
          totalCost={totalCost}
          onConfirm={handleBookConfirm}
          onClose={() => setShowConfirm(false)}
          submitting={submitting}
        />
      )}
    </div>
  );
}

// ── Extracted booking card (used on both mobile and desktop) ──────────────────
function BookingCard({ tool, user, kycStatus, booking, setBooking, bookedRanges,
  showCalendar, setShowCalendar, totalDays, totalCost, onSubmit, submitting }) {
  return (
    <div className="card p-6">
      <h3 className="font-display font-bold text-xl text-gray-900 mb-5">Book This Tool</h3>

      {!tool.available ? (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
          <AlertCircle className="mx-auto mb-2 text-red-400" size={28} />
          <p className="text-red-600 font-medium text-sm">Currently Unavailable</p>
          <p className="text-red-400 text-xs mt-1">This tool is currently booked.</p>
        </div>
      ) : user?.role === 'owner' ? (
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-center">
          <p className="text-yellow-700 text-sm font-medium">Owners can't book tools. Switch to a renter account to book.</p>
        </div>
      ) : (
        <>
          {user && kycStatus !== 'approved' && (
            <div className={`rounded-xl p-3 mb-3 border ${kycStatus === 'pending' ? 'bg-yellow-50 border-yellow-200' : 'bg-[#eef6f1] border-[#a8d4bb]'}`}>
              <p className={`text-xs font-medium mb-1 ${kycStatus === 'pending' ? 'text-yellow-700' : 'text-[#154d30]'}`}>
                {kycStatus === 'pending' ? '🕐 KYC Under Review' : '⚠️ Identity Verification Required'}
              </p>
              <p className={`text-xs mb-2 ${kycStatus === 'pending' ? 'text-yellow-600' : 'text-[#1a5c3a]'}`}>
                {kycStatus === 'pending'
                  ? 'Your documents are being reviewed. You can book once approved.'
                  : 'Verify your identity before booking any tool.'}
              </p>
              <Link to="/kyc" className="text-xs font-semibold text-[#1a5c3a] hover:underline">
                {kycStatus === 'pending' ? 'View Status →' : 'Complete Verification →'}
              </Link>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  <Calendar size={14} className="inline mr-1" />Select Dates
                </label>
                <button type="button" onClick={() => setShowCalendar(v => !v)}
                  className="text-xs text-[#1a5c3a] hover:underline">
                  {showCalendar ? 'Hide calendar' : 'Show calendar'}
                </button>
              </div>

              {showCalendar && (
                <div className="mb-3">
                  <AvailabilityCalendar
                    bookedRanges={bookedRanges}
                    onRangeSelect={(start, end) => {
                      setBooking(b => ({
                        ...b,
                        startDate: start.toISOString().split('T')[0],
                        endDate:   end.toISOString().split('T')[0],
                      }));
                    }}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <input type="date" className="input-field text-sm"
                    min={new Date().toISOString().split('T')[0]}
                    value={booking.startDate}
                    onChange={(e) => setBooking(b => ({ ...b, startDate: e.target.value }))}
                    required />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <input type="date" className="input-field text-sm"
                    min={booking.startDate || new Date().toISOString().split('T')[0]}
                    value={booking.endDate}
                    onChange={(e) => setBooking(b => ({ ...b, endDate: e.target.value }))}
                    required />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                className="input-field resize-none"
                rows={2}
                placeholder="Any special requirements..."
                value={booking.notes}
                onChange={(e) => setBooking(b => ({ ...b, notes: e.target.value }))}
              />
            </div>

            {/* Price Breakdown */}
            {totalDays > 0 && (
              <div className="bg-[#eef6f1] rounded-xl p-4 border border-[#d4eadd]">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>₦{tool.pricePerDay?.toLocaleString()} × {totalDays} day{totalDays > 1 ? 's' : ''}</span>
                    <span>₦{totalCost?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-[#a8d4bb]">
                    <span>Total</span>
                    <span className="text-[#1a5c3a]">₦{totalCost?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {!user ? (
              <Link to="/login" className="btn-primary w-full text-center block">
                Sign In to Book
              </Link>
            ) : (
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? 'Sending...' : 'Review & Send Request'}
              </button>
            )}
          </form>
        </>
      )}

      <div className="mt-4 flex items-start gap-2 bg-gray-50 rounded-xl p-3">
        <CheckCircle size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">Payment is only required after the owner approves your booking request.</p>
      </div>
    </div>
  );
}