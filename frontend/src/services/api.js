import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://toolshare-africa-api.onrender.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tsa_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tsa_token');
      localStorage.removeItem('tsa_user');
      window.location.href = '/login';
    }
    if (error.response?.status === 403 && error.response?.data?.suspended) {
      localStorage.removeItem('tsa_token');
      localStorage.removeItem('tsa_user');
      const reason = encodeURIComponent(error.response.data.reason || 'Policy violation');
      window.location.href = `/suspended?reason=${reason}`;
    }
    return Promise.reject(error);
  }
);

export default api;