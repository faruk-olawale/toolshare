import { Link } from 'react-router-dom';
import { MapPin, Star, Clock } from 'lucide-react';
import { getImgUrl, PLACEHOLDER } from '../../utils/imgUrl';

export default function ToolCard({ tool }) {
  const imgSrc = getImgUrl(tool.images?.[0]);

  return (
    <Link to={`/tools/${tool._id}`} className="card group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 block">
      <div className="relative overflow-hidden h-48 bg-earth-100">
        <img
          src={imgSrc}
          alt={tool.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = PLACEHOLDER; }}
        />
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 px-2.5 py-1 rounded-full border border-white/50 shadow-sm">
            {tool.category}
          </span>
        </div>
        {!tool.available && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white/90 text-gray-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Unavailable
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-display font-semibold text-gray-900 text-lg leading-snug mb-1 group-hover:text-brand-600 transition-colors line-clamp-1">
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
            <span className="text-brand-600 font-bold text-lg">
              ₦{tool.pricePerDay?.toLocaleString()}
            </span>
            <span className="text-gray-400 text-xs">/day</span>
          </div>
        </div>

        {tool.ownerId?.name && (
          <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-brand-300 to-earth-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{tool.ownerId.name.charAt(0)}</span>
            </div>
            <span className="text-xs text-gray-500">{tool.ownerId.name}</span>
          </div>
        )}
      </div>
    </Link>
  );
}