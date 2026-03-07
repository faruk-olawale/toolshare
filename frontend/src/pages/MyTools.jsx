import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { PlusCircle, Edit, Trash2, MapPin, ToggleLeft, ToggleRight } from 'lucide-react';
import { getImgUrl, PLACEHOLDER } from '../utils/imgUrl';

export default function MyTools() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/tools/my-tools').then(({ data }) => setTools(data.tools)).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/tools/${id}`);
      setTools((prev) => prev.filter((t) => t._id !== id));
      toast.success('Tool deleted.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete tool.');
    }
  };

  const toggleAvailability = async (tool) => {
    try {
      const { data } = await api.put(`/tools/${tool._id}`, { available: !tool.available });
      setTools((prev) => prev.map((t) => t._id === tool._id ? { ...t, available: data.tool.available } : t));
      toast.success(`Tool marked as ${data.tool.available ? 'available' : 'unavailable'}.`);
    } catch {
      toast.error('Failed to update availability.');
    }
  };

  if (loading) return (
    <div className="py-8 page-container">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card"><div className="h-48 bg-gray-100" /><div className="p-4 space-y-3"><div className="h-5 bg-gray-100 rounded w-3/4" /><div className="h-4 bg-gray-100 rounded" /></div></div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="py-8 animate-fade-in">
      <div className="page-container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="section-title mb-1">My Tools</h1>
            <p className="text-gray-500">{tools.length} tool{tools.length !== 1 ? 's' : ''} listed</p>
          </div>
          <Link to="/tools/new" className="btn-primary flex items-center gap-2">
            <PlusCircle size={18} /> Add Tool
          </Link>
        </div>

        {tools.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔧</div>
            <h3 className="text-xl font-display font-semibold text-gray-800 mb-2">No Tools Listed Yet</h3>
            <p className="text-gray-500 mb-6">List your first tool and start earning today.</p>
            <Link to="/tools/new" className="btn-primary">List Your First Tool</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <div key={tool._id} className="card group">
                <div className="relative h-48 bg-earth-100 overflow-hidden">
                  <img
                    src={getImgUrl(tool.images?.[0])}
                    alt={tool.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.src = PLACEHOLDER; }}
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 text-xs font-medium px-2.5 py-1 rounded-full">{tool.category}</span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => toggleAvailability(tool)}
                      className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                        tool.available ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
                      }`}
                    >
                      {tool.available ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                      {tool.available ? 'Available' : 'Unavailable'}
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-display font-semibold text-gray-900 text-lg leading-snug mb-1">{tool.name}</h3>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                      <MapPin size={12} /> {tool.location}
                    </div>
                    <span className="text-brand-600 font-bold">₦{tool.pricePerDay?.toLocaleString()}/day</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/tools/${tool._id}/edit`)}
                      className="flex-1 btn-secondary py-2 text-sm flex items-center justify-center gap-1.5"
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(tool._id, tool.name)}
                      className="btn-secondary py-2 px-3 text-red-500 border-red-100 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}