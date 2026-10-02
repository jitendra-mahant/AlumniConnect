import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LogOut, Bell } from 'lucide-react';


const links = [
  { name: 'Home', path: '/' },
  { name: 'Find Alumni', path: '/network' },
  { name: 'Opportunities', path: '/jobs' },
  { name: 'Mentorship', path: '/mentors' },
  { name: 'Referrals', path: '/referrals' },
];

// Sample notifications. Asli project mein ye backend se aate
const firstNotifications = [
  { id: 1, text: 'Sneha Kulkarni accepted your mentorship request', time: '2 min ago', read: false },
  { id: 2, text: 'New job posted: Frontend Intern at Persistent', time: '1 hour ago', read: false },
  { id: 3, text: 'Alumni Meet 2026 is on 12 Oct', time: 'Yesterday', read: true },
];

export default function DashboardLayout({ onLogout }) {
  const location = useLocation();
  const [open, setOpen] = useState(false); // dropdown khula hai ya nahi
  const [notifications, setNotifications] = useState(firstNotifications);

  // kitne notifications abhi padhe nahi gaye
  const unread = notifications.filter((n) => !n.read).length;

  // ek notification pe click karo toh wo "read" ho jaata hai
  const markRead = (id) =>
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const markAllRead = () =>
    setNotifications(notifications.map((n) => ({ ...n, read: true })));

  return (
    <>
      {/* ===== Navbar ===== */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-2xl font-extrabold text-brand-800">
            Alumni<span className="text-brand-500">Connect</span>
          </Link>

          <nav className="flex items-center gap-7">
            {links.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={
                  location.pathname === item.path
                    ? 'text-sm font-semibold text-brand-800'
                    : 'text-sm text-slate-500 hover:text-slate-900'
                }
              >
                {item.name}
              </Link>
            ))}

            {/* ===== Notification bell ===== */}
            {/* Bahar click karne par band karne ke liye ek transparent parda */}
            {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}

            <div className="relative z-50">
              <button onClick={() => setOpen(!open)} className="relative text-slate-500 hover:text-slate-900">
                <Bell size={22} />
                {/* laal badge: sirf tab dikhta hai jab unread > 0 */}
                {unread > 0 && (
                  <span className="absolute -top-2 -right-2 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {unread}
                  </span>
                )}
              </button>

              {/* Dropdown: open true ho tabhi dikhta hai */}
              {open && (
                <div className="absolute right-0 top-10 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-100 p-4">
                    <p className="font-bold text-slate-900">Notifications</p>
                    <button onClick={markAllRead} className="text-xs font-semibold text-brand-600">
                      Mark all as read
                    </button>
                  </div>

                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`block w-full border-b border-slate-100 p-4 text-left hover:bg-slate-50 ${n.read ? '' : 'bg-brand-50'}`}
                    >
                      <p className={`text-sm ${n.read ? 'text-slate-500' : 'font-semibold text-slate-900'}`}>{n.text}</p>
                      <p className="mt-1 text-xs text-slate-400">{n.time}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Profile */}
            <Link to="/profile" className="w-10 h-10 rounded-full bg-brand-800 text-white text-sm font-bold grid place-items-center">
              JM
            </Link>
              {/* Sign Out */}
<button
  type="button"
  onClick={onLogout}
  title="Sign out"
  aria-label="Sign out"
  className="text-slate-500 hover:text-red-600"
>
  <LogOut size={20} />
</button>
</nav>
</div>
</header>

      {/* ===== Page content ===== */}
      <main className="page max-w-6xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </>
  );
}
