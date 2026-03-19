// ─── authStorage.js ───────────────────────────────────────────────────────────
//
// WHY a dedicated module instead of calling localStorage directly everywhere:
//
// 1. Single source of truth for the storage key names — if you ever rename
//    'tsa_token', you change it in one place, not 15.
//
// 2. Safe JSON parsing — localStorage.getItem() returns a raw string.
//    Calling JSON.parse on a non-JSON string throws a SyntaxError and crashes
//    the whole app. Every read here is wrapped in a try/catch.
//
// 3. Cross-tab sync via a custom DOM event — when Tab A logs out, Tab B needs
//    to know. We dispatch 'auth:logout' on window so any listener (AuthContext)
//    can react immediately without polling.
//
// 4. Testable — you can mock this module in unit tests without touching the DOM.

const TOKEN_KEY = 'tsa_token';
const USER_KEY  = 'tsa_user';

// ── Token ──────────────────────────────────────────────────────────────────────

/** Returns the raw JWT string, or null if not present. */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}

/** Persists a JWT token. Call this immediately after a successful login/register. */
export function setToken(token) {
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token);
}

/** Removes the JWT. Call this on logout OR when a 401 is received for a token
 *  that the user intentionally had (not the startup /profile check). */
export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ── User ───────────────────────────────────────────────────────────────────────
// WHY store the user object at all?
// On a hard refresh, AuthContext calls /auth/profile to re-hydrate. That request
// takes ~300ms on a fast connection and up to 2-3s on a cold Render start.
// Caching the user in localStorage lets us show the correct UI (Navbar, role-
// gated routes) instantly while the profile call runs in the background, then
// update when it resolves. No flash of "logged out" state.

/** Returns the parsed user object, or null. Never throws. */
export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    // Corrupted JSON in storage — treat as missing
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

/** Serialises a user object and stores it. */
export function setUser(user) {
  if (!user) return;
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Storage quota exceeded — non-fatal, just skip caching
  }
}

/** Removes the cached user object. */
export function removeUser() {
  localStorage.removeItem(USER_KEY);
}

// ── Session ────────────────────────────────────────────────────────────────────

/** Clears ALL auth state from storage and broadcasts a logout event to other
 *  open tabs so they can also clear their React state and redirect.
 *
 *  WHY window.dispatchEvent instead of localStorage's 'storage' event?
 *  The 'storage' event only fires in OTHER tabs, never in the originating tab.
 *  Our custom event fires everywhere, so the same AuthContext listener handles
 *  both the local tab and remote tabs uniformly.
 */
export function clearSession() {
  removeToken();
  removeUser();
  // Other tabs listening via window.addEventListener('auth:logout', ...)
  // will receive this and call their own logout() to clear React state.
  window.dispatchEvent(new Event('auth:logout'));
}

/** Returns true if a token exists in storage. Does NOT validate the token. */
export function hasSession() {
  return !!getToken();
}