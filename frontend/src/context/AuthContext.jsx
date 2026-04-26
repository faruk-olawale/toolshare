import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('tsa_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await api.get('/auth/profile');
      setUser(data.user);
    } catch {
      localStorage.removeItem('tsa_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  // ── Auth actions ───────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('tsa_token', data.token);
    setUser(data.user);
    return data; // includes redirect hint
  };

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    localStorage.setItem('tsa_token', data.token);
    setUser(data.user);
    return data; // includes redirect: '/welcome'
  };

  const logout = () => {
    localStorage.removeItem('tsa_token');
    setUser(null);
  };

  const updateUser = (updated) => setUser(updated);

  // ── Capability helpers ─────────────────────────────────────────────────────
  // Use these throughout the app instead of checking user.role directly.
  // They handle legacy role field as fallback during migration.

  const can = {
    // Can browse and book tools
    rent: user?.canRent === true || user?.role === 'renter' || user?.type === 'admin' || user?.role === 'admin',

    // Can create listings and manage tools
    list: user?.canList === true || user?.role === 'owner' || user?.type === 'admin' || user?.role === 'admin',

    // Admin access
    admin: user?.type === 'admin' || user?.role === 'admin',

    // Both capabilities (full marketplace user)
    both: (user?.canRent === true || user?.role === 'renter') &&
          (user?.canList === true || user?.role === 'owner'),
  };

  // Whether user needs to complete onboarding
  const needsOnboarding = user && !user.onboardingComplete && user.type !== 'admin' && user.role !== 'admin';

  // ── Upgrade actions ────────────────────────────────────────────────────────
  const completeOnboarding = async (intent) => {
    const { data } = await api.put('/auth/complete-onboarding', { intent });
    setUser(data.user);
    return data; // includes redirect hint
  };

  const upgradeListing = async () => {
    const { data } = await api.put('/auth/upgrade-listing');
    setUser(data.user);
    return data; // includes redirect hint
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      updateUser,
      can,
      needsOnboarding,
      completeOnboarding,
      upgradeListing,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};