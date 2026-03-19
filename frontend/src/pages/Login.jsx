// ─── Login.jsx — example of correct login usage ──────────────────────────────
//
// KEY PRINCIPLES demonstrated here:
//
// 1. No manual localStorage calls — all token/session management is delegated
//    to AuthContext.login(), which calls authStorage internally.
//
// 2. navigate() is called AFTER login() awaits — by the time navigate() runs,
//    the token is already in localStorage AND React state is scheduled to
//    update. PrivateRoute will pass, and any immediate API call will have the
//    Authorization header.
//
// 3. try/catch on async/await — no .catch() on a promise variable that might
//    not be a promise. The pattern is: await in try{}, handle in catch{}.

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Wrench } from 'lucide-react';

const GOOGLE_AUTH_URL =
  (import.meta.env.VITE_API_URL || 'https://toolshare-africa-api.onrender.com/api')
  + '/auth/google';

export default function Login() {
  const [form, setForm]             = useState({ email: '', password: '' });
  const [showPassword, setShowPw]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const { login }                   = useAuth();
  const navigate                    = useNavigate();
  const [searchParams]              = useSearchParams();
  // Redirect to the page the user was trying to reach, or dashboard
  const redirectTo                  = searchParams.get('redirect') || '/dashboard';

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // login() does three things in order:
      //   1. POST /auth/login → receives { token, user }
      //   2. setToken(token)  → writes to localStorage SYNCHRONOUSLY
      //   3. setUser(user)    → updates React state
      // By the time this await resolves, token is guaranteed to be in storage.
      await login(form.email, form.password);

      // navigate() runs AFTER login() — the token is already set.
      // PrivateRoute at the destination will find user !== null and pass.
      // Any useEffect in the destination page that fires an API call will
      // have the Authorization header from the request interceptor.
      navigate(redirectTo, { replace: true });

      toast.success('Welcome back! 👋');
    } catch (err) {
      // err.response exists for HTTP errors (400, 401, 403, 429, 500)
      // err.response is undefined for network errors (no connection)
      const message =
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK' ? 'Cannot connect to server.' : 'Login failed.');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="card p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Wrench size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to your ToolShare account</p>
          </div>

          {/* Google OAuth */}
          <a
            href={GOOGLE_AUTH_URL}
            className="flex items-center justify-center gap-3 w-full py-3 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors mb-4 text-sm font-medium text-gray-700"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Continue with Google
          </a>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-xs text-gray-400">or with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="chidi@example.com"
                value={form.email}
                onChange={set('email')}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-brand-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-11"
                  placeholder="Your password"
                  value={form.password}
                  onChange={set('password')}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
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
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 font-medium hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}