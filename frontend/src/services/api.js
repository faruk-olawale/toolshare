// ─── api.js ───────────────────────────────────────────────────────────────────
//
// WHY a shared Axios instance instead of importing axios directly in each file?
//
// 1. Interceptors run once globally — you don't have to attach Authorization
//    headers or handle 401s in every component. One place, every request.
//
// 2. The BASE_URL is resolved at module load time from your Vite env variable.
//    In development it points to localhost; in production to Render. You never
//    hardcode a URL in a component again.
//
// 3. A separate "silent" instance is used for the startup /auth/profile call
//    so that a 401 there (expired session on refresh) does NOT trigger the
//    global 401 handler and does NOT redirect the user — AuthContext handles
//    that gracefully on its own.

import axios from 'axios';
import { getToken, clearSession } from '../utils/authStorage';

// ── Resolved once at module load ───────────────────────────────────────────────
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://toolshare-africa-api.onrender.com/api';

// ── Main instance — used for ALL requests except the startup profile check ─────
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  // WHY no timeout here? Render free tier cold-starts can take 30-60s.
  // A tight timeout would cause false 401-like failures during cold start.
  // If you're on a paid Render tier you can safely set timeout: 15000.
});

// ── REQUEST interceptor ────────────────────────────────────────────────────────
// WHY read from localStorage on every request rather than storing the token
// in a module-level variable?
//
// A module-level variable is set once when the module is imported and never
// updated. If the user logs in AFTER the module was first loaded (which is
// always), the variable is stale and every authenticated request fails.
// localStorage is always fresh — it reflects whatever setToken() last wrote.
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── RESPONSE interceptor ───────────────────────────────────────────────────────
// WHY check hasToken before redirecting on 401?
//
// Without this guard, a 401 from a PUBLIC endpoint (a tool listing that the
// backend happens to protect, or a network error that returns 401) would
// trigger a redirect even though the user was never logged in to begin with.
// We only want to redirect when the user HAD a session that is now invalid.
//
// WHY window.location.href instead of React Router's navigate()?
//
// This interceptor lives outside of React's component tree — there's no Router
// context here. window.location.href is the only reliable way to redirect from
// a module-level singleton. It also fully resets React state, which is what
// you want when a session expires.
//
// WHY NOT redirect on 401 from /auth/profile?
//
// The startup loadUser() call hits /auth/profile. If the stored token is
// expired, that request 401s — but that's a NORMAL, expected state (user was
// inactive for 7 days). We should just clear storage and show the app in the
// logged-out state, not aggressively redirect. AuthContext handles this silently.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status   = error.response?.status;
    const url      = error.config?.url || '';
    const isProfileCheck = url.includes('/auth/profile');

    if (status === 401 && !isProfileCheck) {
      // User had a valid session that is now rejected — clear and redirect.
      // Avoid redirecting if we're already on /login to prevent an infinite loop.
      if (getToken() && !window.location.pathname.includes('/login')) {
        clearSession(); // clears localStorage + fires 'auth:logout' event
        window.location.href = '/login';
      }
    }

    if (status === 403 && error.response?.data?.suspended) {
      // Account suspended — clearSession() is called, then redirect with reason.
      clearSession();
      const reason = encodeURIComponent(
        error.response.data.reason || 'Policy violation'
      );
      window.location.href = `/suspended?reason=${reason}`;
    }

    return Promise.reject(error);
  }
);

// ── Silent instance — ONLY for the startup /auth/profile check ────────────────
// WHY a separate instance?
//
// The main 'api' instance has a response interceptor that redirects to /login
// on 401. If we used 'api' for the startup profile check and the token was
// expired, it would redirect before the app even renders — the user would see
// a blank flash then land on /login. That's jarring and wrong.
//
// 'silentApi' has NO response interceptor. A 401 from it simply rejects the
// promise and AuthContext handles it quietly in its catch block.
export const silentApi = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

silentApi.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);
// No response interceptor — 401s fall through to the caller (AuthContext.loadUser)

export default api;