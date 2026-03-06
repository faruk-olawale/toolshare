import { useState } from 'react';

export default function StarRating({ value = 0, onChange, size = 24, readonly = false }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`transition-transform ${!readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
        >
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={(hover || value) >= star ? '#f2711c' : '#e5e7eb'}
              stroke={(hover || value) >= star ? '#f2711c' : '#d1d5db'}
              strokeWidth="1"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}