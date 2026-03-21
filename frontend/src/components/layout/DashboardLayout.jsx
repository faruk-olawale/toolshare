import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../notifications/NotificationBell';
import {
  LayoutDashboard, Package, BookOpen, PlusCircle, Landmark,
  MessageSquare, LogOut, Menu, X, Wrench, ShieldCheck,
  MapPin, Search, ChevronRight, Zap, Store, HelpCircle,
  Settings
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchVal,   setSearchVal]   = useState('');

  const handleLogout = () => { logout(); navigate('/'); };
  const isActive = (path) => location.pathname === path;
  const close    = () => setSidebarOpen(false);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchVal.trim()) {
      navigate(`/tools?search=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal('');
    }
  };

  const ownerLinks = [
    { to: '/dashboard',        icon: <LayoutDashboard size={16} />, label: 'Overview' },
    { to: '/my-tools',         icon: <Package size={16} />,         label: 'My Tools' },
    { to: '/booking-requests', icon: <BookOpen size={16} />,        label: 'Bookings' },
    { to: '/messages',         icon: <MessageSquare size={16} />,   label: 'Messages' },
    { to: '/bank-details',     icon: <Landmark size={16} />,        label: 'Payouts' },
    { to: '/kyc',              icon: <ShieldCheck size={16} />,     label: 'Verification' },
  ];

  const ownerActions = [
    { to: '/tools/new', icon: <PlusCircle size={16} />, label: 'List a Tool', cta: true },
  ];

  const renterLinks = [
    { to: '/dashboard', icon: <LayoutDashboard size={16} />, label: 'Overview' },
    { to: '/bookings',  icon: <BookOpen size={16} />,        label: 'My Bookings' },
    { to: '/messages',  icon: <MessageSquare size={16} />,   label: 'Messages' },
    { to: '/kyc',       icon: <ShieldCheck size={16} />,     label: 'Verification' },
  ];

  const renterActions = [
    { to: '/tools', icon: <Store size={16} />, label: 'Browse Tools', cta: true },
  ];

  const adminLinks = [
    { to: '/dashboard', icon: <LayoutDashboard size={16} />, label: 'Overview' },
    { to: '/admin',     icon: <Zap size={16} />,             label: 'Admin Panel' },
    { to: '/messages',  icon: <MessageSquare size={16} />,   label: 'Messages' },
  ];

  const navLinks   = user?.role === 'owner' ? ownerLinks  : user?.role === 'admin' ? adminLinks  : renterLinks;
  const ctaActions = user?.role === 'owner' ? ownerActions : user?.role === 'admin' ? [] : renterActions;

  const roleColor  = user?.role === 'admin' ? 'from-red-500 to-rose-600'
                   : user?.role === 'owner' ? 'from-[#1a5c3a] to-[#3d9166]'
                   : 'from-blue-500 to-cyan-500';

  const roleBg     = user?.role === 'admin' ? 'bg-red-500'
                   : user?.role === 'owner' ? 'bg-[#1a5c3a]'
                   : 'bg-blue-500';

  const pageName = [...navLinks, ...ctaActions].find(l => isActive(l.to))?.label || 'Dashboard';

  const NavLink = ({ to, icon, label, cta }) => {
    const active = isActive(to);
    return (
      <Link key={to} to={to} onClick={close}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all relative ${
          active
            ? 'bg-[#1a5c3a] text-white shadow-md shadow-[#1a5c3a]/20'
            : cta
            ? 'bg-[#1a5c3a]/15 text-[#6db591] hover:bg-[#1a5c3a]/25 hover:text-white border border-[#1a5c3a]/20'
            : 'text-[#8fa89c] hover:bg-white/6 hover:text-white'
        }`}>
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#6db591] rounded-r-full" />
        )}
        <span className={`flex-shrink-0 transition-colors ${active ? 'text-white' : 'group-hover:text-white'}`}>
          {icon}
        </span>
        <span className="flex-1 truncate">{label}</span>
        {active && <ChevronRight size={12} className="text-white/40 flex-shrink-0" />}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: 'linear-gradient(180deg, #0d1a13 0%, #0f2018 100%)' }}>

      {/* Logo */}
      <Link to="/" onClick={close} className="flex items-center gap-3 px-5 pt-6 pb-4 flex-shrink-0">
        <div className="w-8 h-8 bg-gradient-to-br from-[#1a5c3a] to-[#3d9166] rounded-xl flex items-center justify-center shadow-lg ring-1 ring-[#3d9166]/30">
          <Wrench size={15} className="text-white" />
        </div>
        <div>
          <span className="font-bold text-white text-sm leading-none tracking-tight">ToolShare</span>
          <span className="block text-[10px] text-[#6db591] font-semibold leading-none mt-0.5 uppercase tracking-[0.12em]">Africa</span>
        </div>
      </Link>

      {/* User profile card */}
      <div className="mx-3 mb-5 p-3 rounded-2xl border border-white/[0.06] flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className={`w-9 h-9 bg-gradient-to-br ${roleColor} rounded-xl flex items-center justify-center flex-shrink-0 text-white text-sm font-bold shadow-md`}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-white truncate leading-tight">{user?.name?.split(' ')[0]}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${roleBg}`} />
            <p className="text-[11px] text-[#8fa89c] capitalize">{user?.role}</p>
          </div>
        </div>
        <Link to="/kyc" onClick={close} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0">
          <Settings size={13} className="text-[#6b7c74]" />
        </Link>
      </div>

      {/* CTA action */}
      {ctaActions.length > 0 && (
        <div className="px-3 mb-4">
          {ctaActions.map(l => <NavLink key={l.to} {...l} />)}
        </div>
      )}

      {/* Nav section */}
      <div className="px-4 mb-2">
        <p className="text-[10px] font-semibold text-[#4a6358] uppercase tracking-[0.14em]">Menu</p>
      </div>
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
        {navLinks.map(l => <NavLink key={l.to} {...l} />)}
      </nav>

      {/* Bottom links */}
      <div className="px-3 pt-3 border-t border-white/[0.06] space-y-0.5 flex-shrink-0">
        <Link to="/tools" onClick={close}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#8fa89c] hover:bg-white/6 hover:text-white transition-all">
          <MapPin size={16} /> Marketplace
        </Link>
        <Link to="/help" onClick={close}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#8fa89c] hover:bg-white/6 hover:text-white transition-all">
          <HelpCircle size={16} /> Help Center
        </Link>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-red-400/80 hover:bg-red-500/10 hover:text-red-300 transition-all">
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      {/* Version */}
      <div className="px-5 py-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] text-[#4a6358] font-medium">All systems operational</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: '#f4f6f5' }}>

      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-[220px] fixed top-0 left-0 h-full z-40 shadow-xl">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
          <aside className="relative flex flex-col w-[220px] h-full shadow-2xl z-10">
            <button onClick={close} className="absolute top-4 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 z-10 transition-colors">
              <X size={15} className="text-white" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 md:ml-[220px] flex flex-col min-h-screen">

        {/* Top header */}
        <header className="sticky top-0 z-30 h-[58px] flex items-center justify-between px-4 md:px-6 border-b border-gray-200/60"
          style={{ background: 'rgba(244,246,245,0.92)', backdropFilter: 'blur(12px)' }}>

          {/* Left */}
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Menu size={17} className="text-gray-600" />
            </button>
            <div className="hidden md:block">
              <p className="text-[13px] font-semibold text-gray-900 leading-tight">{pageName}</p>
              <p className="text-[11px] text-gray-400">
                {new Date().toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
            </div>
            {/* Mobile logo */}
            <div className="flex items-center gap-1.5 md:hidden">
              <div className="w-6 h-6 bg-[#1a5c3a] rounded-lg flex items-center justify-center">
                <Wrench size={12} className="text-white" />
              </div>
              <span className="font-bold text-gray-900 text-sm">ToolShare</span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Search — desktop */}
            <div className="hidden md:flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 w-52 hover:border-gray-300 transition-colors shadow-sm">
              <Search size={13} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search tools..."
                className="bg-transparent text-xs text-gray-700 placeholder-gray-400 outline-none w-full"
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                onKeyDown={handleSearch}
              />
              {searchVal && (
                <button onClick={() => setSearchVal('')} className="text-gray-300 hover:text-gray-500">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Notification bell */}
            <NotificationBell />

            {/* Avatar */}
            <div className={`w-8 h-8 bg-gradient-to-br ${roleColor} rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm cursor-pointer ring-2 ring-white`}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}