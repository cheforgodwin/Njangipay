import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  ShieldCheck, 
  ChartBar, 
  ArrowRight, 
  Leaf, 
  Wallet,
  Activity,
  UserCheck,
  Settings,
  Sun,
  Moon
} from 'lucide-react';
const LandingPage = React.lazy(() => import('./components/LandingPage'));
const AdminPanel = React.lazy(() => import('./components/AdminPanel'));
const Navbar = React.lazy(() => import('./components/Navbar'));
const ContributionTracker = React.lazy(() => import('./components/ContributionTracker'));
const RiskAssessment = React.lazy(() => import('./components/RiskAssessment'));
const AIAssistant = React.lazy(() => import('./components/AIAssistant'));
const LoginPage = React.lazy(() => import('./components/LoginPage'));
const SignupPage = React.lazy(() => import('./components/SignupPage'));
const UserDashboard = React.lazy(() => import('./components/UserDashboard'));
const WalletPage = React.lazy(() => import('./components/WalletPage'));
const GroupsPage = React.lazy(() => import('./components/GroupsPage'));
const Marketplace = React.lazy(() => import('./components/Marketplace'));
const SuperAdminDashboard = React.lazy(() => import('./components/SuperAdminDashboard'));
const SupportDashboard = React.lazy(() => import('./components/SupportDashboard'));
const InvestorAnalytics = React.lazy(() => import('./components/InvestorAnalytics'));
const SettingsPage = React.lazy(() => import('./components/SettingsPage'));
const PayoutRotation = React.lazy(() => import('./components/PayoutRotation'));
const NexusSetup = React.lazy(() => import('./components/NexusSetup'));
const BankingPartners = React.lazy(() => import('./components/BankingPartners'));
const BankDashboard = React.lazy(() => import('./components/BankDashboard'));
const PlaceholderPage = React.lazy(() => import('./components/PlaceholderPage'));

import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css'

// Premium Loading Spinner
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'var(--off-white, #f8fbf9)',
    fontFamily: 'Outfit, sans-serif'
  }}>
    <div className="spinner" style={{
      width: '40px',
      height: '40px',
      border: '3px solid var(--primary-light, #abebc6)',
      borderTop: '3px solid var(--primary-green, #2ecc71)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      marginBottom: '1rem'
    }}></div>
    <div style={{ color: 'var(--text-sub)', fontSize: '0.9rem', fontWeight: 500 }}>
      NjangiPay is loading...
    </div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Hero background handled in LandingPage.jsx

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      console.log("ProtectedRoute: No user, redirecting to login");
      navigate('/login');
    }
  }, [currentUser, authLoading, navigate]);

  if (authLoading) return <LoadingSpinner />;
  if (!currentUser) return <LoadingSpinner />; // Show spinner until redirect triggers
  return children;
};

const AdminRoute = ({ children }) => {
  const { currentUser, userData, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if auth is finished loading
    if (!authLoading) {
      if (!currentUser) {
        navigate('/login');
      } else if (!isAdmin) {
        // Redirect if explicitly not admin (which covers null userData from timeout since isAdmin will be falsy)
        navigate('/dashboard');
      }
    }
  }, [currentUser, userData, isAdmin, navigate, authLoading]);

  // Show spinner while auth is loading initially
  if (authLoading) return <LoadingSpinner />;
  
  // If we have a user but no data yet (e.g. timeout fallback in AuthContext) AND they are NOT an admin, 
  // the useEffect will handle the redirect. Until then, or if they ARE authorized, we proceed or wait.
  // We only render children if we are absolutely sure they are an admin.
  if (!currentUser || !isAdmin) return <LoadingSpinner />;
  return children;
};

const SuperAdminRoute = ({ children }) => {
  const { currentUser, userData, isSuperAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        navigate('/login');
      } else if (!isSuperAdmin && currentUser?.email !== 'cheforgodwin01@gmail.com') {
        navigate('/dashboard');
      }
    }
  }, [currentUser, userData, isSuperAdmin, navigate, authLoading]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === '1234567890') {
      setIsAuthorized(true);
    } else {
      setError('Invalid Admin Password. Access Denied.');
    }
  };

  if (authLoading) return <LoadingSpinner />;
  if (!currentUser || (!isSuperAdmin && currentUser.email !== 'cheforgodwin01@gmail.com')) return <LoadingSpinner />;

  if (!isAuthorized) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', 
        alignItems: 'center', justifyContent: 'center', background: 'var(--off-white)'
      }}>
        <div className="glass card" style={{ padding: '2rem', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
          <ShieldCheck size={48} color="var(--primary-green)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ color: 'var(--primary-green)', marginBottom: '1rem' }}>Restricted Access</h2>
          <p className="text-sub" style={{ marginBottom: '1.5rem' }}>Please enter the Super Admin override password to access this dashboard.</p>
          <form onSubmit={handlePasswordSubmit}>
            <input 
              type="password" 
              className="auth-input"
              style={{ width: '100%', marginBottom: '1rem' }}
              placeholder="Enter password..."
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setError(''); }}
              autoFocus
            />
            {error && <p style={{ color: 'red', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>Access Dashboard</button>
            <button type="button" className="btn-secondary" style={{ width: '100%', marginTop: '10px' }} onClick={() => navigate('/dashboard')}>Back to Safety</button>
          </form>
        </div>
      </div>
    );
  }

  return children;
};

const BankRoute = ({ children }) => {
  const { currentUser, userData, isSuperAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isBank = userData?.role === 'bank-admin' || isSuperAdmin;

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        navigate('/login');
      } else if (!isBank) {
        navigate('/dashboard');
      }
    }
  }, [currentUser, isBank, navigate, authLoading]);

  if (authLoading) return <LoadingSpinner />;
  if (!currentUser || !isBank) return <LoadingSpinner />;
  return children;
};

const LeaderRoute = ({ children }) => {
  const { currentUser, isLeader, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        navigate('/login');
      } else if (!isLeader) {
        navigate('/dashboard');
      }
    }
  }, [currentUser, isLeader, navigate, authLoading]);

  if (authLoading) return <LoadingSpinner />;
  if (!currentUser || !isLeader) return <LoadingSpinner />;
  return children;
};

const AuditorRoute = ({ children }) => {
  const { currentUser, isAuditor, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        navigate('/login');
      } else if (!isAuditor) {
        navigate('/dashboard');
      }
    }
  }, [currentUser, isAuditor, navigate, authLoading]);

  if (authLoading) return <LoadingSpinner />;
  if (!currentUser || !isAuditor) return <LoadingSpinner />;
  return children;
};


function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const location = useLocation();
  const hideAIPaths = ['/', '/login', '/signup'];
  const shouldShowAI = !hideAIPaths.includes(location.pathname);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <AuthProvider>
      <div className="app-container">
        <React.Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<LandingPage theme={theme} toggleTheme={toggleTheme} />} />
            <Route path="/login" element={<LoginPage theme={theme} toggleTheme={toggleTheme} />} />
            <Route path="/signup" element={<SignupPage theme={theme} toggleTheme={toggleTheme} />} />

            
            <Route path="/dashboard" element={<ProtectedRoute><UserDashboard theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><WalletPage theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
            <Route path="/groups" element={<ProtectedRoute><GroupsPage theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
            <Route path="/marketplace" element={<ProtectedRoute><Marketplace theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
            <Route path="/admin/communities" element={<AdminRoute><AdminPanel theme={theme} toggleTheme={toggleTheme} /></AdminRoute>} />
            <Route path="/group/:groupId/contributions" element={<ProtectedRoute><ContributionTracker theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
            <Route path="/admin/ai-risk-scores" element={<AdminRoute><RiskAssessment theme={theme} toggleTheme={toggleTheme} /></AdminRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
            <Route path="/super-admin" element={<SuperAdminRoute><SuperAdminDashboard theme={theme} toggleTheme={toggleTheme} /></SuperAdminRoute>} />
            <Route path="/superadmin" element={<SuperAdminRoute><SuperAdminDashboard theme={theme} toggleTheme={toggleTheme} /></SuperAdminRoute>} />

            <Route path="/support" element={<ProtectedRoute><SupportDashboard theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
            <Route path="/investor" element={<ProtectedRoute><InvestorAnalytics theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
            <Route path="/setup-nexus" element={<NexusSetup />} />
            <Route path="/partners" element={<ProtectedRoute><BankingPartners theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
            <Route path="/bank-dashboard" element={<BankRoute><BankDashboard theme={theme} toggleTheme={toggleTheme} /></BankRoute>} />

            {/* NEW MISSING ADMIN ROUTES */}
            <Route path="/admin/users" element={<AdminRoute><PlaceholderPage title="Manage Users" theme={theme} toggleTheme={toggleTheme} /></AdminRoute>} />
            <Route path="/admin/groups" element={<AdminRoute><PlaceholderPage title="Manage Groups" theme={theme} toggleTheme={toggleTheme} /></AdminRoute>} />
            <Route path="/admin/transactions" element={<AdminRoute><PlaceholderPage title="Transactions" theme={theme} toggleTheme={toggleTheme} /></AdminRoute>} />
            <Route path="/admin/payments" element={<AdminRoute><PlaceholderPage title="Payments (MoMo)" theme={theme} toggleTheme={toggleTheme} /></AdminRoute>} />
            <Route path="/admin/loans" element={<AdminRoute><PlaceholderPage title="Loan Management" theme={theme} toggleTheme={toggleTheme} /></AdminRoute>} />
            <Route path="/admin/reports" element={<AdminRoute><PlaceholderPage title="Reports & Analytics" theme={theme} toggleTheme={toggleTheme} /></AdminRoute>} />
            <Route path="/admin/audit" element={<AdminRoute><PlaceholderPage title="Audit Logs" theme={theme} toggleTheme={toggleTheme} /></AdminRoute>} />
            <Route path="/admin/fraud" element={<AdminRoute><PlaceholderPage title="Fraud Detection" theme={theme} toggleTheme={toggleTheme} /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><PlaceholderPage title="Platform Config" theme={theme} toggleTheme={toggleTheme} /></AdminRoute>} />
            <Route path="/admin/integrations" element={<AdminRoute><PlaceholderPage title="Integrations" theme={theme} toggleTheme={toggleTheme} /></AdminRoute>} />
            <Route path="/admin/alerts" element={<AdminRoute><PlaceholderPage title="Notifications" theme={theme} toggleTheme={toggleTheme} /></AdminRoute>} />

            {/* LEADER ROUTES */}
            <Route path="/leader/group" element={<LeaderRoute><PlaceholderPage title="My Group" theme={theme} toggleTheme={toggleTheme} /></LeaderRoute>} />
            <Route path="/leader/members" element={<LeaderRoute><PlaceholderPage title="Group Members" theme={theme} toggleTheme={toggleTheme} /></LeaderRoute>} />
            <Route path="/leader/contributions" element={<LeaderRoute><PlaceholderPage title="Contributions" theme={theme} toggleTheme={toggleTheme} /></LeaderRoute>} />
            <Route path="/leader/schedule" element={<LeaderRoute><PlaceholderPage title="Schedule" theme={theme} toggleTheme={toggleTheme} /></LeaderRoute>} />
            <Route path="/leader/rotation" element={<LeaderRoute><PayoutRotation theme={theme} toggleTheme={toggleTheme} /></LeaderRoute>} />
            <Route path="/leader/disbursements" element={<LeaderRoute><PlaceholderPage title="Disbursements" theme={theme} toggleTheme={toggleTheme} /></LeaderRoute>} />
            <Route path="/leader/loan-requests" element={<LeaderRoute><PlaceholderPage title="Loan Requests" theme={theme} toggleTheme={toggleTheme} /></LeaderRoute>} />
            <Route path="/leader/loan-tracking" element={<LeaderRoute><PlaceholderPage title="Active Loans" theme={theme} toggleTheme={toggleTheme} /></LeaderRoute>} />
            <Route path="/leader/announcements" element={<LeaderRoute><PlaceholderPage title="Chat & Notices" theme={theme} toggleTheme={toggleTheme} /></LeaderRoute>} />
            <Route path="/leader/notifications" element={<LeaderRoute><PlaceholderPage title="Notifications" theme={theme} toggleTheme={toggleTheme} /></LeaderRoute>} />
            <Route path="/leader/reports" element={<LeaderRoute><PlaceholderPage title="Group Reports" theme={theme} toggleTheme={toggleTheme} /></LeaderRoute>} />
            <Route path="/leader/settings" element={<LeaderRoute><PlaceholderPage title="Group Settings" theme={theme} toggleTheme={toggleTheme} /></LeaderRoute>} />

            {/* AUDITOR ROUTES */}
            <Route path="/auditor" element={<AuditorRoute><PlaceholderPage title="Auditor Dashboard" theme={theme} toggleTheme={toggleTheme} /></AuditorRoute>} />
            <Route path="/auditor/transactions" element={<AuditorRoute><PlaceholderPage title="Transaction Logs" theme={theme} toggleTheme={toggleTheme} /></AuditorRoute>} />
            <Route path="/auditor/contributions" element={<AuditorRoute><PlaceholderPage title="Contribution Logs" theme={theme} toggleTheme={toggleTheme} /></AuditorRoute>} />
            <Route path="/auditor/payouts" element={<AuditorRoute><PlaceholderPage title="Payout Verification" theme={theme} toggleTheme={toggleTheme} /></AuditorRoute>} />
            <Route path="/auditor/reports" element={<AuditorRoute><PlaceholderPage title="Financial Reports" theme={theme} toggleTheme={toggleTheme} /></AuditorRoute>} />
            <Route path="/auditor/audit" element={<AuditorRoute><PlaceholderPage title="Audit Reports" theme={theme} toggleTheme={toggleTheme} /></AuditorRoute>} />
            <Route path="/auditor/discrepancies" element={<AuditorRoute><PlaceholderPage title="Discrepancies" theme={theme} toggleTheme={toggleTheme} /></AuditorRoute>} />
            <Route path="/auditor/fraud" element={<AuditorRoute><PlaceholderPage title="Fraud Checks" theme={theme} toggleTheme={toggleTheme} /></AuditorRoute>} />

            {/* SHARED ROUTES (Member/General) */}
            <Route path="/messages" element={<ProtectedRoute><PlaceholderPage title="Group Chat" theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><PlaceholderPage title="Notifications" theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
          </Routes>
        </React.Suspense>
        
        {/* Load heavy AI Assistant only after initial render and only on internal pages */}
        <React.Suspense fallback={null}>
          {theme && shouldShowAI && <AIAssistant />}
        </React.Suspense>
      </div>
    </AuthProvider>
  );
}

export default App
