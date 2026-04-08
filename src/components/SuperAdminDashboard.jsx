import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Target, Activity, TrendingUp,
  AlertCircle, Search, CheckCircle,
  Trash2, Save, Globe, Shield, PieChart,
  Settings, Check, Smartphone, Bell,
  LayoutDashboard, Database, UserPlus,
  ArrowRightLeft, FileText, Ban,
  Zap, Power, Filter
} from 'lucide-react';
import { 
  collection, query, where, onSnapshot, 
  orderBy, limit, doc, updateDoc, 
  deleteDoc, addDoc, setDoc, getDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import MainLayout from './MainLayout';
import './Dashboard.css';

const SuperAdminDashboard = ({ theme, toggleTheme, initialTab = 'overview' }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // States
  const [activeTab, setActiveTab] = useState(initialTab);
  const [allUsers, setAllUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activities, setActivities] = useState([]);
  const [bankRequests, setBankRequests] = useState([]);
  const [systemEvents, setSystemEvents] = useState([]);
  
  const [platformStats, setPlatformStats] = useState({ 
    totalUsers: 0, 
    activeGroups: 0, 
    totalVolume: 0, 
    transactions: 0 
  });
  
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');
  
  // Config States
  const [alertMessage, setAlertMessage] = useState('');
  const [globalInterestRate, setGlobalInterestRate] = useState('5.5');
  const [maxLoanAmount, setMaxLoanAmount] = useState('1000000');
  const [minDeposit, setMinDeposit] = useState('500');
  const [withdrawalFee, setWithdrawalFee] = useState('2.5');
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  // Load saved config from Firestore on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configSnap = await getDoc(doc(db, 'system_config', 'loan_settings'));
        if (configSnap.exists()) {
          const data = configSnap.data();
          if (data.globalInterestRate) setGlobalInterestRate(String(data.globalInterestRate));
          if (data.maxLoanAmount) setMaxLoanAmount(String(data.maxLoanAmount));
          if (data.minDeposit) setMinDeposit(String(data.minDeposit));
          if (data.withdrawalFee) setWithdrawalFee(String(data.withdrawalFee));
          if (data.isMaintenance) setIsMaintenance(!!data.isMaintenance);
        }
      } catch (e) {
        console.warn('Could not load system config:', e);
      }
    };
    loadConfig();

    // System Broadcasts
    const qEvents = query(collection(db, "system_events"), orderBy("createdAt", "desc"), limit(20));
    const unsubEvents = onSnapshot(qEvents, (snap) => {
      setSystemEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsubEvents();
  }, []);

  // Main Data Listeners
  useEffect(() => {
    // Users
    const qU = query(collection(db, "users"), limit(100));
    const unsubUsers = onSnapshot(qU, (snap) => {
      const userData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllUsers(userData);
      setPlatformStats(prev => ({ ...prev, totalUsers: snap.size }));
    });

    // Groups
    const qG = query(collection(db, "groups"), orderBy("createdAt", "desc"), limit(50));
    const unsubGroups = onSnapshot(qG, (snap) => {
      setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setPlatformStats(prev => ({ ...prev, activeGroups: snap.size }));
    });

    // Transactions / Activities
    const qT = query(collection(db, "transactions"), orderBy("timestamp", "desc"), limit(100));
    const unsubTrans = onSnapshot(qT, (snap) => {
      const transData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const totalVol = transData.reduce((acc, d) => acc + (d.amount || 0), 0);
      setActivities(transData);
      setPlatformStats(prev => ({ ...prev, totalVolume: totalVol, transactions: snap.size }));
      setLoading(false);
    });

    // Bank Requests
    const qB = query(collection(db, "users"), where("role", "==", "bank-admin"), where("isApproved", "==", false));
    const unsubBankReq = onSnapshot(qB, (snap) => {
      setBankRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubUsers(); unsubGroups(); unsubTrans(); unsubBankReq(); };
  }, []);

  // Handlers
  const handleChangeRole = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
    } catch (e) {
      alert('Update failed.');
    }
  };

  const handleApproveBank = async (userId) => {
    try {
      await updateDoc(doc(db, "users", userId), { isApproved: true, status: 'active' });
      alert('Bank approved successfully!');
    } catch (e) {
      alert('Approval failed.');
    }
  };

  const handleRejectBank = async (userId) => {
    if (!window.confirm("Reject this bank application?")) return;
    try {
      await updateDoc(doc(db, "users", userId), { role: 'user', isApproved: false, status: 'rejected' });
    } catch (e) {
      alert('Action failed.');
    }
  };

  const handleSuspendUser = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      await updateDoc(doc(db, "users", userId), { status: newStatus });
    } catch (e) {
      alert('Action failed.');
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`Permanently delete user ${email}?`)) return;
    try {
      await deleteDoc(doc(db, "users", userId));
    } catch (e) {
      alert('Deletion failed.');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await deleteDoc(doc(db, "system_events", eventId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendAlert = async () => {
    if (!alertMessage.trim()) return;
    try {
      await addDoc(collection(db, "system_events"), {
        message: alertMessage,
        type: 'admin_broadcast',
        createdBy: currentUser?.uid || 'super-admin',
        createdAt: serverTimestamp()
      });
      setAlertMessage('');
      alert('Broadcast sent!');
    } catch (e) {
      alert('Failed to send broadcast.');
    }
  };

  const handleSaveConfig = async () => {
    setConfigSaving(true);
    setConfigSaved(false);
    try {
      await setDoc(doc(db, 'system_config', 'loan_settings'), {
        globalInterestRate: parseFloat(globalInterestRate),
        maxLoanAmount: parseInt(maxLoanAmount),
        minDeposit: parseInt(minDeposit),
        withdrawalFee: parseFloat(withdrawalFee),
        isMaintenance: isMaintenance,
        updatedBy: currentUser?.uid || 'super-admin',
        updatedAt: serverTimestamp()
      });
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 3000);
    } catch (e) {
      alert('Failed to save config.');
    } finally {
      setConfigSaving(false);
    }
  };

  const handleExportAudit = () => {
    const rows = [
      ['Report', 'NjangiPay Platform Audit'],
      ['Total Users', platformStats.totalUsers],
      ['Total Volume', platformStats.totalVolume],
      ['Date', new Date().toLocaleString()]
    ];
    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `njangipay_audit_${Date.now()}.csv`);
    link.click();
  };

  // Filters
  const filteredUsers = allUsers.filter(u =>
    u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredGroups = groups.filter(g =>
    g.name?.toLowerCase().includes(groupSearch.toLowerCase())
  );

  const filteredActs = activities.filter(a => activityFilter === 'all' || a.type === activityFilter);

  // Components
  const renderContent = () => {
    switch(activeTab) {
      case 'overview':
        return (
          <div className="flex" style={{ flexDirection: 'column', gap: '2rem' }}>
            <div className="glass card" style={{ padding: '2rem' }}>
              <h3 className="flex gap-1" style={{ marginBottom: '1.5rem', alignItems: 'center' }}>
                <Activity size={20} color="var(--primary-green)" /> System Health
              </h3>
              <div className="grid grid-3 superadmin-stats">
                <div style={{ padding: '1.5rem', background: 'rgba(46,204,113,0.08)', borderRadius: '15px' }}>
                  <p className="text-muted" style={{ fontSize: '0.8rem' }}>Transactions</p>
                  <h2 style={{ color: 'var(--primary-green)' }}>{platformStats.transactions}</h2>
                </div>
                <div style={{ padding: '1.5rem', background: 'rgba(52,152,219,0.08)', borderRadius: '15px' }}>
                  <p className="text-muted" style={{ fontSize: '0.8rem' }}>Total Volume</p>
                  <h2 style={{ color: '#3498db' }}>{platformStats.totalVolume.toLocaleString()}</h2>
                </div>
                <div style={{ padding: '1.5rem', background: 'rgba(241,196,15,0.08)', borderRadius: '15px' }}>
                  <p className="text-muted" style={{ fontSize: '0.8rem' }}>Platform Status</p>
                  <h2 style={{ color: '#f1c40f', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={22} /> Online
                  </h2>
                </div>
              </div>
            </div>

            <div className="glass card" style={{ padding: '2rem' }}>
              <h3 className="flex gap-1" style={{ marginBottom: '0.5rem', alignItems: 'center' }}>
                <Bell size={20} color="var(--primary-green)" /> Platform Broadcast
              </h3>
              <p className="text-sub" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Send a security alert or maintenance notification.</p>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  placeholder="New broadcast message..."
                  className="auth-input"
                  style={{ flex: 1, margin: 0 }}
                />
                <button className="btn-primary" onClick={handleSendAlert}>
                  Broadcast
                </button>
              </div>

              {systemEvents.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                  <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '1rem' }}>Sent Alerts</p>
                  {systemEvents.map(evt => (
                    <div key={evt.id} className="flex-between" style={{ padding: '12px', borderBottom: '1px solid var(--glass-border)' }}>
                      <div className="flex gap-1" style={{ fontSize: '0.9rem' }}>
                        <Zap size={14} color="#f1c40f" fill="#f1c40f" />
                        <span>{evt.message}</span>
                      </div>
                      <Trash2 size={14} className="clickable" onClick={() => handleDeleteEvent(evt.id)} style={{ color: '#e74c3c', opacity: 0.5 }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="glass card" style={{ padding: '0', overflow: 'hidden' }}>
            <div className="flex-between" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)' }}>
              <h3 className="flex gap-1" style={{ margin: 0, alignItems: 'center' }}>
                <Users size={20} /> User Sovereignty
              </h3>
              <div className="search-input-wrapper">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search name/email..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr><th>User</th><th>Identifier</th><th>Role</th><th>Status</th><th>Control</th></tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.displayName || 'Unnamed'}</td>
                      <td className="text-muted" style={{ fontSize: '0.8rem' }}>{u.email}</td>
                      <td>
                        <select
                          defaultValue={u.role || 'user'}
                          onChange={e => handleChangeRole(u.id, e.target.value)}
                          className="glass"
                          style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem' }}
                        >
                          <option value="user">Member</option>
                          <option value="bank-admin">Bank Partner</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        <span className={`status-pill ${u.status === 'suspended' ? 'status-unpaid' : 'status-paid'}`}>
                          {u.status || 'Active'}
                        </span>
                      </td>
                      <td className="flex gap-1">
                        <button onClick={() => handleSuspendUser(u.id, u.status)} className="btn-secondary" style={{ padding: '4px 8px' }}>
                          <Ban size={14} />
                        </button>
                        <button onClick={() => handleDeleteUser(u.id, u.email)} className="btn-secondary" style={{ padding: '4px 8px', color: '#e74c3c' }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'approvals':
        return (
          <div className="glass card" style={{ padding: '0', overflow: 'hidden' }}>
            <div className="flex-between" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)' }}>
              <h3 className="flex gap-1" style={{ alignItems: 'center', margin: 0 }}>
                <CheckCircle size={20} /> Bank Partner pipeline
              </h3>
            </div>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr><th>Identity</th><th>Email</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {bankRequests.map(r => (
                    <tr key={r.id}>
                      <td>{r.displayName}</td>
                      <td>{r.email}</td>
                      <td className="flex gap-1">
                        <button className="btn-primary" onClick={() => handleApproveBank(r.id)}>Approve</button>
                        <button className="btn-secondary" onClick={() => handleRejectBank(r.id)}>Decline</button>
                      </td>
                    </tr>
                  ))}
                  {bankRequests.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', padding: '3rem' }}>No pending applications.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'activity':
        return (
          <div className="glass card" style={{ padding: '0', overflow: 'hidden' }}>
            <div className="flex-between" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 className="flex gap-1" style={{ alignItems: 'center', margin: 0 }}>
                <ArrowRightLeft size={20} /> Global Data Feed
              </h3>
              <div className="flex gap-1">
                <button className="btn-secondary flex gap-1" onClick={handleExportAudit} style={{ fontSize: '0.8rem' }}>
                  <FileText size={14} /> Audit Log
                </button>
                <div className="flex gap-1">
                  {['all', 'deposit', 'withdrawal'].map(f => (
                    <button key={f} onClick={() => setActivityFilter(f)} className={`btn-secondary ${activityFilter === f ? 'active' : ''}`} style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr><th>Type</th><th>Amount</th><th>Time</th></tr>
                </thead>
                <tbody>
                  {filteredActs.map(a => (
                    <tr key={a.id}>
                      <td style={{ textTransform: 'capitalize' }}>{a.type}</td>
                      <td style={{ color: a.type === 'deposit' ? 'var(--primary-green)' : '#e74c3c', fontWeight: 600 }}>
                        {a.amount?.toLocaleString()} XAF
                      </td>
                      <td className="text-muted">{a.timestamp?.toDate ? a.timestamp.toDate().toLocaleTimeString() : 'Pending'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="glass card" style={{ padding: '2rem' }}>
            <h3 className="flex gap-1" style={{ marginBottom: '1.5rem', alignItems: 'center' }}>
              <Settings size={20} /> Platform Configuration
            </h3>
            <div className="grid grid-2" style={{ gap: '1.5rem' }}>
              <div>
                <label className="text-sub" style={{ display: 'block', marginBottom: '8px' }}>Interest Rate (%)</label>
                <input type="number" value={globalInterestRate} onChange={e => setGlobalInterestRate(e.target.value)} className="auth-input" style={{ width: '100%' }} />
              </div>
              <div>
                <label className="text-sub" style={{ display: 'block', marginBottom: '8px' }}>Max Loan (XAF)</label>
                <input type="number" value={maxLoanAmount} onChange={e => setMaxLoanAmount(e.target.value)} className="auth-input" style={{ width: '100%' }} />
              </div>
              <div>
                <label className="text-sub" style={{ display: 'block', marginBottom: '8px' }}>Min Deposit (XAF)</label>
                <input type="number" value={minDeposit} onChange={e => setMinDeposit(e.target.value)} className="auth-input" style={{ width: '100%' }} />
              </div>
              <div>
                <label className="text-sub" style={{ display: 'block', marginBottom: '8px' }}>Platform Fee (%)</label>
                <input type="number" value={withdrawalFee} onChange={e => setWithdrawalFee(e.target.value)} className="auth-input" style={{ width: '100%' }} />
              </div>
            </div>

            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)' }}>
              <div className="flex-between">
                <div>
                  <h4 className="flex gap-1" style={{ color: '#e74c3c' }}>
                    <Power size={18} /> Emergency Protocol
                  </h4>
                  <p className="text-sub" style={{ fontSize: '0.8rem' }}>Freeze all incoming deposits and marketplace rotations.</p>
                </div>
                <button 
                  onClick={() => setIsMaintenance(!isMaintenance)}
                  className={`btn-secondary ${isMaintenance ? 'active' : ''}`}
                  style={{ borderColor: isMaintenance ? '#e74c3c' : '', color: isMaintenance ? '#e74c3c' : '' }}
                >
                   Maintenance {isMaintenance ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            <div className="flex gap-1" style={{ marginTop: '3rem' }}>
              <button 
                className="btn-primary flex gap-1" 
                onClick={handleSaveConfig} 
                disabled={configSaving}
                style={{ background: configSaved ? 'var(--primary-green)' : '' }}
              >
                {configSaving ? 'Writing to disk...' : (configSaved ? <><Check size={18} /> Synced</> : <><Save size={18} /> Deploy Configuration</>)}
              </button>
            </div>
          </div>
        );

      case 'audits':
        return (
          <div className="glass card" style={{ padding: '3rem', textAlign: 'center' }}>
            <Shield size={64} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
            <h3>High-Integrity Audit Framework</h3>
            <p className="text-sub" style={{ maxWidth: '400px', margin: '0 auto 2rem' }}>Every administrative pulse and financial exchange is cryptographically logged for absolute sovereignty.</p>
            <button className="btn-primary" onClick={handleExportAudit}>Generate CSV Repository</button>
          </div>
        );
      default: return null;
    }
  };

  const dashboardTabs = [
    { key: 'overview', label: 'Pulse', icon: <Activity size={16} /> },
    { key: 'users', label: 'Identity', icon: <Users size={16} /> },
    { key: 'approvals', label: 'Partners', icon: <Smartphone size={16} /> },
    { key: 'groups', label: 'Groups', icon: <Globe size={16} /> },
    { key: 'activity', label: 'Flow', icon: <ArrowRightLeft size={16} /> },
    { key: 'audits', label: 'Audit', icon: <Shield size={16} /> },
    { key: 'settings', label: 'Control', icon: <Database size={16} /> },
  ];

  if (loading && activeTab !== 'settings') {
    return (
      <MainLayout theme={theme} toggleTheme={toggleTheme}>
        <div className="flex-center" style={{ height: '80vh' }}>
          <Zap size={48} className="spin" color="var(--primary-green)" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout theme={theme} toggleTheme={toggleTheme}>
      <header className="dashboard-header">
        <div className="flex gap-2" style={{ alignItems: 'center' }}>
          <div style={{ padding: '15px', background: 'var(--primary-green)', borderRadius: '18px', color: 'white' }}>
            {currentUser?.email === 'cheforgodwin01@gmail.com' ? <Shield size={32} /> : <Zap size={32} fill="white" />}
          </div>
          <div>
             <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>NjangiPay Command</h1>
             <p className="text-sub">Platform sovereignty and financial governance.</p>
          </div>
        </div>
        <div className="flex gap-1" style={{ alignItems: 'flex-start' }}>
          <button className="btn-secondary" onClick={handleExportAudit}>Sovereignty Audit</button>
          <button className="btn-primary" onClick={() => setActiveTab('settings')}>
            <Power size={18} /> Global Control
          </button>
        </div>
      </header>

      {/* KPI Stats */}
      {activeTab === 'overview' && (
        <div className="grid grid-4" style={{ marginBottom: '2.5rem', gap: '1.5rem' }}>
          {[
            { l: 'Identity Count', v: platformStats.totalUsers, i: <Users />, c: '#3498db' },
            { l: 'Global Hubs', v: platformStats.activeGroups, i: <Target />, c: 'var(--primary-green)' },
            { l: 'Currency Liquidity', v: platformStats.totalVolume.toLocaleString() + ' XAF', i: <ArrowRightLeft />, c: '#9b59b6' },
            { l: 'Network Pulse', v: platformStats.transactions, i: <TrendingUp />, c: '#e67e22' }
          ].map((s, idx) => (
            <div key={idx} className="glass card" style={{ padding: '1.5rem' }}>
              <div style={{ color: s.c, marginBottom: '1rem' }}>{s.i}</div>
              <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>{s.l}</p>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{s.v}</h2>
            </div>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex dashboard-tab-nav" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
        {dashboardTabs.map(t => (
          <button 
            key={t.key} 
            onClick={() => setActiveTab(t.key)}
            className={`nav-item ${activeTab === t.key ? 'active' : ''}`}
            style={{ padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="dashboard-content-area">
        {renderContent()}
      </div>
    </MainLayout>
  );
};

export default SuperAdminDashboard;
