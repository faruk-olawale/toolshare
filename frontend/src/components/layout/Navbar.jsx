import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, Wrench, ChevronDown, LogOut, User, Package, BookOpen, PlusCircle, Landmark } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); setDropdownOpen(false); };
  const isActive = (path) => location.pathname === path;
  const close = () => { setDropdownOpen(false); setMobileOpen(false); };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
              <Wrench size={18} className="text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-gray-900 text-lg leading-none">ToolShare</span>
              <span className="block text-xs text-brand-500 font-medium leading-none">Africa</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link to="/tools" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/tools') ? 'bg-brand-50 text-brand-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
              Browse Tools
            </Link>

            {!user ? (
              <div className="flex items-center gap-2 ml-2">
                <Link to="/login" className="btn-secondary py-2 px-4 text-sm">Sign In</Link>
                <Link to="/register" className="btn-primary py-2 px-4 text-sm">Get Started</Link>
              </div>
            ) : (
              <div className="relative ml-2">
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-earth-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{user.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800 leading-none">{user.name?.split(' ')[0]}</p>
                    <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                  </div>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 animate-fade-in">
                    <Link to="/dashboard" onClick={close} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <User size={15} className="text-gray-400" /> Dashboard
                    </Link>

                    {user.role === 'owner' && (<>
                      <Link to="/my-tools" onClick={close} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <Package size={15} className="text-gray-400" /> My Tools
                      </Link>
                      <Link to="/booking-requests" onClick={close} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <BookOpen size={15} className="text-gray-400" /> Booking Requests
                      </Link>
                      <Link to="/bank-details" onClick={close} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <Landmark size={15} className="text-gray-400" /> Payout Settings
                        {!user.bankDetails?.recipientCode && (
                          <span className="ml-auto w-2 h-2 bg-yellow-400 rounded-full" title="Bank details needed"></span>
                        )}
                      </Link>
                      <Link to="/tools/new" onClick={close} className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-600 hover:bg-brand-50 font-medium">
                        <PlusCircle size={15} /> List a Tool
                      </Link>
                    </>)}

                    {user.role === 'renter' && (
                      <Link to="/bookings" onClick={close} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <BookOpen size={15} className="text-gray-400" /> My Bookings
                      </Link>
                    )}

                    <hr className="my-1 border-gray-100" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-50">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100 pt-4 animate-slide-up">
            <Link to="/tools" onClick={close} className="block py-2.5 px-3 text-gray-700 hover:bg-gray-50 rounded-lg">Browse Tools</Link>
            {!user ? (
              <div className="flex flex-col gap-2 mt-3">
                <Link to="/login" onClick={close} className="btn-secondary text-center">Sign In</Link>
                <Link to="/register" onClick={close} className="btn-primary text-center">Get Started</Link>
              </div>
            ) : (<>
              <Link to="/dashboard" onClick={close} className="block py-2.5 px-3 text-gray-700 hover:bg-gray-50 rounded-lg">Dashboard</Link>
              {user.role === 'owner' && (<>
                <Link to="/my-tools" onClick={close} className="block py-2.5 px-3 text-gray-700 hover:bg-gray-50 rounded-lg">My Tools</Link>
                <Link to="/booking-requests" onClick={close} className="block py-2.5 px-3 text-gray-700 hover:bg-gray-50 rounded-lg">Booking Requests</Link>
                <Link to="/bank-details" onClick={close} className="block py-2.5 px-3 text-gray-700 hover:bg-gray-50 rounded-lg">Payout Settings</Link>
                <Link to="/tools/new" onClick={close} className="block py-2.5 px-3 text-brand-600 font-medium hover:bg-brand-50 rounded-lg">List a Tool</Link>
              </>)}
              {user.role === 'renter' && (
                <Link to="/bookings" onClick={close} className="block py-2.5 px-3 text-gray-700 hover:bg-gray-50 rounded-lg">My Bookings</Link>
              )}
              <button onClick={handleLogout} className="mt-2 block w-full text-left py-2.5 px-3 text-red-500 hover:bg-red-50 rounded-lg">Sign Out</button>
            </>)}
          </div>
        )}
      </div>
    </nav>
  );
}