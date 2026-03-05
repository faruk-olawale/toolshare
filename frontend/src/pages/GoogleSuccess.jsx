import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LoadingScreen from '../components/ui/LoadingScreen';

export default function GoogleSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error || !token) {
      navigate('/login?error=oauth_failed');
      return;
    }

    localStorage.setItem('tsa_token', token);

    api.get('/auth/profile').then(({ data }) => {
      updateUser(data.user);
      navigate('/dashboard');
    }).catch(() => {
      navigate('/login?error=oauth_failed');
    });
  }, []);

  return <LoadingScreen />;
}