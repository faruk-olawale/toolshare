import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, KeyRound, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const userId = searchParams.get('id');

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token || !userId) return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="card p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
        <p className="text-gray-500 mb-6">This link is invalid or has expired.</p>
        <Link to="/forgot-password" className="btn-primary">Request New Link →</Link>
      </div>
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm)
      return toast.error('Passwords do not match.');
    if (form.password.length < 6)
      return toast.error('Password must be at least 6 characters.');

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, userId, password: form.password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Link may have expired.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="card p-8">
          {done ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-green-500" />
              </div>
              <h2 className="text-xl font-display font-bold text-gray-900 mb-2">Password Reset!</h2>
              <p className="text-gray-500 text-sm">Redirecting you to login in 3 seconds...</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <KeyRound size={24} className="text-brand-500" />
                </div>
                <h1 className="text-2xl font-display font-bold text-gray-900">Set New Password</h1>
                <p className="text-gray-500 text-sm mt-1">Choose a strong password for your account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} className="input-field pr-11"
                      placeholder="At least 6 characters"
                      value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                  <input type={showPassword ? 'text' : 'password'} className="input-field"
                    placeholder="Repeat your password"
                    value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required />
                  {form.confirm && form.password !== form.confirm && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>
                <button type="submit" disabled={loading || form.password !== form.confirm} className="btn-primary w-full py-3.5">
                  {loading ? 'Resetting...' : 'Reset Password →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}