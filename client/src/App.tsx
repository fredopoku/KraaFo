import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, lazy, Suspense, Component, ReactNode } from 'react';
import Landing from './pages/Landing';
import { trackPage } from './utils/tracker';
import { useOrg } from './hooks/useOrg';

const Setup = lazy(() => import('./pages/Setup'));
const Generator = lazy(() => import('./pages/Generator'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Clients = lazy(() => import('./pages/Clients'));
const Quotes = lazy(() => import('./pages/Quotes'));
const Unsubscribe = lazy(() => import('./pages/Unsubscribe'));
const Admin = lazy(() => import('./pages/Admin'));
const Changelog = lazy(() => import('./pages/Changelog'));
const InvoiceView = lazy(() => import('./pages/InvoiceView'));
const Login = lazy(() => import('./pages/Login'));
const Join = lazy(() => import('./pages/Join'));
const Team = lazy(() => import('./pages/Team'));
const Trash = lazy(() => import('./pages/Trash'));
const EmailVerify = lazy(() => import('./pages/EmailVerify'));
const InvoiceGeneratorPage = lazy(() => import('./pages/InvoiceGeneratorPage'));
const ReceiptGeneratorPage = lazy(() => import('./pages/ReceiptGeneratorPage'));
const QuoteGeneratorPage = lazy(() => import('./pages/QuoteGeneratorPage'));
const WhatsappInvoicePage = lazy(() => import('./pages/WhatsappInvoicePage'));
const GhanaInvoicePage = lazy(() => import('./pages/GhanaInvoicePage'));
const FreelanceInvoicePage = lazy(() => import('./pages/FreelanceInvoicePage'));

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

function PresenceTracker() {
  const location = useLocation();
  useEffect(() => {
    const token = localStorage.getItem('krafo_token');
    if (!token || location.pathname === '/admin') return;
    const beat = () => {
      fetch('/api/presence/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ page: location.pathname }),
      }).catch(() => {});
    };
    beat();
    const id = setInterval(beat, 30000);
    return () => clearInterval(id);
  }, [location.pathname]);
  return null;
}

function PageLoader() {
  return <div style={{ minHeight: '100vh', background: '#fff' }} />;
}

// Gate for the real dashboard/clients/quotes/team/trash pages - unverified
// accounts are redirected to the demo generator instead of seeing these at
// all. This is UX only; the actual enforcement is server-side (see
// CORE_FEATURE_PREFIXES in middleware/auth.ts), so this just avoids showing
// an unverified visitor a dashboard shell full of buttons that would 403.
function RequireVerified({ children }: { children: ReactNode }) {
  const { org, loading } = useOrg();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!org) { navigate('/setup'); return; }
    if (org.verification_status && org.verification_status !== 'verified') {
      navigate('/generator?demo=true&verify=1');
    }
  }, [org, loading, navigate]);

  if (loading || !org || (org.verification_status && org.verification_status !== 'verified')) {
    return <PageLoader />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <RouterTracker />
      <PresenceTracker />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/generator" element={<Generator />} />
          <Route path="/dashboard" element={<RequireVerified><Dashboard /></RequireVerified>} />
          <Route path="/clients" element={<RequireVerified><Clients /></RequireVerified>} />
          <Route path="/quotes" element={<RequireVerified><Quotes /></RequireVerified>} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/changelog" element={<Changelog />} />
          <Route path="/trash" element={<RequireVerified><Trash /></RequireVerified>} />
          <Route path="/invoice-generator" element={<InvoiceGeneratorPage />} />
          <Route path="/receipt-generator" element={<ReceiptGeneratorPage />} />
          <Route path="/quote-generator" element={<QuoteGeneratorPage />} />
          <Route path="/whatsapp-invoice-generator" element={<WhatsappInvoicePage />} />
          <Route path="/invoice-generator-ghana" element={<GhanaInvoicePage />} />
          <Route path="/invoice-generator-for-freelancers" element={<FreelanceInvoicePage />} />
          <Route path="/view/:id" element={<InvoiceView />} />
          <Route path="/login" element={<Login />} />
          <Route path="/join/:token" element={<Join />} />
          <Route path="/team" element={<RequireVerified><Team /></RequireVerified>} />
          <Route path="/verify-email" element={<EmailVerify />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
