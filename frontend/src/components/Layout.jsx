import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  BriefcaseBusiness,
  GraduationCap,
  HandHeart,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Search,
  ShieldCheck,
  Handshake,
  Sun,
  Type,
  User as UserIcon,
  Users,
  X,
  Wifi,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/client';
import { Avatar } from './ui';
import ThemeFontToolbar from './ThemeFontToolbar';
import { FONTS, applyFont, applyTheme, getInitialFont, getInitialTheme } from '../utils/theme';

const NAV = {
  student: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/alumni', label: 'Alumni Directory', icon: Users },
    { to: '/qa', label: 'Q&A Forum', icon: HelpCircle },
    { to: '/mentors', label: 'Mentors', icon: HandHeart },
    { to: '/jobs', label: 'Opportunities', icon: BriefcaseBusiness },
    { to: '/referrals', label: 'Referrals', icon: Handshake },
    { to: '/messages', label: 'Messages', icon: MessageSquare },
  ],
  alumni: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/alumni', label: 'Alumni Directory', icon: Users },
    { to: '/qa', label: 'Q&A Forum', icon: HelpCircle },
    { to: '/mentors', label: 'Mentorship', icon: HandHeart },
    { to: '/jobs', label: 'Opportunities', icon: BriefcaseBusiness },
    { to: '/referrals', label: 'Referrals', icon: Handshake },
    { to: '/messages', label: 'Messages', icon: MessageSquare },
  ],
  teacher: [
    { to: '/teacher/dashboard', label: 'Guide Workspace', icon: LayoutDashboard },
    { to: '/alumni', label: 'Alumni Directory', icon: Users },
    { to: '/qa', label: 'Q&A Forum', icon: HelpCircle },
    { to: '/messages', label: 'Messages', icon: MessageSquare },
  ],
  admin: [
    { to: '/admin', label: 'Admin Portal', icon: ShieldCheck },
    { to: '/alumni', label: 'Alumni Directory', icon: Users },
    { to: '/qa', label: 'Q&A Forum', icon: HelpCircle },
    { to: '/jobs', label: 'Opportunities', icon: BriefcaseBusiness },
  ],
};

export function Logo({ light = false }) {
  return (
    <span className="flex items-center gap-2.5">
      <img
        src="/kkwagh-logo.png"
        alt="K. K. Wagh Logo"
        className="h-10 w-10 shrink-0 rounded-lg bg-white object-contain p-0.5 shadow-sm ring-1 ring-slate-200/60 dark:ring-slate-700/60"
      />
      <div className="flex flex-col text-left">
        <span className={`font-display text-base font-extrabold tracking-tight leading-tight ${light ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
          Alumni<span className={light ? 'text-brand-300' : 'text-brand-600 dark:text-brand-400'}>Connect</span>
        </span>
        <span className={`text-[10px] font-bold tracking-wider uppercase leading-none mt-0.5 ${light ? 'text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
          KKWAGH Nashik
        </span>
      </div>
    </span>
  );
}

function useUnread() {
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let alive = true;
    const load = () =>
      api
        .get('/notifications/unread-count')
        .then((r) => alive && setUnread(r.data.unread))
        .catch(() => {});
    load();
    const t = setInterval(load, 30000);
    const onRefresh = () => load();
    window.addEventListener('notifications:changed', onRefresh);
    return () => {
      alive = false;
      clearInterval(t);
      window.removeEventListener('notifications:changed', onRefresh);
    };
  }, []);
  return unread;
}

export default function Layout() {
  const { user, profile, logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);
  const unread = useUnread();
  const items = NAV[user?.role] || [];
  const displayName = profile?.fullName || user?.name;

  const [topSearch, setTopSearch] = useState('');

  // Global Theme state
  const [theme, setTheme] = useState(getInitialTheme);
  const [currentFont, setCurrentFont] = useState(getInitialFont);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const handleFontChange = (fontId) => {
    setCurrentFont(fontId);
    applyFont(fontId);
  };

  useEffect(() => {
    const close = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenu(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (topSearch.trim()) {
      navigate(`/alumni?q=${encodeURIComponent(topSearch.trim())}`);
      setTopSearch('');
    }
  };

  const homeTarget = user?.role === 'admin' ? '/admin' : user?.role === 'teacher' ? '/teacher/dashboard' : '/dashboard';

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-150 ${
      isActive
        ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 font-bold shadow-xs'
        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
    }`;

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-[var(--page-bg)] text-[var(--page-text)]">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 z-30 shadow-xs">
        {/* Sidebar Header */}
        <div className="flex h-16 items-center px-5 border-b border-slate-200/80 dark:border-slate-800">
          <Link to={homeTarget} aria-label="AlumniConnect Home">
            <Logo />
          </Link>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main Navigation">
          <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {user?.role === 'teacher' ? 'Faculty Menu' : user?.role === 'admin' ? 'Administration' : 'Network Menu'}
          </p>
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass} end={to === '/alumni'}>
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Bottom Controls & User Profile Card */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <ThemeFontToolbar className="w-full" dropUp={true} />

          {/* User Profile Capsule */}
          <div className="flex items-center gap-2.5 rounded-lg border border-slate-200/80 bg-white p-2 shadow-xs dark:border-slate-700 dark:bg-slate-800">
            <Avatar name={displayName} src={profile?.profilePhoto} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">{displayName}</p>
              <p className="truncate text-[10px] capitalize text-slate-500 dark:text-slate-400">{user?.role}</p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              title="Log out"
              aria-label="Log out"
              className="p-1 text-slate-400 hover:text-red-600 rounded transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN WRAPPER (RIGHT OF SIDEBAR) ================= */}
      <div className="flex flex-col flex-1 lg:pl-64 w-full min-w-0 max-w-full overflow-x-hidden">
        {/* Compact Top Bar */}
        <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 backdrop-blur px-4 sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-900/90 shadow-xs min-w-0">
          {/* Mobile hamburger + Logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              className="btn-ghost !p-2"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle navigation menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to={homeTarget}>
              <Logo />
            </Link>
          </div>

          {/* Top Search bar */}
          <form onSubmit={handleSearchSubmit} className="hidden sm:flex relative flex-1 max-w-md" role="search">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Quick search alumni, companies, or skills…"
              value={topSearch}
              onChange={(e) => setTopSearch(e.target.value)}
              className="input pl-9 text-xs h-9 bg-slate-50 border-slate-200 focus:bg-white dark:bg-slate-800 dark:border-slate-700"
            />
          </form>

          {/* Right Header Actions */}
          <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Top Toolbar Controls (tablet only, desktop is in sidebar) */}
            <ThemeFontToolbar className="hidden sm:flex lg:hidden" dropUp={false} />

            {/* Real-time server indicator */}
            <div className="hidden md:flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">
              <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-teal-500 animate-pulse' : 'bg-slate-400'}`} />
              <span>{isConnected ? 'Real-Time Sync' : 'Connecting'}</span>
            </div>

            {/* Notifications */}
            <Link
              to="/notifications"
              className="btn-ghost relative !p-2 rounded-lg text-slate-600 dark:text-slate-300"
              aria-label={`Notifications (${unread} unread)`}
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white shadow-xs">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>

            {/* User Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenu((m) => !m)}
                className="flex items-center gap-2 rounded-full p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 sm:pr-2 transition"
                aria-haspopup="menu"
                aria-expanded={menu}
              >
                <Avatar name={displayName} src={profile?.profilePhoto} size="sm" />
                <span className="hidden max-w-[7rem] truncate text-xs font-bold text-slate-700 dark:text-slate-200 sm:block">
                  {displayName}
                </span>
              </button>

              {menu && (
                <div
                  className="absolute right-0 mt-2 w-56 animate-fade-up rounded-xl border border-slate-200 bg-white p-1.5 shadow-lift dark:border-slate-700 dark:bg-slate-800 z-50"
                  role="menu"
                >
                  <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-700">
                    <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">{user?.name}</p>
                    <p className="truncate text-[11px] capitalize text-slate-500 dark:text-slate-400">
                      {user?.role} · {user?.email}
                    </p>
                  </div>
                  {user?.role !== 'admin' && (
                    <button
                      onClick={() => {
                        setMenu(false);
                        navigate('/profile');
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                      role="menuitem"
                    >
                      <UserIcon className="h-4 w-4" /> My Profile
                    </button>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    role="menuitem"
                  >
                    <LogOut className="h-4 w-4" /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ================= MOBILE DRAWER ================= */}
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 p-4 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                  <Logo />
                  <button onClick={() => setOpen(false)} className="btn-ghost !p-1.5 text-slate-500">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <nav className="mt-4 space-y-1">
                  {items.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className={linkClass}
                      onClick={() => setOpen(false)}
                      end={to === '/alumni'}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </NavLink>
                  ))}
                  {user?.role !== 'admin' && (
                    <NavLink to="/profile" className={linkClass} onClick={() => setOpen(false)}>
                      <UserIcon className="h-4 w-4" />
                      <span>My Profile</span>
                    </NavLink>
                  )}
                </nav>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                <ThemeFontToolbar className="w-full" dropUp={true} />

                {/* Mobile Drawer Profile Capsule */}
                <div className="flex items-center gap-2.5 rounded-lg border border-slate-200/80 bg-white p-2 shadow-xs dark:border-slate-700 dark:bg-slate-800">
                  <Avatar name={displayName} src={profile?.profilePhoto} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">{displayName}</p>
                    <p className="truncate text-[10px] capitalize text-slate-500 dark:text-slate-400">{user?.role}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    title="Log out"
                    aria-label="Log out"
                    className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Route Outlet */}
        <main className="flex-1 w-full min-w-0 max-w-full">
          <Outlet />
        </main>

        {/* Clean Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
          © {new Date().getFullYear()} AlumniConnect · K.K. Wagh Institute of Engineering Education & Research (KKWAGH), Nashik
        </footer>
      </div>
    </div>
  );
}
