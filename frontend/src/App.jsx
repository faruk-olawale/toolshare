import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LoadingScreen from './components/ui/LoadingScreen';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Welcome from './pages/Welcome';
import BrowseTools from './pages/BrowseTools';
import ToolDetail from './pages/ToolDetail';
import Dashboard from './pages/Dashboard';
import AddTool from './pages/AddTool';
import EditTool from './pages/EditTool';
import MyTools from './pages/MyTools';
import MyBookings from './pages/MyBookings';
import OwnerBookings from './pages/OwnerBookings';
import BankDetails from './pages/BankDetails';
import KYCVerification from './pages/KYCVerification';
import GoogleSuccess from './pages/GoogleSuccess';
import AdminDashboard from './pages/AdminDashboard';
import MapSearch from './pages/MapSearch';
import MessageCenter from './pages/MessageCenter';

import HelpCenter from './pages/support/HelpCenter';
import Terms from './pages/support/Terms';
import Privacy from './pages/support/Privacy';
import Safety from './pages/support/Safety';
import Contact from './pages/support/Contact';

import NotFound from './pages/NotFound';

/* ──────────────────────────────────────────────────────────────
   ROUTE GUARDS
────────────────────────────────────────────────────────────── */

function PrivateRoute({ children, capability }) {
  const { user, loading, can, needsOnboarding } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Force onboarding first
  if (needsOnboarding) {
    return <Navigate to="/welcome" replace />;
  }

  // Permission checks
  if (capability === 'canRent' && !can?.rent) {
    return <Navigate to="/dashboard" replace />;
  }

  if (capability === 'canList' && !can?.list) {
    return <Navigate to="/dashboard" replace />;
  }

  if (capability === 'admin' && !can?.admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { user, loading, needsOnboarding } = useAuth();

  if (loading) return <LoadingScreen />;

  if (user) {
    if (needsOnboarding) {
      return <Navigate to="/welcome" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Logged in only, but no onboarding redirect
function WelcomeRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/* ──────────────────────────────────────────────────────────────
   LAYOUT
────────────────────────────────────────────────────────────── */

const FULLSCREEN_ROUTES = ['/welcome'];

function Layout({ children }) {
  const location = useLocation();

  const isFullscreen = FULLSCREEN_ROUTES.includes(location.pathname);

  if (isFullscreen) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f7]">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   APP
────────────────────────────────────────────────────────────── */

export default function App() {
  const { loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Layout>
      <Routes>

        {/* PUBLIC */}
        <Route path="/" element={<Landing />} />
        <Route path="/tools" element={<BrowseTools />} />
        <Route path="/tools/:id" element={<ToolDetail />} />
        <Route path="/map" element={<MapSearch />} />

        <Route path="/help" element={<HelpCenter />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/safety" element={<Safety />} />
        <Route path="/contact" element={<Contact />} />

        {/* AUTH */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* GOOGLE OAUTH */}
        <Route path="/auth/google/success" element={<GoogleSuccess />} />

        {/* ONBOARDING */}
        <Route
          path="/welcome"
          element={
            <WelcomeRoute>
              <Welcome />
            </WelcomeRoute>
          }
        />

        {/* PRIVATE SHARED */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/kyc"
          element={
            <PrivateRoute>
              <KYCVerification />
            </PrivateRoute>
          }
        />

        <Route
          path="/messages"
          element={
            <PrivateRoute>
              <MessageCenter />
            </PrivateRoute>
          }
        />

        {/* OLD notifications route redirects */}
        <Route
          path="/notifications"
          element={<Navigate to="/messages" replace />}
        />

        {/* RENTER */}
        <Route
          path="/bookings"
          element={
            <PrivateRoute capability="canRent">
              <MyBookings />
            </PrivateRoute>
          }
        />

        {/* OWNER / LISTER */}
        <Route
          path="/tools/new"
          element={
            <PrivateRoute capability="canList">
              <AddTool />
            </PrivateRoute>
          }
        />

        <Route
          path="/tools/:id/edit"
          element={
            <PrivateRoute capability="canList">
              <EditTool />
            </PrivateRoute>
          }
        />

        <Route
          path="/my-tools"
          element={
            <PrivateRoute capability="canList">
              <MyTools />
            </PrivateRoute>
          }
        />

        <Route
          path="/booking-requests"
          element={
            <PrivateRoute capability="canList">
              <OwnerBookings />
            </PrivateRoute>
          }
        />

        <Route
          path="/bank-details"
          element={
            <PrivateRoute capability="canList">
              <BankDetails />
            </PrivateRoute>
          }
        />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <PrivateRoute capability="admin">
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </Layout>
  );
}