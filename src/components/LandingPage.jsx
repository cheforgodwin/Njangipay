import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  ShieldCheck, 
  ChartBar, 
  ArrowRight, 
  Activity,
  UserCheck
} from 'lucide-react';
import Navbar from './Navbar';
import FeaturesSection from './FeaturesSection';
import Footer from './Footer';

import heroBg from '../assets/njangipay_hero_bg.png';

const HERO_BG = heroBg;

const LandingPage = ({ theme, toggleTheme }) => {
  const navigate = useNavigate();
  const { currentUser, userData, loading: authLoading } = useAuth();

  const getRoleRedirect = (role) => {
    if (role === 'super-admin') return '/super-admin';
    if (role === 'bank-admin') return '/bank-dashboard';
    if (role === 'admin') return '/admin/communities';
    if (role === 'community-admin') return '/admin/communities';
    if (role === 'community') return '/groups';
    if (role === 'leader') return '/leader';
    if (role === 'auditor') return '/auditor';
    return '/dashboard';
  };

  const handleGetStarted = () => {
    if (currentUser && !authLoading) {
      const target = getRoleRedirect(userData?.role || 'user');
      navigate(target);
    } else {
      navigate('/login');
    }
  };
  return (
    <div className="landing-wrapper">
      <Navbar theme={theme} />

      <main className="container">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <div className="badge">
              <ShieldCheck size={18} /> Secure P2P Savings Platform
            </div>
            <h1 className="hero-title">
              Smart Community <br />
              <span>Savings & Lending</span>
            </h1>
            <p className="hero-description">
              Join trusted circles, automate your contributions, and access fair credit based on your community standing.
            </p>
            <div className="hero-actions">
              <button onClick={handleGetStarted} className="btn-primary">
                Get Started <ArrowRight size={20} />
              </button>
              <button className="btn-secondary">Watch Video</button>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="hero-image-container glass" style={{ 
              backgroundImage: `url(${HERO_BG})`,
              backgroundPosition: 'center',
              backgroundColor: 'var(--accent-light, #e8f8f5)',
              transition: 'opacity 0.5s ease-in-out'
            }}>
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="trust-badges">
           <div className="flex-center gap-1"><ShieldCheck size={20} /> Bank-Grade Security</div>
           <div className="flex-center gap-1"><Activity size={20} /> Real-time Tracking</div>
           <div className="flex-center gap-1"><UserCheck size={20} /> Verified Communities</div>
        </section>

        {/* Home Page Dedicated Features Page/Section */}
        <FeaturesSection />

        {/* Stats Section */}
        <section className="stats-grid grid">
          <div className="glass card stat-card">
            <div className="stat-icon">
              <Users color="var(--primary-green)" />
            </div>
            <h2 className="stat-number">20,000+</h2>
            <p>Active Community Members</p>
          </div>
          <div className="glass card stat-card">
            <div className="stat-icon">
              <ShieldCheck color="var(--primary-green)" />
            </div>
            <h2 className="stat-number">10,000+</h2>
            <p>Circles Successfully Funded</p>
          </div>
          <div className="glass card stat-card">
            <div className="stat-icon">
              <ChartBar color="var(--primary-green)" />
            </div>
            <h2 className="stat-number">100K+</h2>
            <p>Savings Units Managed Global</p>
          </div>
        </section>

        {/* Quick Links CTA */}
        <section className="quick-links-section">
           <h2>Your Financial Command Center</h2>
           <div className="quick-links-grid">
             <Link to="/admin/communities" className="glass quick-link-card">
               <Users size={20} color="var(--primary-green)" /> Community Admin
             </Link>
             <Link to="/groups" className="glass quick-link-card">
               <ChartBar size={20} color="var(--primary-green)" /> Savings Tracker
             </Link>
             <Link to="/marketplace" className="glass quick-link-card">
               <Activity size={20} color="var(--primary-green)" /> AI Risk Dashboard
             </Link>
           </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
