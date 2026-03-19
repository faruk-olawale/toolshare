import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function GoogleSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();   // ← uses the existing AuthContext, NOT googleLogin()

  useEffect(() => {
    const token = searchParams.get('token');
    const userRaw = searchParams.get('user');

    if (!token || !userRaw) {
      toast.error('Google login failed. Please try again.');
      return navigate('/login');
    }

    try {
      const user = JSON.parse(decodeURIComponent(userRaw));
      // Store token manually since we're not going through login()
      localStorage.setItem('tsa_token', token);
      // Reload the page so AuthContext.loadUser() picks up the new token
      window.location.href = '/dashboard';
    } catch {
      toast.error('Google login failed. Please try again.');
      navigate('/login');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#1a5c3a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Completing sign-in...</p>
      </div>
    </div>
  );
}