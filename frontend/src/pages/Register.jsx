import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Wrench } from 'lucide-react';

const NIGERIAN_CITIES = ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Benin City', 'Maiduguri', 'Zaria', 'Aba', 'Jos', 'Ilorin', 'Oyo', 'Enugu', 'Abeokuta', 'Onitsha', 'Warri', 'Kaduna', 'Calabar', 'Uyo', 'Owerri'];

export default function Register() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    location: '',
    role: searchParams.get('role') || 'renter',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      return toast.error('Password must be at least 8 characters.');
    }
    setLoading(true);
    try {
      await register(form);
      toast.success(`Welcome to ToolShare, ${form.name.split(' ')[0]}! 🎉`);
      navigate('/welcome');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-[#3d9166] to-[#1a5c3a] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Wrench size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Create Account</h1>
            <p className="text-gray-500 text-sm mt-1">Free to join. No subscription. Cancel anytime.</p>
          </div>

          {/* Role indicator — not a toggle, just shows what they're signing up as */}
          {form.role === 'owner' && (
            <div className="flex items-center gap-2 bg-[#eef6f1] border border-[#c0dece] rounded-xl px-4 py-3 mb-4">
              <span className="text-lg">💼</span>
              <div>
                <p className="text-sm font-semibold text-[#1a5c3a]">Signing up as a Tool Owner</p>
                <p className="text-xs text-gray-500">You can also rent tools after signing up</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="Chidi Okeke"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email"
                className="input-field"
                placeholder="chidi@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="tel"
                className="input-field"
                placeholder="+2348012345678"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
              <select
                className="input-field"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              >
                <option value="">Select your city</option>
                {NIGERIAN_CITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-11"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-base py-3.5 mt-2"
            >
              {loading ? 'Creating your account...' : 'Create free account →'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-[#1a5c3a] font-medium hover:underline">Sign in</Link>
          </p>
          <p className="mt-3 text-center text-xs text-gray-400">
            By signing up you agree to our Terms of Service. Your data is never sold.
          </p>
        </div>
      </div>
    </div>
  );
}