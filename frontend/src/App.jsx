import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LoadingScreen from './components/ui/LoadingScreen';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
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
import HelpCenter from './pages/support/HelpCenter';
import Terms from './pages/support/Terms';
import Privacy from './pages/support/Privacy';
import Safety from './pages/support/Safety';
import Contact from './pages/support/Contact';
import NotFound from './pages/NotFound';

const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

export default function App() {
  const { loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f7]">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/tools" element={<BrowseTools />} />
          <Route path="/tools/:id" element={<ToolDetail />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/auth/google/success" element={<GoogleSuccess />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/safety" element={<Safety />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/kyc" element={<PrivateRoute><KYCVerification /></PrivateRoute>} />
          <Route path="/tools/new" element={<PrivateRoute role="owner"><AddTool /></PrivateRoute>} />
          <Route path="/tools/:id/edit" element={<PrivateRoute role="owner"><EditTool /></PrivateRoute>} />
          <Route path="/my-tools" element={<PrivateRoute role="owner"><MyTools /></PrivateRoute>} />
          <Route path="/bank-details" element={<PrivateRoute role="owner"><BankDetails /></PrivateRoute>} />
          <Route path="/bookings" element={<PrivateRoute role="renter"><MyBookings /></PrivateRoute>} />
          <Route path="/booking-requests" element={<PrivateRoute role="owner"><OwnerBookings /></PrivateRoute>} />
          <Route path="/map" element={<MapSearch />} />
        <Route path="/admin" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}