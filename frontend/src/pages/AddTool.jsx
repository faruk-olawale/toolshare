import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Upload, X, ImagePlus } from 'lucide-react';

const CATEGORIES = ['Construction', 'Agriculture', 'Electrical', 'Plumbing', 'Woodworking', 'Gardening', 'Transportation', 'Cleaning', 'Safety', 'Other'];
const CITIES = ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Benin City', 'Maiduguri', 'Zaria', 'Aba', 'Jos', 'Ilorin', 'Enugu', 'Abeokuta', 'Onitsha', 'Warri', 'Kaduna', 'Calabar', 'Uyo', 'Owerri'];

export default function AddTool() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', category: '', description: '', pricePerDay: '', location: '', condition: 'Good',
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      return toast.error('Maximum 5 images allowed.');
    }
    setImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setPreviews((prev) => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      images.forEach((img) => formData.append('images', img));

      await api.post('/tools', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Tool listed successfully! 🎉');
      navigate('/my-tools');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to list tool.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8 animate-fade-in">
      <div className="page-container max-w-2xl">
        <div className="mb-8">
          <h1 className="section-title mb-2">List a Tool</h1>
          <p className="text-gray-500">Fill in the details to start earning from your equipment</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tool Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Bosch Power Drill"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Condition</label>
                <select className="input-field" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Price Per Day (₦) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₦</span>
                  <input
                    type="number"
                    className="input-field pl-8"
                    placeholder="5000"
                    min="0"
                    value={form.pricePerDay}
                    onChange={(e) => setForm({ ...form, pricePerDay: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Location *</label>
                <select className="input-field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required>
                  <option value="">Select city</option>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
                <textarea
                  className="input-field resize-none"
                  rows={4}
                  placeholder="Describe your tool — include brand, model, what it's used for, any accessories included..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>

              {/* Images */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Photos <span className="text-gray-400 font-normal">(up to 5)</span>
                </label>
                
                {/* Previews */}
                {previews.length > 0 && (
                  <div className="flex gap-3 flex-wrap mb-3">
                    {previews.map((src, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                        <img src={src} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X size={10} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {previews.length < 5 && (
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-brand-300 hover:bg-brand-50 transition-colors">
                    <ImagePlus size={24} className="text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Click to upload photos</span>
                    <span className="text-xs text-gray-400">PNG, JPG, WEBP up to 5MB each</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Listing...' : 'List My Tool 🚀'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
