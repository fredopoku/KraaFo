import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, Component, ReactNode } from 'react';
import Landing from './pages/Landing';
import Setup from './pages/Setup';
import Generator from './pages/Generator';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Quotes from './pages/Quotes';
import Unsubscribe from './pages/Unsubscribe';
import Admin from './pages/Admin';
import Changelog from './pages/Changelog';
import InvoiceView from './pages/InvoiceView';
import Login from './pages/Login';
import Join from './pages/Join';
import Team from './pages/Team';
import { trackPage } from './utils/tracker';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'sans-serif', background: '#f8fafc' }}>
          <div style={{ maxWidth: '400px', textAlign: 'center' }}>
            <p style={{ fontSize: '40px', margin: '0 0 16px' }}>⚠️</p>
            <h1 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800, color: '#111827' }}>Something went wrong</h1>
            <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: '14px' }}>We've hit an unexpected error. Please refresh the page to continue.</p>
            <button onClick={() => window.location.reload()} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 28px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
              Refresh page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function RouterTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPage(location.pathname);
  }, [location.pathname]);
  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
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
        <Route path="/view/:id" element={<InvoiceView />} />
        <Route path="/login" element={<Login />} />
        <Route path="/join/:token" element={<Join />} />
        <Route path="/team" element={<Team />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
