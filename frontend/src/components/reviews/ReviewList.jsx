import StarRating from './StarRating';

export default function ReviewList({ reviews = [], averageRating, title = 'Reviews' }) {
  if (!reviews.length) return (
    <div className="text-center py-6 text-gray-400 text-sm">No reviews yet.</div>
  );

  return (
    <div>
      {/* Summary */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl font-bold text-gray-900">{averageRating || '—'}</span>
        <div>
          <StarRating value={Math.round(averageRating || 0)} readonly size={18} />
          <p className="text-xs text-gray-400 mt-0.5">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {reviews.map(review => (
          <div key={review._id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-sm flex-shrink-0">
                  {review.reviewerId?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{review.reviewerId?.name || 'User'}</p>
                  <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <StarRating value={review.overallRating} readonly size={16} />
            </div>
            {review.comment && <p className="text-sm text-gray-600 mt-2 ml-10">{review.comment}</p>}

            {/* Dimension breakdown */}
            {review.ratings && Object.keys(review.ratings).some(k => review.ratings[k]) && (
              <div className="ml-10 mt-2 flex flex-wrap gap-2">
                {Object.entries(review.ratings).filter(([, v]) => v).map(([k, v]) => (
                  <span key={k} className="text-xs bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5 text-gray-500 capitalize">
                    {k.replace(/([A-Z])/g, ' $1')}: {v}/5
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}