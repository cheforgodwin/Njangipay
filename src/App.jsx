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
const NexusSetup = React.lazy(() => import('./components/NexusSetup'));
const BankingPartners = React.lazy(() => import('./components/BankingPartners'));
const BankDashboard = React.lazy(() => import('./components/BankDashboard'));

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

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        navigate('/login');
      } else if (!isSuperAdmin && currentUser?.email !== 'cheforgodwin01@gmail.com') {
        navigate('/dashboard');
      }
    }
  }, [currentUser, userData, isSuperAdmin, navigate, authLoading]);

  if (authLoading) return <LoadingSpinner />;
  if (!currentUser || !isSuperAdmin) return <LoadingSpinner />;
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

            <Route path="/support" element={<ProtectedRoute><SupportDashboard theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
            <Route path="/investor" element={<ProtectedRoute><InvestorAnalytics theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
            <Route path="/setup-nexus" element={<NexusSetup />} />
            <Route path="/partners" element={<ProtectedRoute><BankingPartners theme={theme} toggleTheme={toggleTheme} /></ProtectedRoute>} />
            <Route path="/bank-dashboard" element={<BankRoute><BankDashboard theme={theme} toggleTheme={toggleTheme} /></BankRoute>} />
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
