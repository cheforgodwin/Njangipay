import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Target, Activity, TrendingUp,
  AlertCircle, Search, CheckCircle,
  Trash2, Save
} from 'lucide-react';
import { collection, query, onSnapshot, orderBy, limit, doc, updateDoc, deleteDoc, addDoc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import MainLayout from './MainLayout';
import './Dashboard.css';

const SuperAdminDashboard = ({ theme, toggleTheme }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [platformStats, setPlatformStats] = useState({ totalUsers: 0, activeGroups: 0, totalVolume: 0, transactions: 0 });
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [globalInterestRate, setGlobalInterestRate] = useState('5.5');
  const [maxLoanAmount, setMaxLoanAmount] = useState('1000000');
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
        }
      } catch (e) {
        console.warn('Could not load system config:', e);
      }
    };
    loadConfig();
  }, []);

  useEffect(() => {
    const qUsers = query(collection(db, "users"), limit(50));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      const userData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(userData.length > 0 ? userData : [
        { id: 'u1', displayName: 'Alice M.', email: 'alice@test.com', role: 'user', balance: 250000 },
        { id: 'u2', displayName: 'Bob N.', email: 'bob@test.com', role: 'admin', balance: 890000 },
        { id: 'u3', displayName: 'Clarisse T.', email: 'clarisse@test.com', role: 'user', balance: 450000 },
      ]);
      setPlatformStats(prev => ({ ...prev, totalUsers: snap.size || 3 }));
    });

    const qGroups = query(collection(db, "groups"), orderBy("createdAt", "desc"), limit(20));
    const unsubGroups = onSnapshot(qGroups, (snap) => {
      const groupData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setGroups(groupData.length > 0 ? groupData : [
        { id: 'g1', name: 'Global Hub Unit A', members: 124, status: 'Active', totalFund: 5000000 },
        { id: 'g2', name: 'Branch Yaoundé Central', members: 85, status: 'Active', totalFund: 3200000 },
      ]);
      setPlatformStats(prev => ({ ...prev, activeGroups: snap.size || 2 }));
    });

    const qTrans = query(collection(db, "transactions"), limit(100));
    const unsubTrans = onSnapshot(qTrans, (snap) => {
      const totalVol = snap.docs.reduce((acc, d) => acc + (d.data().amount || 0), 0);
      setPlatformStats(prev => ({ ...prev, totalVolume: totalVol, transactions: snap.size }));
      setLoading(false);
    });

    return () => { unsubUsers(); unsubGroups(); unsubTrans(); };
  }, []);

  const handleChangeRole = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
    } catch (e) {
      alert('Update failed (mock data — no real doc to update).');
    }
  };

  const handleDeleteGroup = async (groupId, groupName) => {
    if (!window.confirm(`Delete group "${groupName}"? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, "groups", groupId));
    } catch (e) {
      alert('Delete failed (mock data — no real doc to delete).');
    }
  };

  const handleSendAlert = async () => {
    if (!alertMessage.trim()) return alert('Alert message cannot be empty.');
    try {
      await addDoc(collection(db, "system_events"), {
        message: alertMessage,
        type: 'admin_broadcast',
        createdBy: currentUser?.uid || 'super-admin',
        createdAt: serverTimestamp()
      });
      setAlertMessage('');
      alert('Platform alert broadcast successfully!');
    } catch (e) {
      alert('Failed to broadcast alert. Check Firestore rules.');
    }
  };

  const handleSaveConfig = async () => {
    setConfigSaving(true);
    setConfigSaved(false);
    try {
      await setDoc(doc(db, 'system_config', 'loan_settings'), {
        globalInterestRate: parseFloat(globalInterestRate),
        maxLoanAmount: parseInt(maxLoanAmount),
        updatedBy: currentUser?.uid || 'super-admin',
        updatedAt: serverTimestamp()
      });
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 3000);
    } catch (e) {
      alert('Failed to save config. Check Firestore rules for system_config.');
    } finally {
      setConfigSaving(false);
    }
  };

  const handleExportAudit = () => {
    const rows = [
      ['Component', 'Value'],
      ['Total Users', platformStats.totalUsers],
      ['Active Groups', platformStats.activeGroups],
      ['Total Volume (XAF)', platformStats.totalVolume],
      ['Transactions Logged', platformStats.transactions],
      ['Export Date', new Date().toLocaleDateString()],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `njangipay_audit_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredUsers = users.filter(u =>
    u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredGroups = groups.filter(g =>
    g.name?.toLowerCase().includes(groupSearch.toLowerCase())
  );

  const roleSelectStyle = {
    padding: '6px 10px',
    borderRadius: '8px',
    border: '1px solid var(--glass-border)',
    background: 'var(--glass-bg)',
    color: 'var(--text-main)',
    fontSize: '0.8rem',
    fontFamily: 'Outfit, sans-serif',
    fontWeight: 600,
    cursor: 'pointer',
    outline: 'none',
    backdropFilter: 'blur(8px)',
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'overview':
        return (
          <div className="flex" style={{ flexDirection: 'column', gap: '2rem' }}>
            {/* System Health */}
            <div className="glass card" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>System Health</h3>
              <div className="grid grid-3 superadmin-stats">
                <div style={{ padding: '1.5rem', background: 'rgba(46,204,113,0.08)', borderRadius: '15px', border: '1px solid rgba(46,204,113,0.15)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total Transactions</p>
                  <h2 style={{ color: 'var(--primary-green)', margin: 0 }}>{platformStats.transactions}</h2>
                </div>
                <div style={{ padding: '1.5rem', background: 'rgba(52,152,219,0.08)', borderRadius: '15px', border: '1px solid rgba(52,152,219,0.15)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total Volume (XAF)</p>
                  <h2 style={{ color: '#3498db', margin: 0 }}>{platformStats.totalVolume.toLocaleString()}</h2>
                </div>
                <div style={{ padding: '1.5rem', background: 'rgba(241,196,15,0.08)', borderRadius: '15px', border: '1px solid rgba(241,196,15,0.2)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Platform Status</p>
                  <h2 style={{ color: '#f1c40f', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <CheckCircle size={24} /> Operational
                  </h2>
                </div>
              </div>
            </div>

            {/* Broadcast Alert */}
            <div className="glass card" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>📢 Broadcast Platform Alert</h3>
              <p className="text-sub" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Send a message to all users of the platform.</p>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  placeholder="Type a broadcast message for all users..."
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid var(--glass-border)',
                    background: 'var(--off-white)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
                <button className="btn-primary" onClick={handleSendAlert} style={{ whiteSpace: 'nowrap' }}>
                  <AlertCircle size={18} /> Broadcast
                </button>
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="glass card" style={{ padding: '0', overflow: 'hidden' }}>
            <div className="flex-between" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ margin: 0 }}>All Users ({filteredUsers.length})</h3>
              <div className="search-input-wrapper" style={{ width: '100%', maxWidth: '280px' }}>
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr><th>User</th><th>Email</th><th>Balance (XAF)</th><th>Current Role</th><th>Change Role</th></tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td style={{ fontWeight: 600 }}>{user.displayName || 'N/A'}</td>
                      <td className="text-muted">{user.email || 'N/A'}</td>
                      <td style={{ fontWeight: 700 }}>{(user.balance || 0).toLocaleString()}</td>
                      <td>
                        <span className={`status-pill ${user.role === 'super-admin' ? 'status-paid' : user.role === 'admin' ? 'status-pending' : ''}`}>
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td>
                        <select
                          defaultValue={user.role || 'user'}
                          onChange={e => handleChangeRole(user.id, e.target.value)}
                          style={roleSelectStyle}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="bank-admin">Bank Admin</option>
                          <option value="super-admin">Super Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'groups':
        return (
          <div className="glass card" style={{ padding: '0', overflow: 'hidden' }}>
            <div className="flex-between" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ margin: 0 }}>All Groups ({filteredGroups.length})</h3>
              <div className="search-input-wrapper" style={{ width: '100%', maxWidth: '280px' }}>
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by group name..."
                  value={groupSearch}
                  onChange={e => setGroupSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr><th>Group Name</th><th>Members</th><th>Status</th><th>Total Fund (XAF)</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredGroups.map(group => (
                    <tr key={group.id}>
                      <td style={{ fontWeight: 600 }}>{group.name}</td>
                      <td>{group.members || 0}</td>
                      <td><span className="status-pill status-paid">{group.status || 'Active'}</span></td>
                      <td style={{ fontWeight: 700 }}>{(group.totalFund || 0).toLocaleString()}</td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            onClick={() => navigate(`/group/${group.id}/contributions`)}
                            className="btn-secondary"
                            style={{ padding: '5px 14px', fontSize: '0.8rem' }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteGroup(group.id, group.name)}
                            className="btn-secondary"
                            style={{ padding: '5px 12px', fontSize: '0.8rem', color: '#e74c3c', borderColor: 'rgba(231,76,60,0.3)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
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
            <h3 style={{ marginBottom: '0.5rem' }}>⚙️ Global Platform Configuration</h3>
            <p className="text-sub" style={{ fontSize: '0.9rem', marginBottom: '2rem' }}>
              These settings are persisted to Firestore and apply platform-wide.
            </p>
            <div className="grid grid-2" style={{ gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
                  Default Loan Interest Rate (%)
                </label>
                <input
                  type="number"
                  value={globalInterestRate}
                  onChange={e => setGlobalInterestRate(e.target.value)}
                  min="0" max="100" step="0.1"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid var(--glass-border)',
                    background: 'var(--off-white)',
                    color: 'var(--text-main)',
                    fontSize: '1rem',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
                  Maximum Loan Amount (XAF)
                </label>
                <input
                  type="number"
                  value={maxLoanAmount}
                  onChange={e => setMaxLoanAmount(e.target.value)}
                  min="0" step="10000"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid var(--glass-border)',
                    background: 'var(--off-white)',
                    color: 'var(--text-main)',
                    fontSize: '1rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div className="flex gap-1" style={{ marginTop: '2rem', alignItems: 'center' }}>
              <button
                className="btn-primary"
                onClick={handleSaveConfig}
                disabled={configSaving}
                style={{ minWidth: '180px' }}
              >
                {configSaving
                  ? 'Saving...'
                  : configSaved
                    ? <><CheckCircle size={18} /> Saved!</>
                    : <><Save size={18} /> Save to Firestore</>
                }
              </button>
              {configSaved && (
                <p style={{ color: 'var(--primary-green)', fontSize: '0.9rem', fontWeight: 600 }}>
                  ✓ Configuration saved successfully.
                </p>
              )}
            </div>

            <div className="glass" style={{ marginTop: '2.5rem', padding: '1.5rem', borderRadius: '12px', background: 'rgba(46,204,113,0.05)', border: '1px solid rgba(46,204,113,0.2)' }}>
              <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Current Applied Settings</h4>
              <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Interest Rate</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-green)' }}>{globalInterestRate}%</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Max Loan</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3498db' }}>{Number(maxLoanAmount).toLocaleString()} XAF</p>
                </div>
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  const stats = [
    { label: "Total Users", value: platformStats.totalUsers, icon: <Users size={24} />, color: "#3498db" },
    { label: "Active Groups", value: platformStats.activeGroups, icon: <Target size={24} />, color: "var(--primary-green)" },
    { label: "Volume (XAF)", value: platformStats.totalVolume.toLocaleString(), icon: <Activity size={24} />, color: "#9b59b6" },
    { label: "Transactions", value: platformStats.transactions, icon: <TrendingUp size={24} />, color: "#e67e22" }
  ];

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'Users' },
    { key: 'groups', label: 'Groups' },
    { key: 'settings', label: 'Config' },
  ];

  return (
    <MainLayout theme={theme} toggleTheme={toggleTheme}>
      <header className="dashboard-header">
        <div>
          <h1>{currentUser?.email === 'cheforgodwin01@gmail.com' ? '🛡️ System Owner Control' : '⚡ Nexus Command'}</h1>
          <p className="text-sub">
            {currentUser?.email === 'cheforgodwin01@gmail.com'
              ? `Welcome back, Godwin. Full platform sovereignty active.`
              : 'Platform-wide governance and financial oversight.'}
          </p>
        </div>
        <div className="flex gap-1">
          <button className="btn-secondary" onClick={handleExportAudit}>Export Audit CSV</button>
          <button className="btn-primary" onClick={() => setActiveTab('overview')}>
            <AlertCircle size={18} /> Platform Alert
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      {activeTab === 'overview' && (
        <div className="grid grid-4 superadmin-kpis">
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

      {/* Tab Nav */}
      <div className="flex dashboard-tab-nav">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`nav-item ${activeTab === tab.key ? 'active' : ''}`}
            style={{ padding: '8px 20px', fontSize: '0.9rem' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && activeTab !== 'settings'
        ? <div className="glass card flex-center" style={{ height: '200px' }}>Loading platform data...</div>
        : renderContent()
      }
    </MainLayout>
  );
};

export default SuperAdminDashboard;
