import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from './ui';

export default function ProtectedRoute({ roles, children, allowPending = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

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

  if (roles && !roles.includes(user.role)) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return children;
}
