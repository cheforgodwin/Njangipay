import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  Users, 
  Target, 
  CreditCard, 
  Settings, 
  LogOut, 
  Sun, 
  Moon,
  Shield,
  Building2,
  Menu,
  X,
  Globe,
  Activity,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import logo from '../assets/logo.svg';
import './Dashboard.css';

const MainLayout = ({ children, theme, toggleTheme }) => {
  const { isAdmin, isSuperAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLinkActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="dashboard-page-container">
      <div className="mobile-header">
        <button className="menu-toggle" onClick={toggleSidebar}>
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <Link to="/" className="logo">
          <img src={logo} alt="NjangiPay" className="logo-icon" style={{ height: '32px' }} />
          NjangiPay
        </Link>
        <div style={{ width: '40px' }}></div> {/* Spacer for alignment */}
      </div>

      <Navbar theme={theme} toggleTheme={toggleTheme} showLogo={false} />
      
      <div className={`sidebar-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
        
        <aside className={`sidebar ${sidebarOpen ? 'active' : ''}`}>
          <Link to="/" className="sidebar-logo logo" onClick={closeSidebar}>
            <img src={logo} alt="NjangiPay" className="logo-icon" />
            NjangiPay
          </Link>
          
          <nav className="sidebar-nav">
            {/* USER NAVIGATION */}
            {!location.pathname.startsWith('/admin') && !location.pathname.startsWith('/super-admin') && (
              <>
                <Link to="/dashboard" className={`nav-item ${isLinkActive('/dashboard') ? 'active' : ''}`} onClick={closeSidebar}>
                  <LayoutDashboard size={20} /> Dashboard
                </Link>
                <Link to="/wallet" className={`nav-item ${isLinkActive('/wallet') ? 'active' : ''}`} onClick={closeSidebar}>
                  <Wallet size={20} /> My Wallet
                </Link>
                <Link to="/groups" className={`nav-item ${isLinkActive('/groups') ? 'active' : ''}`} onClick={closeSidebar}>
                  <Users size={20} /> Savings Groups
                </Link>
                <Link to="/marketplace" className={`nav-item ${isLinkActive('/marketplace') ? 'active' : ''}`} onClick={closeSidebar}>
                  <Target size={20} /> Marketplace
                </Link>
                <Link to="/partners" className={`nav-item ${isLinkActive('/partners') ? 'active' : ''}`} onClick={closeSidebar}>
                  <Building2 size={20} /> Banking Partners
                </Link>
              </>
            )}

            {/* COMMUNITY ADMIN NAVIGATION */}
            {location.pathname.startsWith('/admin') && (
              <>
                <Link to="/dashboard" className="nav-item" onClick={closeSidebar}>
                  <LayoutDashboard size={20} /> Back to User View
                </Link>
                <div style={{ margin: '15px 0 5px', padding: '0 12px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>Admin Controls</div>
                <Link to="/admin/communities" className={`nav-item ${isLinkActive('/admin/communities') ? 'active' : ''}`} onClick={closeSidebar}>
                  <Globe size={20} /> Communities
                </Link>
                <Link to="/admin/ai-risk-scores" className={`nav-item ${isLinkActive('/admin/ai-risk-scores') ? 'active' : ''}`} onClick={closeSidebar}>
                  <Shield size={20} /> Risk Center
                </Link>
              </>
            )}

            {/* SUPER ADMIN NAVIGATION */}
            {location.pathname.startsWith('/super-admin') && (
              <>
                <Link to="/dashboard" className="nav-item" onClick={closeSidebar}>
                  <LayoutDashboard size={20} /> User View
                </Link>
                <div style={{ margin: '15px 0 5px', padding: '0 12px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>Platform Nexus</div>
                <Link to="/super-admin" className={`nav-item ${isLinkActive('/super-admin') ? 'active' : ''}`} onClick={closeSidebar}>
                  <Activity size={20} /> Overview
                </Link>
                <Link to="/admin/communities" className="nav-item" onClick={closeSidebar}>
                  <Globe size={20} /> All Communities
                </Link>
              </>
            )}

            {/* QUICK LINKS FOR MODERATORS/ADMINS */}
            {(isAdmin || isSuperAdmin) && !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/super-admin') && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ margin: '15px 0 5px', padding: '0 12px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>Admin Quick Links</div>
                <Link to="/admin/communities" className="nav-item" onClick={closeSidebar}>
                   <Shield size={20} /> Admin Panel
                </Link>
                {isSuperAdmin && (
                  <Link to="/super-admin" className="nav-item" onClick={closeSidebar}>
                    <Activity size={20} color="#e74c3c" /> Super Admin
                  </Link>
                )}
              </div>
            )}
            
            <div style={{ margin: '15px 0 5px', padding: '0 12px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>Support Tools</div>
            <Link to="/settings" className={`nav-item ${isLinkActive('/settings') ? 'active' : ''}`} onClick={closeSidebar}>
              <Settings size={20} /> Settings
            </Link>
            <div 
              className="nav-item" 
              onClick={() => { handleLogout(); closeSidebar(); }} 
              style={{ cursor: 'pointer', marginTop: 'auto' }}
            >
              <LogOut size={20} /> Logout
            </div>
          </nav>

          {/* Theme toggle removed per user request - now only in Settings */}
        </aside>

        <main className="dashboard-main">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
