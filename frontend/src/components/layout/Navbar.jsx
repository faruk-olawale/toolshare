import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Menu, X, ChevronDown, LogOut, User, Package, BookOpen,
  Landmark, PlusCircle, Shield, MessageSquare, ArrowLeftRight, Wrench,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, activeMode, switchMode, canSwitchMode, can } = useAuth();
  const navigate    = useNavigate();
  const location    = useLocation();
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [openTickets,  setOpenTickets]  = useState(0);
  const [switching,    setSwitching]    = useState(false);
  const dropdownRef = useRef(null);
  const ticketFetched = useRef(false);

  const close = () => { setMobileOpen(false); setDropdownOpen(false); };
  const handleLogout = () => { logout(); navigate('/'); close(); };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Admin ticket poll
  useEffect(() => {
    if (!user || !can.admin) return;
    if (ticketFetched.current) return;
    ticketFetched.current = true;
    const fetch = () => {
      api.get('/support/admin/tickets?status=open')
        .then(({ data }) => setOpenTickets(data.counts?.open || 0))
        .catch(() => {});
    };
    fetch();
    const iv = setInterval(fetch, 120000);
    return () => clearInterval(iv);
  }, [user, can.admin]);

  // ── Mode switcher handler ─────────────────────────────────────────────────
  const handleModeSwitch = async (mode) => {
    if (mode === activeMode || switching) return;
    setSwitching(true);
    await switchMode(mode);
    setSwitching(false);
    close();
    // Navigate to the right dashboard section
    if (mode === 'owner') navigate('/dashboard');
    if (mode === 'renter') navigate('/dashboard');
  };

  // ── Derived nav links based on active mode ────────────────────────────────
  const isOwnerMode  = activeMode === 'owner';
  const isRenterMode = activeMode === 'renter' || !can.list;
  const isAdmin      = can.admin;

  // Mode pill label and color
  const modePill = isAdmin ? { label: 'Admin', color: 'bg-red-100 text-red-700' }
    : isOwnerMode  ? { label: 'Owner Mode',  color: 'bg-[#eef6f1] text-[#1a5c3a]' }
    : { label: 'Renter Mode', color: 'bg-blue-50 text-blue-700' };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-8 h-8 bg-[#1a5c3a] rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
              <Wrench size={15} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-gray-900 text-[15px] leading-none tracking-tight">ToolShare</span>
              <span className="block text-[9px] text-[#6db591] font-semibold uppercase tracking-widest leading-none mt-0.5">Africa</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/tools"
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                location.pathname === '/tools'
                  ? 'bg-[#eef6f1] text-[#1a5c3a]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              Browse Tools
            </Link>

            {!user ? (
              <div className="flex items-center gap-2 ml-2">
                <Link to="/login" className="btn-secondary py-2 px-4 text-sm">Sign In</Link>
                <Link to="/register" className="py-2 px-4 text-sm font-medium text-white bg-[#1a5c3a] rounded-xl hover:bg-[#154d30] transition-colors">
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isAdmin ? 'bg-red-500' : isOwnerMode ? 'bg-[#1a5c3a]' : 'bg-blue-500'
                  }`}>
                    <span className="text-white text-xs font-bold">{user.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-800 leading-none">{user.name?.split(' ')[0]}</p>
                    <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${modePill.color}`}>
                      {modePill.label}
                    </span>
                  </div>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform flex-shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-4 top-14 mt-1 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-fade-in z-50">

                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-gray-50 mb-1">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                    </div>

                    {/* ── Mode Switcher ── */}
                    {canSwitchMode && (
                      <div className="px-3 py-2 border-b border-gray-50 mb-1">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Switch Mode</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => handleModeSwitch('renter')}
                            disabled={switching}
                            className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-medium transition-all border ${
                              activeMode === 'renter'
                                ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                                : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                            }`}
                          >
                            <span className="text-base">🔍</span>
                            <span>Renter</span>
                          </button>
                          <button
                            onClick={() => handleModeSwitch('owner')}
                            disabled={switching}
                            className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-medium transition-all border ${
                              activeMode === 'owner'
                                ? 'bg-[#1a5c3a] text-white border-[#1a5c3a] shadow-sm'
                                : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-[#eef6f1] hover:text-[#1a5c3a] hover:border-[#c0dece]'
                            }`}
                          >
                            <span className="text-base">🏠</span>
                            <span>Owner</span>
                          </button>
                        </div>
                        {switching && (
                          <p className="text-[10px] text-gray-400 text-center mt-2 animate-pulse">Switching mode...</p>
                        )}
                      </div>
                    )}

                    {/* ── Nav links based on active mode ── */}
                    <Link to="/dashboard" onClick={close} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <User size={15} className="text-gray-400 flex-shrink-0" /> Dashboard
                    </Link>
                    <Link to="/messages" onClick={close} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <MessageSquare size={15} className="text-gray-400 flex-shrink-0" /> Messages
                    </Link>

                    {/* Renter mode links */}
                    {(isRenterMode || isAdmin) && (
                      <Link to="/bookings" onClick={close} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <BookOpen size={15} className="text-gray-400 flex-shrink-0" /> My Bookings
                      </Link>
                    )}

                    {/* Owner mode links */}
                    {(isOwnerMode || isAdmin) && (<>
                      <Link to="/my-tools" onClick={close} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <Package size={15} className="text-gray-400 flex-shrink-0" /> My Tools
                      </Link>
                      <Link to="/booking-requests" onClick={close} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <BookOpen size={15} className="text-gray-400 flex-shrink-0" /> Booking Requests
                      </Link>
                      <Link to="/bank-details" onClick={close} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <Landmark size={15} className="text-gray-400 flex-shrink-0" /> Payout Settings
                      </Link>
                      <Link to="/tools/new" onClick={close} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1a5c3a] hover:bg-[#eef6f1] font-medium">
                        <PlusCircle size={15} className="flex-shrink-0" /> List a Tool
                      </Link>
                    </>)}

                    {/* Admin link */}
                    {isAdmin && (
                      <Link to="/admin" onClick={close} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium">
                        <Shield size={15} className="flex-shrink-0" />
                        Admin Dashboard
                        {openTickets > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                            {openTickets > 9 ? '9+' : openTickets}
                          </span>
                        )}
                      </Link>
                    )}

                    <a href="https://wa.me/2348119122131?text=Hi, I need help with ToolShare Africa"
                      target="_blank" rel="noopener noreferrer" onClick={close}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <span className="text-green-500 text-base flex-shrink-0">💬</span> WhatsApp Support
                    </a>

                    <hr className="my-1 border-gray-100" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">
                      <LogOut size={15} className="flex-shrink-0" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="flex md:hidden p-2 rounded-xl hover:bg-gray-50 transition-colors">
            {mobileOpen ? <X size={20} className="text-gray-600" /> : <Menu size={20} className="text-gray-600" />}
          </button>
        </div>

        {/* ── Mobile menu ── */}
        {mobileOpen && (
          <div className="md:hidden pb-5 border-t border-gray-100 pt-4 animate-slide-up space-y-0.5">

            <Link to="/tools" onClick={close} className="flex items-center gap-3 py-2.5 px-3 text-gray-700 hover:bg-gray-50 rounded-xl text-sm">
              Browse Tools
            </Link>

            {!user ? (
              <div className="flex flex-col gap-2 pt-3">
                <Link to="/login" onClick={close} className="btn-secondary text-center text-sm">Sign In</Link>
                <Link to="/register" onClick={close} className="text-center py-2.5 px-4 text-sm font-medium text-white bg-[#1a5c3a] rounded-xl">Get Started</Link>
              </div>
            ) : (<>

              {/* Mobile mode switcher */}
              {canSwitchMode && (
                <div className="mx-1 my-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Switch Mode</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleModeSwitch('renter')}
                      disabled={switching}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all border ${
                        activeMode === 'renter'
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-700'
                      }`}
                    >
                      🔍 Renter
                    </button>
                    <button
                      onClick={() => handleModeSwitch('owner')}
                      disabled={switching}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all border ${
                        activeMode === 'owner'
                          ? 'bg-[#1a5c3a] text-white border-[#1a5c3a]'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-[#3d9166] hover:text-[#1a5c3a]'
                      }`}
                    >
                      🏠 Owner
                    </button>
                  </div>
                  {switching && <p className="text-[10px] text-gray-400 text-center mt-2 animate-pulse">Switching...</p>}
                </div>
              )}

              {/* User info */}
              <div className="flex items-center gap-3 px-3 py-2 mb-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isAdmin ? 'bg-red-500' : isOwnerMode ? 'bg-[#1a5c3a]' : 'bg-blue-500'
                }`}>
                  <span className="text-white text-sm font-bold">{user.name?.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{user.name?.split(' ')[0]}</p>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${modePill.color}`}>
                    {modePill.label}
                  </span>
                </div>
              </div>

              <Link to="/dashboard" onClick={close} className="flex items-center gap-3 py-2.5 px-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl">
                <User size={15} className="text-gray-400" /> Dashboard
              </Link>
              <Link to="/messages" onClick={close} className="flex items-center gap-3 py-2.5 px-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl">
                <MessageSquare size={15} className="text-gray-400" /> Messages
              </Link>

              {/* Renter mode mobile links */}
              {(isRenterMode || isAdmin) && (
                <Link to="/bookings" onClick={close} className="flex items-center gap-3 py-2.5 px-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl">
                  <BookOpen size={15} className="text-gray-400" /> My Bookings
                </Link>
              )}

              {/* Owner mode mobile links */}
              {(isOwnerMode || isAdmin) && (<>
                <Link to="/my-tools" onClick={close} className="flex items-center gap-3 py-2.5 px-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl">
                  <Package size={15} className="text-gray-400" /> My Tools
                </Link>
                <Link to="/booking-requests" onClick={close} className="flex items-center gap-3 py-2.5 px-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl">
                  <BookOpen size={15} className="text-gray-400" /> Booking Requests
                </Link>
                <Link to="/bank-details" onClick={close} className="flex items-center gap-3 py-2.5 px-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl">
                  <Landmark size={15} className="text-gray-400" /> Payout Settings
                </Link>
                <Link to="/tools/new" onClick={close} className="flex items-center gap-3 py-2.5 px-3 text-sm text-[#1a5c3a] font-medium hover:bg-[#eef6f1] rounded-xl">
                  <PlusCircle size={15} /> List a Tool
                </Link>
              </>)}

              {isAdmin && (
                <Link to="/admin" onClick={close} className="flex items-center gap-3 py-2.5 px-3 text-sm text-red-600 font-medium hover:bg-red-50 rounded-xl">
                  <Shield size={15} /> Admin Dashboard
                  {openTickets > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {openTickets > 9 ? '9+' : openTickets}
                    </span>
                  )}
                </Link>
              )}

              <a href="https://wa.me/2348000000000?text=Hi, I need help with ToolShare Africa"
                target="_blank" rel="noopener noreferrer" onClick={close}
                className="flex items-center gap-3 py-2.5 px-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl">
                <span className="text-green-500">💬</span> WhatsApp Support
              </a>

              <div className="pt-2 border-t border-gray-100 mt-2">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 py-2.5 px-3 text-sm text-red-500 hover:bg-red-50 rounded-xl">
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </>)}
          </div>
        )}
      </div>
    </nav>
  );
}