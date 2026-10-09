import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Bell, BriefcaseBusiness, GraduationCap, HandHeart, HelpCircle, LayoutDashboard, LogOut, Menu, MessageSquare,
  ShieldCheck, Handshake, User as UserIcon, Users, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Avatar } from './ui';

const NAV = {
  student: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/alumni', label: 'Alumni', icon: Users },
    { to: '/qa', label: 'Q&A', icon: HelpCircle },
    { to: '/mentors', label: 'Mentors', icon: HandHeart },
    { to: '/jobs', label: 'Jobs', icon: BriefcaseBusiness },
    { to: '/referrals', label: 'Referrals', icon: Handshake },
    { to: '/messages', label: 'Messages', icon: MessageSquare },
  ],
  alumni: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/alumni', label: 'Alumni', icon: Users },
    { to: '/qa', label: 'Q&A', icon: HelpCircle },
    { to: '/mentors', label: 'Mentorship', icon: HandHeart },
    { to: '/jobs', label: 'Jobs', icon: BriefcaseBusiness },
    { to: '/referrals', label: 'Referrals', icon: Handshake },
    { to: '/messages', label: 'Messages', icon: MessageSquare },
  ],
  admin: [
    { to: '/admin', label: 'Admin', icon: ShieldCheck },
    { to: '/alumni', label: 'Alumni', icon: Users },
    { to: '/qa', label: 'Q&A', icon: HelpCircle },
    { to: '/jobs', label: 'Jobs', icon: BriefcaseBusiness },
  ],
};

export function Logo({ light = false }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${light ? 'bg-white text-navy-800' : 'bg-navy-800 text-white'}`}>
        <GraduationCap className="h-5 w-5" />
      </span>
      <span className={`font-display text-lg font-extrabold tracking-tight ${light ? 'text-white' : 'text-navy-900'}`}>
        Alumni<span className={light ? 'text-brand-300' : 'text-brand-600'}>Connect</span>
      </span>
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
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);
  const unread = useUnread();
  const items = NAV[user.role] || [];
  const displayName = profile?.fullName || user.name;

  useEffect(() => {
    const close = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenu(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
      isActive ? 'bg-navy-50 text-navy-800' : 'text-slate-600 hover:bg-slate-100 hover:text-navy-800'
    }`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} aria-label="AlumniConnect home">
            <Logo />
          </Link>

          <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Main">
            {items.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={linkClass} end={to === '/alumni'}>
                <Icon className="h-4 w-4" /> {label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link to="/notifications" className="btn-ghost relative !p-2" aria-label={`Notifications (${unread} unread)`}>
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>

            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2 rounded-full p-0.5 hover:bg-slate-100 sm:pr-3" aria-haspopup="menu" aria-expanded={menu}>
                <Avatar name={displayName} src={profile?.profilePhoto} size="sm" />
                <span className="hidden max-w-[8rem] truncate text-sm font-semibold text-slate-700 sm:block">{displayName}</span>
              </button>
              {menu && (
                <div className="absolute right-0 mt-2 w-56 animate-fade-up rounded-xl border border-slate-200 bg-white p-1.5 shadow-lift" role="menu">
                  <div className="border-b border-slate-100 px-3 py-2">
                    <p className="truncate text-sm font-semibold text-slate-800">{user.name}</p>
                    <p className="truncate text-xs capitalize text-slate-500">{user.role} · {user.email}</p>
                  </div>
                  {user.role !== 'admin' && (
                    <button onClick={() => { setMenu(false); navigate('/profile'); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" role="menuitem">
                      <UserIcon className="h-4 w-4" /> My Profile
                    </button>
                  )}
                  <button
                    onClick={() => { logout(); navigate('/'); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    role="menuitem"
                  >
                    <LogOut className="h-4 w-4" /> Log out
                  </button>
                </div>
              )}
            </div>

            <button className="btn-ghost !p-2 lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden" aria-label="Mobile">
            <div className="grid gap-1">
              {items.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className={linkClass} onClick={() => setOpen(false)} end={to === '/alumni'}>
                  <Icon className="h-4 w-4" /> {label}
                </NavLink>
              ))}
              {user.role !== 'admin' && (
                <NavLink to="/profile" className={linkClass} onClick={() => setOpen(false)}>
                  <UserIcon className="h-4 w-4" /> My Profile
                </NavLink>
              )}
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} AlumniConnect · A trusted network for students and verified alumni
      </footer>
    </div>
  );
}
