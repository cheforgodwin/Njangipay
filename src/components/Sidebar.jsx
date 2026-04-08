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
  Shield,
  Building2,
  Globe,
  Activity,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  FileText,
  PieChart,
  AlertTriangle,
  Bell,
  HelpCircle,
  Clock,
  Briefcase,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.svg';
import './Sidebar.css';

const CollapsibleSection = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="sidebar-collapsible-section">
      <div 
        className="sidebar-section-label" 
        onClick={() => setIsOpen(!isOpen)} 
      >
        <span>{title}</span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </div>
      {isOpen && (
        <div className="sidebar-section-content">
          {children}
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ sidebarOpen, closeSidebar }) => {
  const { logout, userData } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isLinkActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Map role names correctly
  let userRole = userData?.role || 'user';
  // Debug: Log the role to console
  console.log('Sidebar - User Role:', userRole);
  console.log('Sidebar - User Data:', userData);
  
  // Fallback: Check if user is super admin by email
  if (userData?.email === 'cheforgodwin01@gmail.com' && userRole !== 'super-admin') {
    userRole = 'super-admin';
    console.log('Sidebar - Updated to super-admin based on email');
  }
  // No mapping needed - use roles as they are

  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === '1234567890') {
      navigate('/super-admin');
      setShowPasswordPrompt(false);
      setPasswordInput('');
      setPasswordError('');
      closeSidebar();
    } else {
      setPasswordError('Invalid Admin Password. Access Denied.');
      setPasswordInput('');
    }
  };

  return (
    <>
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
      
      <aside className={`sidebar ${sidebarOpen ? 'active' : ''}`}>
        <Link to="/" className="sidebar-logo logo" onClick={closeSidebar}>
          <img src={logo} alt="NjangiPay" className="logo-icon" />
          NjangiPay
        </Link>

        {/* Password Prompt for Super Admin */}
        {showPasswordPrompt && (
          <div className="sidebar-password-prompt" style={{ padding: '15px', borderBottom: '1px solid var(--glass-border)' }}>
            <div style={{ marginBottom: '10px', fontSize: '0.9rem', fontWeight: '600', color: 'var(--primary-green)' }}>
              🔐 Super Admin Access Required
            </div>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter admin password"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: passwordError ? '1px solid #e74c3c' : '1px solid var(--glass-border)',
                  background: 'var(--glass-bg)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  marginBottom: '8px'
                }}
                autoFocus
              />
              {passwordError && (
                <div style={{ color: '#e74c3c', fontSize: '0.8rem', marginBottom: '8px' }}>
                  {passwordError}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, padding: '6px 12px', fontSize: '0.85rem' }}
                >
                  Access
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordPrompt(false);
                    setPasswordInput('');
                    setPasswordError('');
                  }}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '6px 12px', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
        
        <nav className="sidebar-nav sidebar-nav-container">
          
          {/* ——— BANK ADMIN SIDEBAR ——— */}
          {userRole === 'bank-admin' && (<>
            <Link to="/bank-dashboard" className={`nav-item ${isLinkActive('/bank-dashboard') ? 'active' : ''}`} onClick={closeSidebar}>
              <Building2 size={20} /> Banking Dashboard
            </Link>

            <CollapsibleSection title="Liquidity Management">
              <Link to="/bank-dashboard" className={`nav-item ${isLinkActive('/bank-dashboard') ? 'active' : ''}`} onClick={closeSidebar}>
                <Wallet size={20} /> Settlement Pool
              </Link>
              <Link to="/bank-dashboard" className={`nav-item`} onClick={closeSidebar}>
                <Activity size={20} /> Daily Volume
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title="Transaction Monitoring">
              <Link to="/bank-dashboard" className={`nav-item`} onClick={closeSidebar}>
                <CreditCard size={20} /> Real-time Clearing
              </Link>
              <Link to="/bank-dashboard" className={`nav-item`} onClick={closeSidebar}>
                <FileText size={20} /> Transaction Reports
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title="Compliance & Risk">
              <Link to="/bank-dashboard" className={`nav-item`} onClick={closeSidebar}>
                <Shield size={20} /> Compliance Check
              </Link>
              <Link to="/bank-dashboard" className={`nav-item`} onClick={closeSidebar}>
                <AlertTriangle size={20} /> Risk Assessment
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title="Partner Management">
              <Link to="/partners" className={`nav-item ${isLinkActive('/partners') ? 'active' : ''}`} onClick={closeSidebar}>
                <Globe size={20} /> Banking Partners
              </Link>
              <Link to="/bank-dashboard" className={`nav-item`} onClick={closeSidebar}>
                <Users size={20} /> Partner Accounts
              </Link>
            </CollapsibleSection>
          </>)}

          {/* ——— COMMUNITY REPRESENTATIVE SIDEBAR ——— */}
          {userRole === 'community' && (<>
            <Link to="/groups" className={`nav-item ${isLinkActive('/groups') ? 'active' : ''}`} onClick={closeSidebar}>
              <Globe size={20} /> Communities
            </Link>

            <CollapsibleSection title="Community Management">
              <Link to="/groups" className={`nav-item ${isLinkActive('/groups') ? 'active' : ''}`} onClick={closeSidebar}>
                <Users size={20} /> My Communities
              </Link>
              <Link to="/groups" className={`nav-item`} onClick={closeSidebar}>
                <Plus size={20} /> Create New Group
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title="Group Operations">
              <Link to="/groups" className={`nav-item`} onClick={closeSidebar}>
                <Wallet size={20} /> Contributions
              </Link>
              <Link to="/groups" className={`nav-item`} onClick={closeSidebar}>
                <Activity size={20} /> Member Activity
              </Link>
              <Link to="/groups" className={`nav-item`} onClick={closeSidebar}>
                <Target size={20} /> Group Performance
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title="Communication">
              <Link to="/groups" className={`nav-item`} onClick={closeSidebar}>
                <MessageSquare size={20} /> Group Messages
              </Link>
              <Link to="/notifications" className={`nav-item ${isLinkActive('/notifications') ? 'active' : ''}`} onClick={closeSidebar}>
                <Bell size={20} /> Notifications
              </Link>
            </CollapsibleSection>
          </>)}

          {/* ——— COMMUNITY ADMIN SIDEBAR ——— */}
          {userRole === 'community-admin' && (<>
            <Link to="/admin/communities" className={`nav-item ${isLinkActive('/admin/communities') ? 'active' : ''}`} onClick={closeSidebar}>
              <Globe size={20} /> Community Admin
            </Link>

            <CollapsibleSection title="Community Management">
              <Link to="/admin/communities" className={`nav-item ${isLinkActive('/admin/communities') ? 'active' : ''}`} onClick={closeSidebar}>
                <Globe size={20} /> Manage Communities
              </Link>
              <Link to="/admin/users" className={`nav-item ${isLinkActive('/admin/users') ? 'active' : ''}`} onClick={closeSidebar}>
                <Users size={20} /> Community Members
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title="Group Oversight">
              <Link to="/admin/transactions" className={`nav-item ${isLinkActive('/admin/transactions') ? 'active' : ''}`} onClick={closeSidebar}>
                <Activity size={20} /> Group Transactions
              </Link>
              <Link to="/admin/loans" className={`nav-item ${isLinkActive('/admin/loans') ? 'active' : ''}`} onClick={closeSidebar}>
                <Target size={20} /> Group Loans
              </Link>
              <Link to="/admin/reports" className={`nav-item ${isLinkActive('/admin/reports') ? 'active' : ''}`} onClick={closeSidebar}>
                <PieChart size={20} /> Community Reports
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title="Support & Communication">
              <Link to="/support" className={`nav-item ${isLinkActive('/support') ? 'active' : ''}`} onClick={closeSidebar}>
                <HelpCircle size={20} /> User Support
              </Link>
              <Link to="/admin/alerts" className={`nav-item ${isLinkActive('/admin/alerts') ? 'active' : ''}`} onClick={closeSidebar}>
                <Bell size={20} /> Community Alerts
              </Link>
            </CollapsibleSection>
          </>)}

          {/* ——— SUPER ADMIN SIDEBAR ——— */}
          {userRole === 'super-admin' && (<>
            {/* Debug indicator */}
            <div style={{
              background: 'var(--primary-green)',
              color: 'white',
              padding: '0.5rem',
              textAlign: 'center',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              margin: '0.5rem 0',
              borderRadius: '4px'
            }}>
              SUPER ADMIN MODE
            </div>
            
            <Link to="/super-admin" className={`nav-item ${isLinkActive('/super-admin') ? 'active' : ''}`} onClick={closeSidebar}>
              <Shield size={20} /> Super Admin Dashboard
            </Link>

            <CollapsibleSection title="Platform Governance">
              <Link to="/super-admin" className={`nav-item ${isLinkActive('/super-admin') ? 'active' : ''}`} onClick={closeSidebar}>
                <LayoutDashboard size={20} /> System Overview
              </Link>
              <Link to="/admin/users" className={`nav-item ${isLinkActive('/admin/users') ? 'active' : ''}`} onClick={closeSidebar}>
                <Users size={20} /> User Management
              </Link>
              <Link to="/admin/settings" className={`nav-item ${isLinkActive('/admin/settings') ? 'active' : ''}`} onClick={closeSidebar}>
                <Settings size={20} /> Platform Settings
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title="System Administration">
              <Link to="/admin/communities" className={`nav-item ${isLinkActive('/admin/communities') ? 'active' : ''}`} onClick={closeSidebar}>
                <Globe size={20} /> Community Oversight
              </Link>
              <Link to="/admin/integrations" className={`nav-item ${isLinkActive('/admin/integrations') ? 'active' : ''}`} onClick={closeSidebar}>
                <Building2 size={20} /> System Integrations
              </Link>
              <Link to="/admin/alerts" className={`nav-item ${isLinkActive('/admin/alerts') ? 'active' : ''}`} onClick={closeSidebar}>
                <Bell size={20} /> System Alerts
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title="Financial Operations">
              <Link to="/admin/transactions" className={`nav-item ${isLinkActive('/admin/transactions') ? 'active' : ''}`} onClick={closeSidebar}>
                <Activity size={20} /> Transaction Monitor
              </Link>
              <Link to="/admin/payments" className={`nav-item ${isLinkActive('/admin/payments') ? 'active' : ''}`} onClick={closeSidebar}>
                <CreditCard size={20} /> Payment Systems
              </Link>
              <Link to="/admin/loans" className={`nav-item ${isLinkActive('/admin/loans') ? 'active' : ''}`} onClick={closeSidebar}>
                <Target size={20} /> Loan Oversight
              </Link>
              <Link to="/investor" className={`nav-item ${isLinkActive('/investor') ? 'active' : ''}`} onClick={closeSidebar}>
                <PieChart size={20} /> Investor Relations
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title="Banking & Partnerships">
              <Link to="/bank-dashboard" className={`nav-item ${isLinkActive('/bank-dashboard') ? 'active' : ''}`} onClick={closeSidebar}>
                <Building2 size={20} /> Banking Operations
              </Link>
              <Link to="/partners" className={`nav-item ${isLinkActive('/partners') ? 'active' : ''}`} onClick={closeSidebar}>
                <Globe size={20} /> Partner Management
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title="Security & Compliance">
              <Link to="/admin/audit" className={`nav-item ${isLinkActive('/admin/audit') ? 'active' : ''}`} onClick={closeSidebar}>
                <FileText size={20} /> System Audit
              </Link>
              <Link to="/admin/fraud" className={`nav-item ${isLinkActive('/admin/fraud') ? 'active' : ''}`} onClick={closeSidebar}>
                <AlertTriangle size={20} /> Fraud Detection
              </Link>
              <Link to="/admin/ai-risk-scores" className={`nav-item ${isLinkActive('/admin/ai-risk-scores') ? 'active' : ''}`} onClick={closeSidebar}>
                <Shield size={20} /> AI Risk Management
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title="Analytics & Support">
              <Link to="/admin/reports" className={`nav-item ${isLinkActive('/admin/reports') ? 'active' : ''}`} onClick={closeSidebar}>
                <PieChart size={20} /> Platform Analytics
              </Link>
              <Link to="/support" className={`nav-item ${isLinkActive('/support') ? 'active' : ''}`} onClick={closeSidebar}>
                <HelpCircle size={20} /> Support Oversight
              </Link>
            </CollapsibleSection>
          </>)}

          {/* ——— ADMIN SIDEBAR ——— */}
          {userRole === 'admin' && (<>
            {/* Debug indicator */}
            <div style={{
              background: 'var(--accent-orange)',
              color: 'white',
              padding: '0.5rem',
              textAlign: 'center',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              margin: '0.5rem 0',
              borderRadius: '4px'
            }}>
              ADMIN MODE
            </div>
            
            <Link to="/super-admin" className={`nav-item ${isLinkActive('/super-admin') ? 'active' : ''}`} onClick={closeSidebar}>
              <LayoutDashboard size={20} /> NjangiPay Admin
            </Link>

            <CollapsibleSection title="Secure User Authentication and Access Control">
              <Link to="/admin/users" className={`nav-item ${isLinkActive('/admin/users') ? 'active' : ''}`} onClick={closeSidebar}>
                <Users size={20} /> Manage Users
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title="Community and Social Features">
              <Link to="/admin/communities" className={`nav-item ${isLinkActive('/admin/communities') ? 'active' : ''}`} onClick={closeSidebar}>
                <Globe size={20} /> Manage Communities
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title="Comprehensive Financial Dashboard and Wallet Management">
              <Link to="/admin/transactions" className={`nav-item ${isLinkActive('/admin/transactions') ? 'active' : ''}`} onClick={closeSidebar}>
                <Activity size={20} /> Transactions
              </Link>
              <Link to="/admin/payments" className={`nav-item ${isLinkActive('/admin/payments') ? 'active' : ''}`} onClick={closeSidebar}>
                <CreditCard size={20} /> Payments (MoMo)
              </Link>
              <Link to="/admin/loans" className={`nav-item ${isLinkActive('/admin/loans') ? 'active' : ''}`} onClick={closeSidebar}>
                <Target size={20} /> Loan Mgt.
              </Link>
              <Link to="/investor" className={`nav-item ${isLinkActive('/investor') ? 'active' : ''}`} onClick={closeSidebar}>
                <PieChart size={20} /> Investor Suite
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title="Administrative Oversight and Analytics">
              <Link to="/admin/reports" className={`nav-item ${isLinkActive('/admin/reports') ? 'active' : ''}`} onClick={closeSidebar}>
                <PieChart size={20} /> Reports & Analytics
              </Link>
              <Link to="/admin/audit" className={`nav-item ${isLinkActive('/admin/audit') ? 'active' : ''}`} onClick={closeSidebar}>
                <FileText size={20} /> Audit Logs
              </Link>
              <Link to="/admin/fraud" className={`nav-item ${isLinkActive('/admin/fraud') ? 'active' : ''}`} onClick={closeSidebar}>
                <AlertTriangle size={20} /> Fraud Detection
              </Link>
              <Link to="/admin/ai-risk-scores" className={`nav-item ${isLinkActive('/admin/ai-risk-scores') ? 'active' : ''}`} onClick={closeSidebar}>
                <Shield size={20} /> AI Risk Center
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title="Settings">
              <Link to="/admin/settings" className={`nav-item ${isLinkActive('/admin/settings') ? 'active' : ''}`} onClick={closeSidebar}>
                <Settings size={20} /> Platform Config
              </Link>
              <Link to="/admin/integrations" className={`nav-item ${isLinkActive('/admin/integrations') ? 'active' : ''}`} onClick={closeSidebar}>
                <Building2 size={20} /> Integrations
              </Link>
              <Link to="/partners" className={`nav-item ${isLinkActive('/partners') ? 'active' : ''}`} onClick={closeSidebar}>
                <Globe size={20} /> Banking Partners
              </Link>
              <Link to="/admin/alerts" className={`nav-item ${isLinkActive('/admin/alerts') ? 'active' : ''}`} onClick={closeSidebar}>
                <Bell size={20} /> Notifications
              </Link>
            </CollapsibleSection>
          </>)}


          {/* ——— GROUP LEADER SIDEBAR ——— */}
          {userRole === 'leader' && (<>
            <Link to="/dashboard" className={`nav-item ${isLinkActive('/dashboard') ? 'active' : ''}`} onClick={closeSidebar}>
              <LayoutDashboard size={20} /> Dashboard
            </Link>
            
            <CollapsibleSection title="Group Management">
              <Link to="/leader/group" className={`nav-item ${isLinkActive('/leader/group') ? 'active' : ''}`} onClick={closeSidebar}>
                <Globe size={20} /> My Group
              </Link>
              <Link to="/leader/members" className={`nav-item ${isLinkActive('/leader/members') ? 'active' : ''}`} onClick={closeSidebar}>
                <Users size={20} /> Group Members
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title="Contributions">
              <Link to="/leader/contributions" className={`nav-item ${isLinkActive('/leader/contributions') ? 'active' : ''}`} onClick={closeSidebar}>
                <Wallet size={20} /> Contributions
              </Link>
              <Link to="/leader/schedule" className={`nav-item ${isLinkActive('/leader/schedule') ? 'active' : ''}`} onClick={closeSidebar}>
                <Clock size={20} /> Schedule
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title="Payout System">
              <Link to="/leader/rotation" className={`nav-item ${isLinkActive('/leader/rotation') ? 'active' : ''}`} onClick={closeSidebar}>
                <Activity size={20} /> Rotation Plan
              </Link>
              <Link to="/leader/disbursements" className={`nav-item ${isLinkActive('/leader/disbursements') ? 'active' : ''}`} onClick={closeSidebar}>
                <Briefcase size={20} /> Disbursements
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title="Loans">
              <Link to="/leader/loan-requests" className={`nav-item ${isLinkActive('/leader/loan-requests') ? 'active' : ''}`} onClick={closeSidebar}>
                <FileText size={20} /> Loan Requests
              </Link>
              <Link to="/leader/loan-tracking" className={`nav-item ${isLinkActive('/leader/loan-tracking') ? 'active' : ''}`} onClick={closeSidebar}>
                <Target size={20} /> Active Loans
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title="Communication">
              <Link to="/leader/announcements" className={`nav-item ${isLinkActive('/leader/announcements') ? 'active' : ''}`} onClick={closeSidebar}>
                <MessageSquare size={20} /> Chat / Notices
              </Link>
              <Link to="/leader/notifications" className={`nav-item ${isLinkActive('/leader/notifications') ? 'active' : ''}`} onClick={closeSidebar}>
                <Bell size={20} /> Notifications
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title="Reports & Settings">
              <Link to="/leader/reports" className={`nav-item ${isLinkActive('/leader/reports') ? 'active' : ''}`} onClick={closeSidebar}>
                <PieChart size={20} /> Group Reports
              </Link>
              <Link to="/leader/settings" className={`nav-item ${isLinkActive('/leader/settings') ? 'active' : ''}`} onClick={closeSidebar}>
                <Settings size={20} /> Group Settings
              </Link>
            </CollapsibleSection>
          </>)}


          {/* ——— USER/MEMBER SIDEBAR ——— */}
          {(userRole === 'user' || userRole === 'member') && (<>
            <Link to="/dashboard" className={`nav-item ${isLinkActive('/dashboard') ? 'active' : ''}`} onClick={closeSidebar}>
              <LayoutDashboard size={20} /> Dashboard
            </Link>
            
            <CollapsibleSection title="My Groups">
              <Link to="/groups" className={`nav-item ${isLinkActive('/groups') ? 'active' : ''}`} onClick={closeSidebar}>
                <Globe size={20} /> Joined Groups
              </Link>
              {/* Fallback routing till dynamic group views exist */}
              <Link to="/groups" className={`nav-item`} onClick={closeSidebar}>
                <Users size={20} /> Group Details
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title="Contributions">
              <Link to="/wallet" className={`nav-item ${isLinkActive('/wallet') ? 'active' : ''}`} onClick={closeSidebar}>
                <Wallet size={20} /> Make Contribution
              </Link>
              <Link to="/wallet" className={`nav-item`} onClick={closeSidebar}>
                <Activity size={20} /> Contrib. History
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title="Payouts">
              <Link to="/dashboard" className={`nav-item`} onClick={closeSidebar}>
                <Clock size={20} /> My Turn
              </Link>
              <Link to="/dashboard" className={`nav-item`} onClick={closeSidebar}>
                <Briefcase size={20} /> Payout History
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title="Loans">
              <Link to="/marketplace" className={`nav-item ${isLinkActive('/marketplace') ? 'active' : ''}`} onClick={closeSidebar}>
                <Target size={20} /> Request Loan
              </Link>
              <Link to="/marketplace" className={`nav-item`} onClick={closeSidebar}>
                <CreditCard size={20} /> Loan Status
              </Link>
            </CollapsibleSection>
            
            <CollapsibleSection title="Wallet">
              <Link to="/wallet" className={`nav-item ${isLinkActive('/wallet') ? 'active' : ''}`} onClick={closeSidebar}>
                <Wallet size={20} /> My Wallet
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title="Communication">
              <Link to="/messages" className={`nav-item ${isLinkActive('/messages') ? 'active' : ''}`} onClick={closeSidebar}>
                <MessageSquare size={20} /> Group Chat
              </Link>
              <Link to="/notifications" className={`nav-item ${isLinkActive('/notifications') ? 'active' : ''}`} onClick={closeSidebar}>
                <Bell size={20} /> Notifications
              </Link>
            </CollapsibleSection>
          </>)}


          {/* ——— TREASURER / AUDITOR SIDEBAR ——— */}
          {userRole === 'auditor' && (<>
            <Link to="/auditor" className={`nav-item ${isLinkActive('/auditor') ? 'active' : ''}`} onClick={closeSidebar}>
              <LayoutDashboard size={20} /> Dashboard
            </Link>
            
            <CollapsibleSection title="Financial Records">
              <Link to="/auditor/transactions" className={`nav-item ${isLinkActive('/auditor/transactions') ? 'active' : ''}`} onClick={closeSidebar}>
                <Activity size={20} /> Transaction Logs
              </Link>
              <Link to="/auditor/contributions" className={`nav-item ${isLinkActive('/auditor/contributions') ? 'active' : ''}`} onClick={closeSidebar}>
                <Wallet size={20} /> Contribution Logs
              </Link>
              <Link to="/auditor/payouts" className={`nav-item ${isLinkActive('/auditor/payouts') ? 'active' : ''}`} onClick={closeSidebar}>
                <Briefcase size={20} /> Payout Verifica.
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title="Reports">
              <Link to="/auditor/reports" className={`nav-item ${isLinkActive('/auditor/reports') ? 'active' : ''}`} onClick={closeSidebar}>
                <PieChart size={20} /> Financial Reports
              </Link>
              <Link to="/auditor/audit" className={`nav-item ${isLinkActive('/auditor/audit') ? 'active' : ''}`} onClick={closeSidebar}>
                <FileText size={20} /> Audit Reports
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title="Monitoring">
              <Link to="/auditor/discrepancies" className={`nav-item ${isLinkActive('/auditor/discrepancies') ? 'active' : ''}`} onClick={closeSidebar}>
                <AlertTriangle size={20} /> Discrepancies
              </Link>
              <Link to="/auditor/fraud" className={`nav-item ${isLinkActive('/auditor/fraud') ? 'active' : ''}`} onClick={closeSidebar}>
                <Shield size={20} /> Fraud Checks
              </Link>
            </CollapsibleSection>
          </>)}

          {/* ——— SHARED BOTTOM ——— */}
          <CollapsibleSection title="Others" defaultOpen={true}>
            <Link to="/settings" className={`nav-item ${isLinkActive('/settings') ? 'active' : ''}`} onClick={closeSidebar}>
              <Settings size={20} /> Profile / Settings
            </Link>
            {(userRole === 'user' || userRole === 'member') && (
              <Link to="/settings" className={`nav-item ${isLinkActive('/settings') ? 'active' : ''}`} onClick={closeSidebar}>
                <Shield size={20} /> KYC Verification
              </Link>
            )}
            {(userRole === 'user' || userRole === 'member' || userRole === 'community' || userRole === 'admin' || userRole === 'super-admin') && (
              <Link to="/support" className={`nav-item ${isLinkActive('/support') ? 'active' : ''}`} onClick={closeSidebar}>
                <HelpCircle size={20} /> Help / Support
              </Link>
            )}
            <div className="nav-item nav-item-logout" onClick={() => { handleLogout(); closeSidebar(); }}>
              <LogOut size={20} /> Logout
            </div>
          </CollapsibleSection>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
