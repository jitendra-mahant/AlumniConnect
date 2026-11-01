import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from './ui';

export default function ProtectedRoute({ roles, children, allowPending = false }) {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) return <PageLoader label="Checking your session…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;

  const isVerified = user.role === 'admin' || (user.verificationStatus === 'verified' && user.isVerified !== false);

  // If user is pending or rejected and tries to access protected features
  if (!isVerified && !allowPending) {
    return <Navigate to="/pending-verification" replace />;
  }

  // If verified user accesses /pending-verification, redirect to dashboard
  if (isVerified && location.pathname === '/pending-verification') {
    return <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/teacher/dashboard' : '/dashboard'} replace />;
  }

  // Role authorization guard
  if (roles && !roles.includes(user.role)) {
    const requiredRoleName = roles.includes('teacher')
      ? 'Faculty & Project Guide'
      : roles.includes('admin')
      ? 'College Administrator'
      : 'Student or Alumni';

    const loginRoleParam = roles.includes('teacher') ? 'teacher' : roles.includes('admin') ? 'admin' : 'student';

    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="card max-w-md w-full p-6 sm:p-7 text-center space-y-4 shadow-xl border border-amber-200/80 dark:border-amber-900/60 bg-white dark:bg-slate-900">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 ring-4 ring-amber-50 dark:ring-amber-900/30">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {requiredRoleName} Access Required
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              You are currently signed in as <b className="text-slate-900 dark:text-white">{user.name || user.email}</b> with the role <span className="inline-block px-2 py-0.5 rounded text-xs font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{user.role}</span>.
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              This section is restricted to {requiredRoleName} accounts. Please sign in with your authorized credentials.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                logout();
                navigate(`/login?role=${loginRoleParam}&from=${encodeURIComponent(location.pathname)}`);
              }}
              className="btn-primary w-full py-2.5 font-bold flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" /> Sign In as {requiredRoleName}
            </button>

            <Link
              to={user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/teacher/dashboard' : '/dashboard'}
              className="btn-secondary w-full py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Return to My Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
