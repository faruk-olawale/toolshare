import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import StarRating from '../components/reviews/StarRating';
import { MapPin, Loader, Navigation } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
const PLACEHOLDER = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80';

const RADIUS_OPTIONS = [
  { label: '5 km',  value: 5000  },
  { label: '10 km', value: 10000 },
  { label: '20 km', value: 20000 },
  { label: '50 km', value: 50000 },
];

export default function MapSearch() {
  const mapRef        = useRef(null);
  const leafletMap    = useRef(null);
  const markersLayer  = useRef(null);
  const [tools,    setTools]    = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [radius,   setRadius]   = useState(10000);
  const [coords,   setCoords]   = useState(null);
  const [leafletReady, setLeafletReady] = useState(false);

  // Dynamically load Leaflet CSS + JS
  useEffect(() => {
    if (document.getElementById('leaflet-css')) { setLeafletReady(true); return; }
    const link = document.createElement('link');
    link.id   = 'leaflet-css';
    link.rel  = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);
  }, []);

  // Init map once Leaflet is ready
  useEffect(() => {
    if (!leafletReady || !mapRef.current || leafletMap.current) return;
    const L = window.L;
    const map = L.map(mapRef.current).setView([9.0820, 8.6753], 6); // Nigeria center
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);
    leafletMap.current = map;
    markersLayer.current = L.layerGroup().addTo(map);
  }, [leafletReady]);

  // Plot tools on map
  useEffect(() => {
    if (!leafletReady || !leafletMap.current || !markersLayer.current) return;
    const L = window.L;
    markersLayer.current.clearLayers();

    tools.forEach(tool => {
      const coords = tool.coordinates?.coordinates;
      if (!coords?.[0] || !coords?.[1]) return;
      const [lng, lat] = coords;

      const icon = L.divIcon({
        html: `<div style="background:#f2711c;color:white;padding:4px 8px;border-radius:12px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.2)">₦${Number(tool.pricePerDay).toLocaleString()}</div>`,
        className: '', iconAnchor: [0, 0],
      });

      const marker = L.marker([lat, lng], { icon })
        .on('click', () => setSelected(tool));
      markersLayer.current.addLayer(marker);
    });
  }, [tools, leafletReady]);

  const getLocation = () => {
    if (!navigator.geolocation)
      return toast.error('Geolocation not supported on this device.');
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        if (leafletMap.current) leafletMap.current.setView([lat, lng], 12);
        searchNearby(lng, lat);
      },
      () => { toast.error('Could not get your location.'); setLoading(false); }
    );
  };

  const searchNearby = async (lng, lat, r = radius) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/tools/nearby?lng=${lng}&lat=${lat}&radius=${r}`);
      setTools(data.tools);
      if (!data.tools.length) toast('No tools found nearby. Try a larger radius.', { icon: '📍' });
    } catch { toast.error('Search failed.'); }
    setLoading(false);
  };

  const handleRadiusChange = (v) => {
    setRadius(v);
    if (coords) searchNearby(coords.lng, coords.lat, v);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row animate-fade-in">

      {/* Sidebar */}
      <div className="w-full md:w-80 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h1 className="font-display font-bold text-lg text-gray-900 mb-3">🗺️ Tools Near You</h1>

          <button onClick={getLocation} disabled={loading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 mb-3 text-sm">
            {loading ? <Loader size={16} className="animate-spin" /> : <Navigation size={16} />}
            {loading ? 'Searching...' : 'Find Tools Near Me'}
          </button>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Search radius</label>
            <div className="flex gap-2">
              {RADIUS_OPTIONS.map(({ label, value }) => (
                <button key={value} onClick={() => handleRadiusChange(value)}
                  className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${radius === value ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-200 text-gray-600 hover:border-brand-300'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tool list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {!coords && !loading && (
            <div className="text-center py-12">
              <MapPin size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Click "Find Tools Near Me" to discover tools in your area.</p>
            </div>
          )}
          {tools.map(tool => (
            <div key={tool._id} onClick={() => setSelected(tool)}
              className={`card p-3 cursor-pointer transition-all hover:border-brand-200 ${selected?._id === tool._id ? 'border-brand-300 bg-brand-50' : ''}`}>
              <div className="flex gap-2">
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-earth-100">
                  <img src={tool.images?.[0]?.startsWith('http') ? tool.images[0] : `${BASE_URL}${tool.images?.[0]}`}
                    className="w-full h-full object-cover" onError={e => { e.target.src = PLACEHOLDER; }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{tool.name}</p>
                  <p className="text-xs text-gray-400">{tool.location}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-brand-600 font-bold text-xs">₦{tool.pricePerDay?.toLocaleString()}/day</p>
                    {tool.averageRating && (
                      <span className="text-xs text-gray-500">⭐ {tool.averageRating}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full min-h-[300px]" />

        {/* Selected tool popup */}
        {selected && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-72 z-[1000]">
            <div className="card p-4 shadow-xl">
              <button onClick={() => setSelected(null)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg">×</button>
              <div className="flex gap-3 mb-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-earth-100">
                  <img src={selected.images?.[0]?.startsWith('http') ? selected.images[0] : `${BASE_URL}${selected.images?.[0]}`}
                    className="w-full h-full object-cover" onError={e => { e.target.src = PLACEHOLDER; }} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{selected.name}</p>
                  <p className="text-xs text-gray-400">{selected.location}</p>
                  <p className="text-brand-600 font-bold text-sm">₦{selected.pricePerDay?.toLocaleString()}/day</p>
                  {selected.averageRating && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <StarRating value={Math.round(selected.averageRating)} readonly size={12} />
                      <span className="text-xs text-gray-400">({selected.reviewCount})</span>
                    </div>
                  )}
                </div>
              </div>
              <Link to={`/tools/${selected._id}`} className="btn-primary w-full text-center py-2 text-sm block">
                View Tool →
              </Link>
            </div>
          </div>
        )}

        {!leafletReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <Loader size={28} className="animate-spin text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
}