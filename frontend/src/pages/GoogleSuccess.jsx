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
    const error = searchParams.get('error');

    if (error) {
      navigate('/login?error=oauth_failed');
      return;
    }

    api.get('/auth/profile').then(({ data }) => {
      updateUser(data.user);
      navigate('/dashboard');
    }).catch(() => {
      navigate('/login?error=oauth_failed');
    });
  }, [navigate, searchParams, updateUser]);

  return <LoadingScreen />;
}
