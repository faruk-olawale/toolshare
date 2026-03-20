import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ToolCard from '../components/tools/ToolCard';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';

const CATEGORIES = ['', 'Construction', 'Agriculture', 'Electrical', 'Plumbing', 'Woodworking', 'Gardening', 'Transportation', 'Cleaning', 'Safety', 'Other'];
const CITIES     = ['', 'Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Benin City', 'Enugu', 'Kaduna', 'Owerri', 'Calabar'];

export default function BrowseTools() {
  const [searchParams] = useSearchParams();
  const [tools, setTools]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [filters, setFilters] = useState({
    search:   searchParams.get('search')   || '',
    category: searchParams.get('category') || '',
    location: '',
    minPrice: '',
    maxPrice: '',
    // NOTE: no `available` filter — we show ALL tools intentionally
    page: 1,
  });
  const [searchInput, setSearchInput] = useState(filters.search);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search — fires API 400ms after typing stops
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput, page: 1 }));
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchTools = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      // showAll=true tells the backend to include unavailable tools
      const { data } = await api.get('/tools', { params: { ...params, showAll: true } });
      setTools(data.tools || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {
      setTools([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchTools(); }, [fetchTools]);

  const handleFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({ search: '', category: '', location: '', minPrice: '', maxPrice: '', page: 1 });
  };

  const hasFilters = filters.search || filters.category || filters.location || filters.minPrice || filters.maxPrice;

  // Truncated pagination
  const getPageNumbers = () => {
    if (pages <= 7) return [...Array(pages)].map((_, i) => i + 1);
    const cur = filters.page;
    const nums = new Set([1, pages, cur - 2, cur - 1, cur, cur + 1, cur + 2].filter(n => n >= 1 && n <= pages));
    const sorted = [...nums].sort((a, b) => a - b);
    const result = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…');
      result.push(sorted[i]);
    }
    return result;
  };

  // Counts for the filter bar summary
  const availableCount   = tools.filter(t => t.available).length;
  const unavailableCount = tools.filter(t => !t.available).length;

  return (
    <div className="py-8 animate-fade-in">
      <div className="page-container">

        {/* Header */}
        <div className="mb-6">
          <h1 className="section-title mb-2">Browse Tools</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            {total > 0 && <span>{total} tools found</span>}
            {!loading && total > 0 && (
              <>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <span className="text-[#1a5c3a] font-medium">{availableCount} available</span>
                {unavailableCount > 0 && (
                  <>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span className="text-gray-400">{unavailableCount} unavailable</span>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Search + Filter Bar */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              className="input-field pl-11"
              placeholder="Search tools, equipment..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'border-[#3d9166] text-[#1a5c3a]' : ''}`}
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filters</span>
            {hasFilters && <span className="w-2 h-2 bg-[#1a5c3a] rounded-full" />}
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-secondary flex items-center gap-1 text-red-500 border-red-100 hover:bg-red-50">
              <X size={16} /> <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="card p-5 mb-6 animate-slide-up">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Category</label>
                <select className="input-field text-sm py-2.5" value={filters.category} onChange={(e) => handleFilter('category', e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c || 'All Categories'}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">City</label>
                <select className="input-field text-sm py-2.5" value={filters.location} onChange={(e) => handleFilter('location', e.target.value)}>
                  {CITIES.map((c) => <option key={c} value={c}>{c || 'All Cities'}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Min Price (₦/day)</label>
                <input type="number" className="input-field text-sm py-2.5" placeholder="0"
                  value={filters.minPrice} onChange={(e) => handleFilter('minPrice', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Max Price (₦/day)</label>
                <input type="number" className="input-field text-sm py-2.5" placeholder="Any"
                  value={filters.maxPrice} onChange={(e) => handleFilter('maxPrice', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Tools Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card">
                <div className="h-48 image-placeholder" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-100 rounded-lg w-3/4 image-placeholder" />
                  <div className="h-4 bg-gray-100 rounded-lg image-placeholder" />
                  <div className="h-4 bg-gray-100 rounded-lg w-1/2 image-placeholder" />
                </div>
              </div>
            ))}
          </div>
        ) : tools.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔧</div>
            <h3 className="text-xl font-display font-semibold text-gray-800 mb-2">No Tools Found</h3>
            <p className="text-gray-500">Try adjusting your filters or search terms.</p>
            {hasFilters && <button onClick={clearFilters} className="btn-primary mt-4">Clear Filters</button>}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tools.map((tool) => <ToolCard key={tool._id} tool={tool} />)}
            </div>

            {/* Truncated Pagination */}
            {pages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  disabled={filters.page <= 1}
                  onClick={() => handleFilter('page', filters.page - 1)}
                  className="btn-secondary py-2 px-3 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                {getPageNumbers().map((n, i) =>
                  n === '…' ? (
                    <span key={`ellipsis-${i}`} className="w-10 h-10 flex items-center justify-center text-gray-400 text-sm">…</span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => handleFilter('page', n)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        filters.page === n
                          ? 'bg-[#1a5c3a] text-white'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-[#6db591]'
                      }`}
                    >
                      {n}
                    </button>
                  )
                )}
                <button
                  disabled={filters.page >= pages}
                  onClick={() => handleFilter('page', filters.page + 1)}
                  className="btn-secondary py-2 px-3 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}