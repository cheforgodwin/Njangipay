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
  Briefcase
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

  // Map old/different role naming conventions to the strict 4-role system
  let userRole = userData?.role || 'member';
  if (userRole === 'user') userRole = 'member';
  if (userRole === 'super-admin') userRole = 'admin';

  return (
    <>
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
      
      <aside className={`sidebar ${sidebarOpen ? 'active' : ''}`}>
        <Link to="/" className="sidebar-logo logo" onClick={closeSidebar}>
          <img src={logo} alt="NjangiPay" className="logo-icon" />
          NjangiPay
        </Link>
        
        <nav className="sidebar-nav sidebar-nav-container">
          
          {/* ——— ADMIN SIDEBAR ——— */}
          {userRole === 'admin' && (<>
            <Link to="/super-admin" className={`nav-item ${isLinkActive('/super-admin') ? 'active' : ''}`} onClick={closeSidebar}>
              <LayoutDashboard size={20} /> Super Admin Dashboard
            </Link>

            <CollapsibleSection title="User Management">
              <Link to="/admin/users" className={`nav-item ${isLinkActive('/admin/users') ? 'active' : ''}`} onClick={closeSidebar}>
                <Users size={20} /> Manage Users
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title="Group Management">
              <Link to="/admin/communities" className={`nav-item ${isLinkActive('/admin/communities') ? 'active' : ''}`} onClick={closeSidebar}>
                <Globe size={20} /> Manage Communities
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title="Financial Control">
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

            <CollapsibleSection title="System Monitoring">
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


          {/* ——— MEMBER SIDEBAR (also fallback) ——— */}
          {userRole === 'member' && (<>
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
            {userRole === 'member' && (
              <Link to="/settings" className={`nav-item ${isLinkActive('/settings') ? 'active' : ''}`} onClick={closeSidebar}>
                <Shield size={20} /> KYC Verification
              </Link>
            )}
            {(userRole === 'member' || userRole === 'admin') && (
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
