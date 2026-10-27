import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import { Login, Register, ForgotPassword, ResetPassword } from './pages/AuthPages';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import AlumniDirectory from './pages/AlumniDirectory';
import AlumniProfile from './pages/AlumniProfile';
import Jobs from './pages/Jobs';
import Mentors from './pages/Mentors';
import Referrals from './pages/Referrals';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import TeacherDashboard from './pages/TeacherDashboard';
import QA from './pages/QA';
import QADetail from './pages/QADetail';
import NotFound from './pages/NotFound';
import PendingVerification from './pages/PendingVerification';

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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
      <Route path="/forgot-password" element={<GuestOnly><ForgotPassword /></GuestOnly>} />
      <Route path="/reset-password" element={<GuestOnly><ResetPassword /></GuestOnly>} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/pending-verification" element={<ProtectedRoute allowPending><PendingVerification /></ProtectedRoute>} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<ProtectedRoute roles={['student', 'alumni']}><Dashboard /></ProtectedRoute>} />
        <Route path="/teacher/dashboard" element={<ProtectedRoute roles={['teacher', 'admin']}><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/alumni" element={<AlumniDirectory />} />
        <Route path="/alumni/:id" element={<AlumniProfile />} />
        <Route path="/qa" element={<QA />} />
        <Route path="/qa/:id" element={<QADetail />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/mentors" element={<ProtectedRoute roles={['student', 'alumni']}><Mentors /></ProtectedRoute>} />
        <Route path="/referrals" element={<ProtectedRoute roles={['student', 'alumni']}><Referrals /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute roles={['student', 'alumni', 'teacher']}><Messages /></ProtectedRoute>} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<ProtectedRoute roles={['student', 'alumni', 'teacher']}><Profile /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Admin /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
