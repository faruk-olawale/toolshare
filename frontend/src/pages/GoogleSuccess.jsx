// ─── GoogleSuccess.jsx ────────────────────────────────────────────────────────
//
// The backend redirects here after Google OAuth completes:
//   https://toolshare-ou47.vercel.app/auth/google/success?token=eyJ...&user={"id":...}
//
// WHY parse from URL params and not from a POST body?
// After an OAuth redirect, there's no request body — the browser just loaded
// a new page. The backend encodes the token + user into the query string.
//
// WHY call googleLogin() from AuthContext instead of setToken() directly?
// googleLogin() updates React state AND localStorage atomically. If we only
// called setToken(), React state would be stale (user would be null) until
// the next loadUser() cycle. navigate('/dashboard') would bounce off PrivateRoute.

import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function GoogleSuccess() {
  const [searchParams] = useSearchParams();
  const { googleLogin } = useAuth();
  const navigate        = useNavigate();
  // Prevent double-processing if the component re-renders (React StrictMode)
  const processed       = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const token   = searchParams.get('token');
    const userRaw = searchParams.get('user');

    if (!token || !userRaw) {
      toast.error('Google login failed. Please try again.');
      navigate('/login', { replace: true });
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userRaw));
      googleLogin(token, user);       // sets token + user in storage + React state
      navigate('/dashboard', { replace: true });
      toast.success(`Welcome, ${user.name?.split(' ')[0]}! 🎉`);
    } catch {
      toast.error('Something went wrong with Google login.');
      navigate('/login', { replace: true });
    }
  }, []);   // eslint-disable-line — intentionally empty: runs once on mount

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#1a5c3a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Completing sign-in...</p>
      </div>
    </div>
  );
}