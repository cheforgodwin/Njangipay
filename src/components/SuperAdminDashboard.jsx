import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Users, 
  Target, 
  CreditCard, 
  LayoutDashboard, 
  Wallet, 
  Sun, 
  Moon, 
  Shield, 
  Activity, 
  TrendingUp, 
  BarChart3,
  Globe,
  Settings,
  AlertCircle
} from 'lucide-react';
import { collection, query, onSnapshot, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import './Dashboard.css';

import MainLayout from './MainLayout';

const SuperAdminDashboard = ({ theme, toggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    { label: "Total Users", value: "24,592", icon: <Users size={24} />, color: "#3498db" },
    { label: "Active Groups", value: "1,204", icon: <Target size={24} />, color: "var(--primary-green)" },
    { label: "Total Volume", value: "$4.2M", icon: <Activity size={24} />, color: "#9b59b6" },
    { label: "Platform Revenue", value: "$125K", icon: <TrendingUp size={24} />, color: "#e67e22" }
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'overview':
        return (
          <div className="glass card" style={{ padding: '2rem' }}>
             <h3>System Health</h3>
             <p className="text-sub">All systems operational. No active risk alerts.</p>
          </div>
        );
      case 'users':
        return (
          <div className="glass card" style={{ padding: '2rem' }}>
             <h3>User Management</h3>
             <p className="text-sub">List of all users will appear here.</p>
          </div>
        );
      case 'groups':
        return (
          <div className="glass card" style={{ padding: '2rem' }}>
             <h3>Group Oversight</h3>
             <p className="text-sub">Active savings groups and their status.</p>
          </div>
        );
      case 'settings':
        return (
          <div className="glass card" style={{ padding: '2rem' }}>
             <h3>Global Configuration</h3>
             <p className="text-sub">System-wide settings and parameters.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <MainLayout theme={theme} toggleTheme={toggleTheme}>
      <header className="dashboard-header">
        <div>
          <h1>Nexus Command</h1>
          <p className="text-sub">Platform-wide governance and financial oversight.</p>
        </div>
        <div className="flex gap-1">
           <button className="btn-secondary">Export Audit</button>
           <button className="btn-primary">Platform Alert</button>
        </div>
      </header>

      {/* Overview Stats (only in Overview tab) */}
      {activeTab === 'overview' && (
        <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '2rem' }}>
          {stats.map((stat, i) => (
            <div key={i} className="glass card">
              <div className="flex-between" style={{ marginBottom: '1rem' }}>
                <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color, margin: 0 }}>{stat.icon}</div>
              </div>
              <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>{stat.label}</p>
              <h2 style={{ fontSize: '1.8rem', margin: 0 }}>{stat.value}</h2>
            </div>
          ))}
        </div>
      )}

      {/* Tabs Switcher for Super Admin (Internal) */}
      <div className="flex gap-1" style={{ marginBottom: '2rem', background: 'var(--white)', padding: '5px', borderRadius: '12px', width: 'fit-content', border: '1px solid var(--glass-border)' }}>
        <button onClick={() => setActiveTab('overview')} className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} style={{ padding: '8px 20px', fontSize: '0.9rem' }}>Overview</button>
        <button onClick={() => setActiveTab('users')} className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} style={{ padding: '8px 20px', fontSize: '0.9rem' }}>Users</button>
        <button onClick={() => setActiveTab('groups')} className={`nav-item ${activeTab === 'groups' ? 'active' : ''}`} style={{ padding: '8px 20px', fontSize: '0.9rem' }}>Groups</button>
        <button onClick={() => setActiveTab('settings')} className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} style={{ padding: '8px 20px', fontSize: '0.9rem' }}>Config</button>
      </div>

      {renderContent()}
    </MainLayout>
  );
};

export default SuperAdminDashboard;
