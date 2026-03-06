import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { X, ImagePlus, Shield, FileText, CheckCircle } from 'lucide-react';

const CATEGORIES = ['Construction', 'Agriculture', 'Electrical', 'Plumbing', 'Woodworking', 'Gardening', 'Transportation', 'Cleaning', 'Safety', 'Other'];
const CITIES = ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Benin City', 'Maiduguri', 'Zaria', 'Aba', 'Jos', 'Ilorin', 'Enugu', 'Abeokuta', 'Onitsha', 'Warri', 'Kaduna', 'Calabar', 'Uyo', 'Owerri'];

export default function AddTool() {
  const navigate = useNavigate();
  const [kycStatus, setKycStatus]   = useState(null);
  const [kycLoading, setKycLoading] = useState(true);

  useEffect(() => {
    api.get('/kyc/status').then(({ data }) => {
      setKycStatus(data.kyc?.status);
      setKycLoading(false);
    }).catch(() => setKycLoading(false));
  }, []);

  const [form, setForm] = useState({
    name: '', category: '', description: '', pricePerDay: '', location: '', condition: 'Good',
  });

  // Tool photos
  const [images,   setImages]   = useState([]);
  const [previews, setPreviews] = useState([]);

  // Ownership proof docs
  const [ownershipDocs,     setOwnershipDocs]     = useState([]);
  const [ownershipPreviews, setOwnershipPreviews] = useState([]);

  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) return toast.error('Maximum 5 photos allowed.');
    setImages(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setPreviews(prev => [...prev, { url: reader.result, name: file.name }]);
      reader.readAsDataURL(file);
    });
  };

  const handleDocChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + ownershipDocs.length > 3) return toast.error('Maximum 3 documents allowed.');
    setOwnershipDocs(prev => [...prev, ...files]);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setOwnershipPreviews(prev => [...prev, { url: reader.result, name: file.name, isImage: true }]);
        reader.readAsDataURL(file);
      } else {
        setOwnershipPreviews(prev => [...prev, { url: null, name: file.name, isImage: false }]);
      }
    });
  };

  const removeImage = (i) => {
    setImages(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const removeDoc = (i) => {
    setOwnershipDocs(prev => prev.filter((_, idx) => idx !== i));
    setOwnershipPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) return toast.error('Please upload at least one photo of the tool.');
    if (ownershipDocs.length === 0) return toast.error('Please upload proof of ownership (receipt or invoice).');
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      images.forEach(img => formData.append('images', img));
      ownershipDocs.forEach(doc => formData.append('ownershipDocs', doc));

      await api.post('/tools', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Tool listed! Awaiting admin approval 🎉');
      navigate('/my-tools');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to list tool.');
    } finally {
      setLoading(false);
    }
  };

  if (kycLoading) return <div className="py-12 page-container"><div className="animate-pulse h-8 bg-gray-100 rounded w-48" /></div>;

  if (kycStatus !== 'approved') return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="card p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield size={28} className="text-orange-500" />
        </div>
        <h2 className="text-xl font-display font-bold text-gray-900 mb-2">Verify Your Identity First</h2>
        <p className="text-gray-500 text-sm mb-4">You need to complete identity verification before listing tools.</p>
        {kycStatus === 'pending' && <p className="text-yellow-600 text-sm mb-4 bg-yellow-50 rounded-xl p-3">⏳ Your KYC is under review. You'll be notified once approved.</p>}
        {kycStatus === 'rejected' && <p className="text-red-600 text-sm mb-4 bg-red-50 rounded-xl p-3">❌ Verification was rejected. Please resubmit your documents.</p>}
        <Link to="/kyc" className="btn-primary w-full block text-center">
          {kycStatus === 'pending' ? 'View KYC Status →' : 'Complete Verification →'}
        </Link>
        <Link to="/dashboard" className="text-sm text-gray-400 hover:text-gray-600 mt-3 block">← Back to Dashboard</Link>
      </div>
    </div>
  );

  return (
    <div className="py-8 animate-fade-in">
      <div className="page-container max-w-2xl">
        <div className="mb-8">
          <h1 className="section-title mb-2">List a Tool</h1>
          <p className="text-gray-500">Fill in the details to start earning from your equipment</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tool Details */}
          <div className="card p-6">
            <h2 className="font-display font-bold text-gray-900 mb-4">Tool Details</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tool Name *</label>
                <input type="text" className="input-field" placeholder="e.g. Bosch Power Drill GSB 550"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Condition</label>
                <select className="input-field" value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Price Per Day (₦) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₦</span>
                  <input type="number" className="input-field pl-8" placeholder="5000" min="0"
                    value={form.pricePerDay} onChange={e => setForm({ ...form, pricePerDay: e.target.value })} required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Location *</label>
                <select className="input-field" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required>
                  <option value="">Select city</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
                <textarea className="input-field resize-none" rows={4}
                  placeholder="Describe your tool — brand, model, what it's used for, accessories included..."
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
              </div>
            </div>
          </div>

          {/* Tool Photos */}
          <div className="card p-6">
            <h2 className="font-display font-bold text-gray-900 mb-1">Tool Photos *</h2>
            <p className="text-xs text-gray-400 mb-4">Upload clear photos of the tool from multiple angles (up to 5)</p>

            {previews.length > 0 && (
              <div className="flex gap-3 flex-wrap mb-3">
                {previews.map((p, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                    <img src={p.url} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600">
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {previews.length < 5 && (
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-brand-300 hover:bg-brand-50 transition-colors">
                <ImagePlus size={24} className="text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Click to upload tool photos</span>
                <span className="text-xs text-gray-400">PNG, JPG, WEBP up to 10MB each</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
              </label>
            )}
          </div>

          {/* Ownership Proof */}
          <div className="card p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-blue-600" />
              </div>
              <div>
                <h2 className="font-display font-bold text-gray-900">Proof of Ownership *</h2>
                <p className="text-xs text-gray-400 mt-0.5">Required for admin verification — renters will NOT see this document</p>
              </div>
            </div>

            {/* What's accepted */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-blue-800 mb-2">Accepted documents:</p>
              <ul className="space-y-1">
                {[
                  'Purchase receipt or invoice',
                  'Store receipt (paper or digital)',
                  'Bank statement showing the purchase',
                  'Warranty card with your name',
                  'Any official document showing you own the tool',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-blue-700">
                    <CheckCircle size={12} className="text-blue-500 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Doc previews */}
            {ownershipPreviews.length > 0 && (
              <div className="space-y-2 mb-3">
                {ownershipPreviews.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
                    {p.isImage ? (
                      <img src={p.url} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText size={20} className="text-blue-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                      <p className="text-xs text-green-600">✓ Ready to upload</p>
                    </div>
                    <button type="button" onClick={() => removeDoc(i)}
                      className="w-7 h-7 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {ownershipDocs.length < 3 && (
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-blue-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <FileText size={24} className="text-blue-400 mb-2" />
                <span className="text-sm text-gray-600">Click to upload ownership proof</span>
                <span className="text-xs text-gray-400">JPG, PNG, PDF up to 10MB</span>
                <input type="file" accept="image/*,.pdf" multiple className="hidden" onChange={handleDocChange} />
              </label>
            )}

            <p className="text-xs text-gray-400 mt-3 text-center">
              🔒 Documents are stored securely and only reviewed by our admin team
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-3.5">
              {loading ? 'Submitting...' : 'Submit for Review 🚀'}
            </button>
          </div>

          <p className="text-xs text-center text-gray-400">
            Your listing will be reviewed by our team within 24 hours before going live.
          </p>
        </form>
      </div>
    </div>
  );
}