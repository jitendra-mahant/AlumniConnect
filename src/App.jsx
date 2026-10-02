import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import Home from './pages/Home';
import Network from './pages/Network';
import JobPage from './pages/JobPage';
import Mentors from './pages/Mentors';
import Referrals from './pages/Referrals';
import Profile from './pages/Profile';
import Login from './pages/Login';

export default function App() {
  // Logged-in user localStorage mein rehta hai, isliye refresh ke baad bhi login bana rehta hai
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('currentUser')));

  const login = (u) => {
    localStorage.setItem('currentUser', JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
  };

  // Login nahi hai toh sirf Login page dikhao
  if (!user) return <Login onLogin={login} />;

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout user={user} onLogout={logout} />}>
          <Route path="/" element={<Home />} />
          <Route path="/network" element={<Network />} />
          <Route path="/jobs" element={<JobPage />} />
          <Route path="/mentors" element={<Mentors />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}