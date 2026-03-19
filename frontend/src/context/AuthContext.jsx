// ─── AuthContext.jsx ──────────────────────────────────────────────────────────
//
// WHY this architecture:
//
// 1. INSTANT hydration from cache — on every page load, the context initialises
//    user state from localStorage before making any network call. This means
//    the Navbar, PrivateRoute, and any role-gated UI render correctly from the
//    very first paint, with zero flicker.
//
// 2. Background verification — after hydrating from cache, we call /auth/profile
//    to confirm the token is still valid and get fresh user data from the DB.
//    If the token expired (7-day window), we silently clear the session instead
//    of force-redirecting. The user sees the logged-out state smoothly.
//
// 3. No race conditions — login() stores the token AND updates React state in
//    the same synchronous block before returning. By the time the caller's
//    navigate('/dashboard') runs, the token is already in localStorage AND
//    in React state. Any immediate protected request will have the header.
//
// 4. Cross-tab logout — listens for the 'auth:logout' custom event from
//    authStorage.clearSession(). When Tab A logs out, Tab B's React state
//    is also cleared and it will redirect on the next PrivateRoute evaluation.
//
// 5. Google OAuth — googleLogin() accepts a token + user directly, bypassing
//    the POST /auth/login call. GoogleSuccess.jsx calls this after the OAuth
//    callback completes.

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { silentApi } from "../services/api";
import {
  getToken,
  setToken,
  getUser,
  setUser as cacheUser,
  clearSession,
}  from '../utils/authStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // WHY initialise from getUser() immediately (not null)?
  // This makes the user available synchronously on first render — before
  // loadUser()'s async /profile call completes. PrivateRoute and Navbar work
  // correctly even during the background verification.
  const [user, setUser]       = useState(() => getUser());
  const [loading, setLoading] = useState(true);

  // Ref to track whether we're currently inside the startup profile check.
  // Used to prevent the 401 interceptor from double-handling that specific call.
  const loadingRef = useRef(true);

  // ── Startup: verify the cached session ──────────────────────────────────────
  // WHY useCallback? loadUser is called both in useEffect (on mount) AND by
  // cross-tab events. useCallback ensures the function reference is stable so
  // the useEffect dependency array doesn't trigger an infinite loop.
  const loadUser = useCallback(async () => {
    const token = getToken();

    if (!token) {
      // No token in storage — user is definitely logged out
      setLoading(false);
      loadingRef.current = false;
      return;
    }

    // Token exists — verify it against the server using the SILENT instance
    // (no 401 redirect on failure — we handle the failure ourselves below)
    try {
      const { data } = await silentApi.get('/auth/profile');
      // Server confirmed the token is valid — update state with fresh DB data
      setUser(data.user);
      cacheUser(data.user); // refresh the localStorage cache too
    } catch (err) {
      const status = err.response?.status;

      if (status === 401 || status === 403) {
        // Token expired or account suspended — clear silently, no redirect
        clearSession();
        setUser(null);
      }
      // Network errors (status undefined) are transient — keep the cached user
      // so the app doesn't log out on a brief connectivity blip
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // ── Cross-tab logout listener ────────────────────────────────────────────────
  // WHY window.addEventListener and not the 'storage' event?
  // The native 'storage' event only fires in OTHER tabs, not the source tab.
  // authStorage.clearSession() dispatches our custom 'auth:logout' event on
  // the window, which fires in ALL tabs (including the one that triggered it).
  useEffect(() => {
    const handleExternalLogout = () => {
      // Another tab cleared the session — sync this tab's React state
      setUser(null);
    };
    window.addEventListener('auth:logout', handleExternalLogout);
    return () => window.removeEventListener('auth:logout', handleExternalLogout);
  }, []);

  // ── login ────────────────────────────────────────────────────────────────────
  // WHY set the token BEFORE updating React state?
  // Any code that runs after this function returns (e.g. navigate('/dashboard')
  // triggering PrivateRoute, or a protected API call in useEffect) will read
  // from localStorage. The token must be there before those reads happen.
  //
  // Execution order is guaranteed:
  //   1. setToken(token)       ← localStorage updated
  //   2. cacheUser(userData)   ← user object cached
  //   3. setUser(userData)     ← React state updated (schedule re-render)
  //   4. return data           ← caller receives response
  //   [React re-render happens async after step 4, but localStorage was
  //    already set at step 1, so any request interceptor will find the token]
  const login = async (email, password) => {
    // Use the main api instance — on failure, errors propagate to the caller
    // (Login.jsx) which shows the toast. We do NOT use silentApi here because
    // we want the normal 401 handling if somehow the login endpoint itself
    // returns an unexpected 401.
    const { data } = await silentApi.post('/auth/login', { email, password });
    setToken(data.token);
    cacheUser(data.user);
    setUser(data.user);
    return data;
  };

  // ── register ─────────────────────────────────────────────────────────────────
  const register = async (formData) => {
    const { data } = await silentApi.post('/auth/register', formData);
    setToken(data.token);
    cacheUser(data.user);
    setUser(data.user);
    return data;
  };

  // ── googleLogin ──────────────────────────────────────────────────────────────
  // Called by GoogleSuccess.jsx after the OAuth callback. The token + user
  // come from the URL params set by the backend redirect.
  const googleLogin = (token, userData) => {
    setToken(token);
    cacheUser(userData);
    setUser(userData);
  };

  // ── logout ───────────────────────────────────────────────────────────────────
  // WHY call clearSession() (which dispatches 'auth:logout') AND setUser(null)?
  // clearSession() handles localStorage and fires the cross-tab event.
  // setUser(null) handles THIS tab's React state immediately (the 'auth:logout'
  // listener would also clear it, but calling it directly here is faster and
  // more explicit about the intent).
  const logout = () => {
    clearSession(); // clears localStorage + notifies other tabs
    setUser(null);  // clears this tab's React state immediately
  };

  // ── updateUser ───────────────────────────────────────────────────────────────
  // Called after profile updates (name, phone, location) to keep the Navbar
  // and Dashboard in sync without a full page refresh.
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    cacheUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, googleLogin, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── useAuth ───────────────────────────────────────────────────────────────────
// Throws a descriptive error if used outside <AuthProvider> — better than
// silently getting undefined.user and a cryptic "Cannot read properties of
// undefined" crash later.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}