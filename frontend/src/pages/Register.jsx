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
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters.');
    }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created successfully! Please sign in. 🎉');
      navigate('/login');
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
            <div className="w-14 h-14 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Wrench size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Create Account</h1>
            <p className="text-gray-500 text-sm mt-1">Join ToolShare Africa today — it's free</p>
          </div>

          {/* Role Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {['renter', 'owner'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setForm({ ...form, role: r })}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 capitalize ${
                  form.role === r
                    ? 'bg-white shadow-sm text-brand-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {r === 'renter' ? '🔧 I Want to Rent' : '💼 I Want to List'}
              </button>
            ))}
          </div>

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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
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
                  placeholder="At least 6 characters"
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
              {loading ? 'Creating Account...' : `Create ${form.role === 'owner' ? 'Owner' : 'Renter'} Account`}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </p>
          <p className="mt-3 text-center text-xs text-gray-400">
            By registering, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}