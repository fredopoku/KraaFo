import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Landing from './pages/Landing';
import Setup from './pages/Setup';
import Generator from './pages/Generator';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Quotes from './pages/Quotes';
import Unsubscribe from './pages/Unsubscribe';
import Admin from './pages/Admin';
import Changelog from './pages/Changelog';
import { trackPage } from './utils/tracker';

function RouterTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPage(location.pathname);
  }, [location.pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <RouterTracker />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/generator" element={<Generator />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/quotes" element={<Quotes />} />
        <Route path="/unsubscribe" element={<Unsubscribe />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/changelog" element={<Changelog />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
