// ─── PrivateRoute.jsx — protected route guard ─────────────────────────────────
//
// WHY check loading before user?
// On a page refresh, loading=true for ~300ms while loadUser() runs.
// If we checked user first, every protected page would flash a redirect
// to /login before the profile check completes and sets user to the real value.
// Showing a LoadingScreen while loading=true eliminates that flash.
//
// WHY replace: true on the Navigate?
// Without it, the browser history would have /login as a navigable entry.
// The user could hit Back and end up on /login after logging in. replace:true
// removes that entry so Back goes to wherever they came from.
//
// WHY pass the current path as ?redirect= to /login?
// After login, the user should land on the page they tried to reach, not
// always /dashboard. Login.jsx reads searchParams.get('redirect') and uses
// it in navigate(redirectTo, { replace: true }).

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/ui/LoadingScreen';

export default function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location          = useLocation();

  // Step 1 — still checking session, show spinner
  if (loading) return <LoadingScreen />;

  // Step 2 — no session at all → send to login with return URL
  if (!user) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  // Step 3 — wrong role (e.g. renter accessing /tools/new) → dashboard
  // WHY allow admin to access any role-gated route?
  // Admin needs to be able to test and access all parts of the platform.
  if (role && user.role !== role && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Step 4 — authenticated and authorised
  return children;
}

// ── PublicRoute ────────────────────────────────────────────────────────────────
// Wraps /login and /register. Redirects to /dashboard if already logged in.
// WHY? If a logged-in user manually navigates to /login, they'd see the login
// form with their session active — confusing. Redirect them away.
export function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user)    return <Navigate to="/dashboard" replace />;
  return children;
}