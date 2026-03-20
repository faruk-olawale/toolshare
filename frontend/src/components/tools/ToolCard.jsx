import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { getImgUrl, PLACEHOLDER } from '../../utils/imgUrl';

export default function ToolCard({ tool }) {
  const unavailable = !tool.available;

  return (
    <Link
      to={`/tools/${tool._id}`}
      className={`card block transition-all duration-200 group ${
        unavailable
          ? 'opacity-60 cursor-pointer'           // faded but still navigable to detail
          : 'hover:shadow-md hover:-translate-y-0.5'
      }`}
      title={unavailable ? 'This tool is not available right now' : undefined}
    >
      {/* ── Image ── */}
      <div className="relative overflow-hidden h-48 bg-[#d4eadd]">
        <img
          src={getImgUrl(tool.images?.[0])}
          alt={tool.name}
          className={`w-full h-full object-cover transition-transform duration-300 ${
            unavailable ? '' : 'group-hover:scale-105'
          }`}
          onError={(e) => { e.target.src = PLACEHOLDER; }}
        />

        {/* Category pill — top left */}
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 px-2.5 py-1 rounded-full border border-white/50 shadow-sm">
            {tool.category}
          </span>
        </div>

        {/* Availability badge — top right */}
        <div className="absolute top-3 right-3">
          {unavailable ? (
            <span className="bg-gray-800/80 backdrop-blur-sm text-xs font-semibold text-white px-2.5 py-1 rounded-full shadow-sm">
              Unavailable
            </span>
          ) : (
            <span className="bg-[#1a5c3a]/90 backdrop-blur-sm text-xs font-semibold text-white px-2.5 py-1 rounded-full shadow-sm">
              Available
            </span>
          )}
        </div>

        {/* Dim overlay for unavailable tools */}
        {unavailable && (
          <div className="absolute inset-0 bg-gray-900/20" />
        )}
      </div>

      {/* ── Body ── */}
      <div className="p-4">
        <h3 className={`font-display font-semibold text-lg leading-snug mb-1 line-clamp-1 transition-colors ${
          unavailable ? 'text-gray-500' : 'text-gray-900 group-hover:text-[#1a5c3a]'
        }`}>
          {tool.name}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3 leading-relaxed">
          {tool.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-gray-500">
            <MapPin size={13} />
            <span className="text-xs truncate max-w-[120px]">{tool.location}</span>
          </div>
          <div className="text-right">
            <span className={`font-bold text-lg ${unavailable ? 'text-gray-400' : 'text-[#1a5c3a]'}`}>
              ₦{tool.pricePerDay?.toLocaleString()}
            </span>
            <span className="text-gray-400 text-xs">/day</span>
          </div>
        </div>

        {/* Owner */}
        {tool.ownerId?.name && (
          <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-[#6db591] to-[#3d9166] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{tool.ownerId.name.charAt(0)}</span>
              </div>
              <span className="text-xs text-gray-500">{tool.ownerId.name}</span>
            </div>
            {/* Inline CTA */}
            {unavailable ? (
              <span className="text-xs text-gray-400 font-medium">Currently unavailable</span>
            ) : (
              <span className="text-xs text-[#1a5c3a] font-semibold group-hover:underline">View →</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}