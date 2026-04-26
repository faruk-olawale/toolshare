import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar        from './components/layout/Navbar';
import Footer        from './components/layout/Footer';
import LoadingScreen from './components/ui/LoadingScreen';

// Pages
import Landing         from './pages/Landing';
import Login           from './pages/Login';
import Register        from './pages/Register';
import Welcome         from './pages/Welcome';
import BrowseTools     from './pages/BrowseTools';
import ToolDetail      from './pages/ToolDetail';
import Dashboard       from './pages/Dashboard';
import AddTool         from './pages/AddTool';
import EditTool        from './pages/EditTool';
import MyTools         from './pages/MyTools';
import MyBookings      from './pages/MyBookings';
import OwnerBookings   from './pages/OwnerBookings';
import BankDetails     from './pages/BankDetails';
import KYCVerification from './pages/KYCVerification';
import GoogleSuccess   from './pages/GoogleSuccess';
import AdminDashboard  from './pages/AdminDashboard';
import MapSearch       from './pages/MapSearch';
import Notifications   from './pages/Notifications';
import HelpCenter      from './pages/support/HelpCenter';
import Terms           from './pages/support/Terms';
import Privacy         from './pages/support/Privacy';
import Safety          from './pages/support/Safety';
import Contact         from './pages/support/Contact';
import NotFound        from './pages/NotFound';

// ── Route guards ──────────────────────────────────────────────────────────────

// Must be logged in. Optional capability check.
// capability: 'canRent' | 'canList' | 'admin'
const PrivateRoute = ({ children, capability }) => {
  const { user, loading, can, needsOnboarding } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user)   return <Navigate to="/login" replace />;

  // Redirect to onboarding if not completed (except for /welcome itself)
  if (needsOnboarding) return <Navigate to="/welcome" replace />;

  // Capability check
  if (capability === 'canList'  && !can.list)  return <Navigate to="/dashboard" replace />;
  if (capability === 'canRent'  && !can.rent)  return <Navigate to="/dashboard" replace />;
  if (capability === 'admin'    && !can.admin) return <Navigate to="/dashboard" replace />;

  return children;
};

// Redirects already-logged-in users away from login/register
const PublicRoute = ({ children }) => {
  const { user, loading, needsOnboarding } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) {
    if (needsOnboarding) return <Navigate to="/welcome" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// /welcome is fullscreen — no Navbar or Footer
const FULLSCREEN_ROUTES = ['/welcome'];

function Layout({ children }) {
  const location     = useLocation();
  const isFullscreen = FULLSCREEN_ROUTES.includes(location.pathname);
  if (isFullscreen) return <>{children}</>;
  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f7]">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const { loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <Layout>
      <Routes>

        {/* ── Public — no auth required ── */}
        <Route path="/"          element={<Landing />} />
        <Route path="/tools"     element={<BrowseTools />} />
        <Route path="/tools/:id" element={<ToolDetail />} />
        <Route path="/map"       element={<MapSearch />} />
        <Route path="/help"      element={<HelpCenter />} />
        <Route path="/terms"     element={<Terms />} />
        <Route path="/privacy"   element={<Privacy />} />
        <Route path="/safety"    element={<Safety />} />
        <Route path="/contact"   element={<Contact />} />

        {/* ── Auth pages (redirect logged-in users) ── */}
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* ── OAuth ── */}
        <Route path="/auth/google/success" element={<GoogleSuccess />} />

        {/* ── Onboarding (fullscreen, must be logged in) ── */}
        <Route path="/welcome" element={
          // PrivateRoute without needsOnboarding check to avoid redirect loop
          <WelcomeRoute><Welcome /></WelcomeRoute>
        } />

        {/* ── Shared private routes ── */}
        <Route path="/dashboard"     element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/kyc"           element={<PrivateRoute><KYCVerification /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />

        {/* ── Renter capability required ── */}
        <Route path="/bookings" element={
          <PrivateRoute capability="canRent"><MyBookings /></PrivateRoute>
        } />

        {/* ── Listing capability required ── */}
        <Route path="/tools/new"      element={<PrivateRoute capability="canList"><AddTool /></PrivateRoute>} />
        <Route path="/tools/:id/edit" element={<PrivateRoute capability="canList"><EditTool /></PrivateRoute>} />
        <Route path="/my-tools"       element={<PrivateRoute capability="canList"><MyTools /></PrivateRoute>} />
        <Route path="/booking-requests" element={<PrivateRoute capability="canList"><OwnerBookings /></PrivateRoute>} />
        <Route path="/bank-details"   element={<PrivateRoute capability="canList"><BankDetails /></PrivateRoute>} />

        {/* ── Admin ── */}
        <Route path="/admin" element={<PrivateRoute capability="admin"><AdminDashboard /></PrivateRoute>} />

        {/* ── 404 ── */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </Layout>
  );
}

// WelcomeRoute: must be logged in, but doesn't redirect if onboarding incomplete
// (prevents infinite redirect loop between /welcome and itself)
function WelcomeRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
}