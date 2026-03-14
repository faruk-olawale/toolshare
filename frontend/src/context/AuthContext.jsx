import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { authStorage } from '../utils/authStorage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authStorage.getStoredUser());
  const [loading, setLoading] = useState(true);

  const clearAuthState = useCallback(() => {
    authStorage.clearSession();
    setUser(null);
  }, []);

  const syncUser = useCallback((nextUser) => {
    setUser(nextUser);

    const token = authStorage.getToken();
    if (token) {
      authStorage.setSession({ token, user: nextUser });
    }
  }, []);

  const loadUser = useCallback(async () => {
   const token = authStorage.getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/profile');
      syncUser(data.user);
    } catch {
      clearAuthState();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

   useEffect(() => {
    const onStorage = (event) => {
      if ([authStorage.keys.token, authStorage.keys.user].includes(event.key)) {
        setUser(authStorage.getStoredUser());
      }
    };

    const onAuthCleared = () => {
      setUser(null);
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(authStorage.keys.clearedEvent, onAuthCleared);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(authStorage.keys.clearedEvent, onAuthCleared);
    };
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    authStorage.setSession({ token: data.token, user: data.user });
    setUser(data.user);
    return data;
  };

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    authStorage.setSession({ token: data.token, user: data.user });
    setUser(data.user);
    return data;
  };

  const logout = () => {
    setUser(null);
    clearAuthState();
  };

   const updateUser = (updatedUser) => {
    syncUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
