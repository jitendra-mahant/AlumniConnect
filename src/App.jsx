import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import Home from './pages/Home';
import Network from './pages/Network';
import JobPage from './pages/JobPage';
import Mentors from './pages/Mentors';
import Referrals from './pages/Referrals';
import Profile from './pages/Profile';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Home />} />
          <Route path="network" element={<Network />} />
          <Route path="jobs" element={<JobPage />} />
          <Route path="mentors" element={<Mentors />} />
          <Route path="referrals" element={<Referrals />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}