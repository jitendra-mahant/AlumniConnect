import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  LogOut,
  Mail,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  User,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/format';

export default function PendingVerification() {
  const { user, profile, refresh, logout } = useAuth();
  const { socket } = useSocket();
  const toast = useToast();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  // If already verified or admin, automatically redirect to dashboard
  useEffect(() => {
    if (user?.role === 'admin' || (user?.verificationStatus === 'verified' && user?.isVerified !== false)) {
      const target = user?.role === 'admin' ? '/admin' : user?.role === 'teacher' ? '/teacher/dashboard' : '/dashboard';
      navigate(target, { replace: true });
    }
  }, [user, navigate]);

  // Revalidate status from server
  const checkStatus = async (silent = false) => {
    if (!silent) setChecking(true);
    try {
      await refresh();
      if (!silent) toast.success('Verification status refreshed from server');
    } catch {
      if (!silent) toast.error('Failed to revalidate status. Please try again.');
    } finally {
      if (!silent) setChecking(false);
    }
  };

  // Auto-poll verification status every 10 seconds while on this screen
  useEffect(() => {
    const timer = setInterval(() => {
      checkStatus(true);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Real-time socket listener for instant verification activation
  useEffect(() => {
    if (!socket) return;
    const handleVerified = (data) => {
      if (data?.verificationStatus === 'verified') {
        toast.success('Your profile has been approved by the administrator!');
        checkStatus(true);
      }
    };
    const handleNotification = (notif) => {
      if (notif?.type === 'verification') {
        checkStatus(true);
      }
    };

    socket.on('user:verified', handleVerified);
    socket.on('notification', handleNotification);
    return () => {
      socket.off('user:verified', handleVerified);
      socket.off('notification', handleNotification);
    };
  }, [socket]);

  const isRejected = user?.verificationStatus === 'rejected';

  return (
    <div className="min-h-screen bg-[var(--page-bg)] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-2xl space-y-6">
        {/* Institutional Header & Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <img
              src="/kkwagh-logo.png"
              alt="K. K. Wagh Logo"
              className="h-12 w-12 object-contain"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Alumni<span className="text-brand-600 dark:text-brand-400">Connect</span>
          </h1>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            K.K. Wagh Institute of Engineering Education & Research (KKWAGH), Nashik
          </p>
        </div>

        {/* Verification Status Banner */}
        {isRejected ? (
          <div className="rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-5 text-sm text-rose-900 dark:text-rose-200 shadow-card space-y-2">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-base">Account Verification Rejected</p>
                <p className="mt-1 text-xs text-rose-800 dark:text-rose-300">
                  Your profile registration was not approved by the college administrator.
                  {user?.verificationNote ? ` Reason: ${user.verificationNote}` : ' Please contact your department coordinator.'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-300 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 p-5 text-sm text-amber-900 dark:text-amber-200 shadow-card">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-base">Profile Awaiting Administrator Verification</p>
                <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                  Your profile is awaiting college administrator verification. You will be notified as soon as it is approved.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* User's Own Basic Profile Card */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <User className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              Your Account Details
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                isRejected
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              {isRejected ? <XCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
              {isRejected ? 'Verification Rejected' : 'Pending Verification'}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-xs sm:text-sm">
            <div className="space-y-1">
              <p className="text-slate-400 dark:text-slate-500 font-semibold text-[11px] uppercase">Full Name</p>
              <p className="font-bold text-slate-900 dark:text-white">{user?.name || 'User'}</p>
            </div>

            <div className="space-y-1">
              <p className="text-slate-400 dark:text-slate-500 font-semibold text-[11px] uppercase">Institutional Email</p>
              <p className="font-mono font-medium text-slate-800 dark:text-slate-200">{user?.email}</p>
            </div>

            <div className="space-y-1">
              <p className="text-slate-400 dark:text-slate-500 font-semibold text-[11px] uppercase">Platform Role</p>
              <p className="capitalize font-semibold text-slate-800 dark:text-slate-200">{user?.role}</p>
            </div>

            <div className="space-y-1">
              <p className="text-slate-400 dark:text-slate-500 font-semibold text-[11px] uppercase">Institution</p>
              <p className="font-medium text-slate-800 dark:text-slate-200">{user?.institution || 'KKWAGH Nashik'}</p>
            </div>

            {user?.createdAt && (
              <div className="space-y-1">
                <p className="text-slate-400 dark:text-slate-500 font-semibold text-[11px] uppercase">Registered On</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">{formatDate(user.createdAt)}</p>
              </div>
            )}

            {profile?.currentCompany && (
              <div className="space-y-1">
                <p className="text-slate-400 dark:text-slate-500 font-semibold text-[11px] uppercase">Company / Role</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {profile.currentJobTitle} at {profile.currentCompany}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Clear Explanation of Next Steps */}
        <div className="card p-6 space-y-4 bg-slate-50/60 dark:bg-slate-900/40">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            Why does AlumniConnect require administrator verification?
          </h3>
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
            <p>
              AlumniConnect is an authorized collegiate platform for <strong>K.K. Wagh Institute of Engineering Education & Research</strong>. To safeguard student and alumni privacy and prevent unauthorized access, all registrations are verified by a designated college administrator.
            </p>
            <p>
              While in pending status, access to the alumni directory, peer messaging, placement referrals, and mentorship features is restricted. As soon as your administrator approves your registration, your full account permissions will be granted immediately.
            </p>
          </div>
        </div>

        {/* Actions: Refresh & Logout */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => checkStatus(false)}
            disabled={checking}
            className="btn-primary w-full sm:w-auto"
          >
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh Verification Status
          </button>

          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="btn-secondary w-full sm:w-auto text-slate-600 dark:text-slate-300"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
