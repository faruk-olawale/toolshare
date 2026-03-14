import axios from 'axios';
import { authStorage } from '../utils/authStorage';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://toolshare-africa-api.onrender.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

const redirectTo = (targetUrl) => {
  const current = `${window.location.pathname}${window.location.search}`;

  if (current !== targetUrl) {
    window.location.assign(targetUrl);
  }
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { status, data } = error.response || {};

    if (status === 401) {
      authStorage.clearSession();
      redirectTo('/login');
    }

    if (status === 403 && data?.suspended) {
      authStorage.clearSession();
      const reason = encodeURIComponent(data.reason || 'Policy violation');
      redirectTo(`/suspended?reason=${reason}`);
    }

    return Promise.reject(error);
  }
);

export default api;
