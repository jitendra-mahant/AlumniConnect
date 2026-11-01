import { Component, Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { PageLoader } from './components/ui';
import { useAuth } from './context/AuthContext';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/AuthPages').then((module) => ({ default: module.Login })));
const Register = lazy(() => import('./pages/AuthPages').then((module) => ({ default: module.Register })));
const ForgotPassword = lazy(() => import('./pages/AuthPages').then((module) => ({ default: module.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/AuthPages').then((module) => ({ default: module.ResetPassword })));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AlumniDirectory = lazy(() => import('./pages/AlumniDirectory'));
const AlumniProfile = lazy(() => import('./pages/AlumniProfile'));
const Jobs = lazy(() => import('./pages/Jobs'));
const Mentors = lazy(() => import('./pages/Mentors'));
const Referrals = lazy(() => import('./pages/Referrals'));
const Messages = lazy(() => import('./pages/Messages'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Profile = lazy(() => import('./pages/Profile'));
const Admin = lazy(() => import('./pages/Admin'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
const QA = lazy(() => import('./pages/QA'));
const QADetail = lazy(() => import('./pages/QADetail'));
const NotFound = lazy(() => import('./pages/NotFound'));
const PendingVerification = lazy(() => import('./pages/PendingVerification'));

const home = (user) => {
  if (user?.role === 'admin') return '/admin';
  if (user?.role === 'teacher') return '/teacher/dashboard';
  return '/dashboard';
};

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (!loading && user) {
    const isVerified = user.role === 'admin' || (user.verificationStatus === 'verified' && user.isVerified !== false);
    if (!isVerified) return <Navigate to="/pending-verification" replace />;
    return <Navigate to={home(user)} replace />;
  }
  return children;
}

function AuthExpiredRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const onExpired = () => {
      const currentPath = window.location.pathname;
      if (currentPath === '/login' || currentPath === '/register' || currentPath === '/') return;
      navigate('/login?expired=1', { replace: true });
    };

    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [navigate]);

  return null;
}

class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, componentStack: '' };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ componentStack: info.componentStack || '' });
    if (import.meta.env.DEV) {
      console.error(`[route-error] ${this.props.routeName}`, error, info.componentStack);
    } else {
      console.error(`[route-error] ${this.props.routeName}`);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
          <div className="card max-w-md text-center p-8">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Something went wrong</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {this.props.routeName} could not be loaded. Retry this screen or go back to the previous page.
            </p>
            {import.meta.env.DEV && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Development error details
                </summary>
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-red-700 dark:text-red-300">
                  {this.state.error.message}
                  {this.state.componentStack}
                </pre>
              </details>
            )}
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button className="btn-primary" onClick={() => window.location.reload()}>
                Retry screen
              </button>
              <button className="btn-secondary" onClick={this.props.onBack}>
                Go back
              </button>
              <button className="btn-secondary" onClick={this.props.onDashboard}>
                Go to dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function RouteBoundary({ routeName, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  return (
    <RouteErrorBoundary
      key={`${location.pathname}${location.search}`}
      routeName={routeName}
      onBack={() => {
        if (window.history.state?.idx > 0) navigate(-1);
        else navigate(home(user), { replace: true });
      }}
      onDashboard={() => navigate(home(user), { replace: true })}
    >
      {children}
    </RouteErrorBoundary>
  );
}

export default function App() {
  return (
    <>
      <AuthExpiredRedirect />
      <Suspense fallback={<PageLoader label="Loading AlumniConnect…" />}>
        <Routes>
          <Route path="/" element={<RouteBoundary routeName="Home"><Landing /></RouteBoundary>} />
          <Route path="/login" element={<RouteBoundary routeName="Login"><GuestOnly><Login /></GuestOnly></RouteBoundary>} />
          <Route path="/register" element={<RouteBoundary routeName="Registration"><GuestOnly><Register /></GuestOnly></RouteBoundary>} />
          <Route path="/forgot-password" element={<RouteBoundary routeName="Password recovery"><GuestOnly><ForgotPassword /></GuestOnly></RouteBoundary>} />
          <Route path="/reset-password" element={<RouteBoundary routeName="Password reset"><GuestOnly><ResetPassword /></GuestOnly></RouteBoundary>} />
          <Route path="/verify-email" element={<RouteBoundary routeName="Email verification"><VerifyEmail /></RouteBoundary>} />
          <Route path="/pending-verification" element={<RouteBoundary routeName="Verification status"><ProtectedRoute allowPending><PendingVerification /></ProtectedRoute></RouteBoundary>} />

          <Route element={<RouteBoundary routeName="Dashboard navigation"><ProtectedRoute><Layout /></ProtectedRoute></RouteBoundary>}>
            <Route path="/dashboard" element={<RouteBoundary routeName="Dashboard"><ProtectedRoute roles={['student', 'alumni']}><Dashboard /></ProtectedRoute></RouteBoundary>} />
            <Route path="/teacher/dashboard" element={<RouteBoundary routeName="Teacher workspace"><ProtectedRoute roles={['teacher']}><TeacherDashboard /></ProtectedRoute></RouteBoundary>} />
            <Route path="/alumni" element={<RouteBoundary routeName="Alumni directory"><AlumniDirectory /></RouteBoundary>} />
            <Route path="/alumni/:id" element={<RouteBoundary routeName="Alumni profile"><AlumniProfile /></RouteBoundary>} />
            <Route path="/qa" element={<RouteBoundary routeName="Q&A forum"><QA /></RouteBoundary>} />
            <Route path="/qa/:id" element={<RouteBoundary routeName="Q&A discussion"><QADetail /></RouteBoundary>} />
            <Route path="/jobs" element={<RouteBoundary routeName="Jobs"><Jobs /></RouteBoundary>} />
            <Route path="/mentors" element={<RouteBoundary routeName="Mentors"><ProtectedRoute roles={['student', 'alumni']}><Mentors /></ProtectedRoute></RouteBoundary>} />
            <Route path="/referrals" element={<RouteBoundary routeName="Referrals"><ProtectedRoute roles={['student', 'alumni']}><Referrals /></ProtectedRoute></RouteBoundary>} />
            <Route path="/messages" element={<RouteBoundary routeName="Messages"><ProtectedRoute roles={['student', 'alumni', 'teacher', 'admin']}><Messages /></ProtectedRoute></RouteBoundary>} />
            <Route path="/notifications" element={<RouteBoundary routeName="Notifications"><Notifications /></RouteBoundary>} />
            <Route path="/profile" element={<RouteBoundary routeName="Profile"><ProtectedRoute roles={['student', 'alumni', 'teacher']}><Profile /></ProtectedRoute></RouteBoundary>} />
            <Route path="/admin" element={<RouteBoundary routeName="Administration"><ProtectedRoute roles={['admin']}><Admin /></ProtectedRoute></RouteBoundary>} />
          </Route>

          <Route path="*" element={<RouteBoundary routeName="Not found page"><NotFound /></RouteBoundary>} />
        </Routes>
      </Suspense>
    </>
  );
}
