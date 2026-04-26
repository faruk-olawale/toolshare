import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Handles redirect back from Google OAuth.
// New users → /welcome (onboarding)
// Returning users → /dashboard
export default function GoogleSuccess() {
  const [searchParams]    = useSearchParams();
  const { login: ctxLogin, updateUser } = useAuth();
  const navigate          = useNavigate();
  const processed         = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const token = searchParams.get('token');
    const userParam = searchParams.get('user');

    if (!token || !userParam) {
      navigate('/login?error=google');
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userParam));

      // Store token and update auth context
      localStorage.setItem('tsa_token', token);
      updateUser(user);

      // Determine if this is a brand-new user
      // Google OAuth users are created with a createdAt — if it's within
      // the last 60 seconds, treat them as new and show onboarding
      const isNewUser = user.createdAt
        ? Date.now() - new Date(user.createdAt).getTime() < 60_000
        : false;

      if (isNewUser) {
        navigate('/welcome');
      } else {
        navigate(user.role === 'admin' ? '/admin' : '/dashboard');
      }
    } catch {
      navigate('/login?error=google');
    }
  }, [searchParams, navigate, updateUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#1a5c3a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Signing you in...</p>
      </div>
    </div>
  );
}