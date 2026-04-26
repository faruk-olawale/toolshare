import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

// ── Mode helpers ──────────────────────────────────────────────────────────────
const STORAGE_MODE_KEY = 'tsa_mode';

const getInitialMode = (user) => {
  // Admin always stays as admin — no mode switching
  if (!user || user.type === 'admin' || user.role === 'admin') return 'admin';

  // Restore from localStorage if valid
  const stored = localStorage.getItem(STORAGE_MODE_KEY);
  if (stored === 'owner' && (user.canList || user.role === 'owner')) return 'owner';
  if (stored === 'renter') return 'renter';

  // Default: if they only have listing capability, start in owner mode
  if ((user.canList || user.role === 'owner') && !(user.canRent || user.role === 'renter')) return 'owner';

  // Otherwise default to renter
  return 'renter';
};

// ── Provider ──────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user,       setUser]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [activeMode, setActiveMode] = useState('renter');

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('tsa_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await api.get('/auth/profile');
      setUser(data.user);
      setActiveMode(getInitialMode(data.user));
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
    setActiveMode(getInitialMode(data.user));
    return data;
  };

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    localStorage.setItem('tsa_token', data.token);
    setUser(data.user);
    setActiveMode('renter'); // new users always start in renter mode
    return data;
  };

  const logout = () => {
    localStorage.removeItem('tsa_token');
    localStorage.removeItem(STORAGE_MODE_KEY);
    setUser(null);
    setActiveMode('renter');
  };

  const updateUser = (updated) => {
    setUser(updated);
    // Re-evaluate mode when user object changes (e.g. after upgrade)
    setActiveMode(prev => {
      if (prev === 'admin') return 'admin';
      return prev; // keep current mode unless invalid
    });
  };

  // ── Mode switching ─────────────────────────────────────────────────────────
  const switchMode = async (mode) => {
    if (mode === activeMode) return;
    if (mode === 'owner' && !can.list) return; // safety check

    setActiveMode(mode);
    localStorage.setItem(STORAGE_MODE_KEY, mode);

    // Sync to backend (best-effort — UI doesn't wait for this)
    api.put('/auth/active-mode', { mode }).catch(() => {});
  };

  // ── Capability helpers ─────────────────────────────────────────────────────
  // IMPORTANT: capabilities determine what a user CAN do.
  // activeMode determines what the UI SHOWS.
  // Security always uses capabilities, never activeMode.
  const can = {
    rent:  user?.canRent === true || user?.role === 'renter' || user?.type === 'admin' || user?.role === 'admin',
    list:  user?.canList === true || user?.role === 'owner'  || user?.type === 'admin' || user?.role === 'admin',
    admin: user?.type === 'admin' || user?.role === 'admin',
    both:  (user?.canRent === true || user?.role === 'renter') && (user?.canList === true || user?.role === 'owner'),
  };

  // Whether the user can see the mode switcher
  const canSwitchMode = can.both && !can.admin;

  // Onboarding check
  const needsOnboarding = user && !user.onboardingComplete && !can.admin;

  // ── Upgrade actions ────────────────────────────────────────────────────────
  const completeOnboarding = async (intent) => {
    const { data } = await api.put('/auth/complete-onboarding', { intent });
    setUser(data.user);
    if (intent === 'list') setActiveMode('owner');
    return data;
  };

  const upgradeListing = async () => {
    const { data } = await api.put('/auth/upgrade-listing');
    setUser(data.user);
    // Stay in renter mode — user can switch to owner manually when ready
    return data;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      activeMode,
      switchMode,
      canSwitchMode,
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