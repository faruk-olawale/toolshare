import { useState } from 'react';
import StarRating from './StarRating';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const RENTER_DIMENSIONS = [
  { key: 'professionalism', label: 'Professionalism' },
  { key: 'toolCondition',   label: 'Tool Condition'  },
  { key: 'communication',   label: 'Communication'   },
];

const OWNER_DIMENSIONS = [
  { key: 'punctuality',  label: 'Punctuality' },
  { key: 'toolCare',     label: 'Tool Care'   },
  { key: 'communication', label: 'Communication' },
];

export default function ReviewForm({ booking, onSubmitted }) {
  const { user } = useAuth();
  const isRenter = user?._id === (booking.renterId?._id || booking.renterId);
  const dimensions = isRenter ? RENTER_DIMENSIONS : OWNER_DIMENSIONS;

  const [overall, setOverall]     = useState(0);
  const [ratings, setRatings]     = useState({});
  const [comment, setComment]     = useState('');
  const [loading, setLoading]     = useState(false);

  const allRated = overall > 0 && dimensions.every(d => ratings[d.key] > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allRated) return toast.error('Please rate all categories.');
    setLoading(true);
    try {
      const { data } = await api.post('/reviews', {
        bookingId: booking._id,
        overallRating: overall,
        ratings,
        comment,
      });
      toast.success('Review submitted! ⭐');
      onSubmitted?.(data.review);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally { setLoading(false); }
  };

  return (
    <div className="card p-5">
      <h3 className="font-display font-bold text-gray-900 mb-1">
        {isRenter ? '⭐ Review the Owner' : '⭐ Review the Renter'}
      </h3>
      <p className="text-xs text-gray-400 mb-4">
        {isRenter ? 'How was your experience with the tool owner?' : 'How was this renter?'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Overall Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Overall Rating</label>
          <StarRating value={overall} onChange={setOverall} size={28} />
        </div>

        {/* Dimension Ratings */}
        <div className="space-y-3">
          {dimensions.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <label className="text-sm text-gray-600">{label}</label>
              <StarRating value={ratings[key] || 0} onChange={v => setRatings(p => ({ ...p, [key]: v }))} size={20} />
            </div>
          ))}
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Comment (optional)</label>
          <textarea className="input-field resize-none text-sm" rows={3}
            placeholder="Share your experience..."
            value={comment} onChange={e => setComment(e.target.value)} />
        </div>

        <button type="submit" disabled={!allRated || loading}
          className="btn-primary w-full py-3 text-sm disabled:opacity-40">
          {loading ? 'Submitting...' : 'Submit Review ⭐'}
        </button>
      </form>
    </div>
  );
}