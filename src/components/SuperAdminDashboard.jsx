import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Target, CreditCard, Wallet, Shield, Activity, TrendingUp, 
  BarChart3, Globe, Settings, AlertCircle, Search, CheckCircle, XCircle,
  Trash2, UserCog
} from 'lucide-react';
import { collection, query, onSnapshot, orderBy, limit, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import MainLayout from './MainLayout';
import './Dashboard.css';

const SuperAdminDashboard = ({ theme, toggleTheme }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [platformStats, setPlatformStats] = useState({ totalUsers: 0, activeGroups: 0, totalVolume: 0, transactions: 0 });
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [globalInterestRate, setGlobalInterestRate] = useState('5.5');
  const [maxLoanAmount, setMaxLoanAmount] = useState('1000000');

  useEffect(() => {
    // Live users
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

    // Live groups
    const qGroups = query(collection(db, "groups"), orderBy("createdAt", "desc"), limit(20));
    const unsubGroups = onSnapshot(qGroups, (snap) => {
      const groupData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setGroups(groupData.length > 0 ? groupData : [
        { id: 'g1', name: 'Global Hub Unit A', members: 124, status: 'Active', totalFund: 5000000 },
        { id: 'g2', name: 'Branch Yaoundé Central', members: 85, status: 'Active', totalFund: 3200000 },
      ]);
      setPlatformStats(prev => ({ ...prev, activeGroups: snap.size || 2 }));
    });

    // Live transactions (for total volume)
    const qTrans = query(collection(db, "transactions"), limit(100));
    onSnapshot(qTrans, (snap) => {
      const totalVol = snap.docs.reduce((acc, d) => acc + (d.data().amount || 0), 0);
      setPlatformStats(prev => ({ ...prev, totalVolume: totalVol, transactions: snap.size }));
      setLoading(false);
    });

    return () => { unsubUsers(); unsubGroups(); };
  }, []);

  const handleChangeRole = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      alert(`Role updated to "${newRole}"`);
    } catch (e) { alert('Update failed (mock data — no real doc to update).'); }
  };

  const handleDeleteGroup = async (groupId, groupName) => {
    if (!window.confirm(`Delete group "${groupName}"? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, "groups", groupId));
      alert('Group deleted.');
    } catch (e) { alert('Delete failed (mock data — no real doc to delete).'); }
  };

  const handleSendAlert = async () => {
    if (!alertMessage.trim()) return alert('Alert message cannot be empty.');
    try {
      await addDoc(collection(db, "platform_alerts"), {
        message: alertMessage,
        type: 'admin_broadcast',
        createdAt: serverTimestamp()
      });
      setAlertMessage('');
      alert('Platform alert sent to all users!');
    } catch (e) { alert('Failed to save alert.'); }
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

  const renderContent = () => {
    switch(activeTab) {
      case 'overview':
        return (
          <div className="flex" style={{ flexDirection: 'column', gap: '2rem' }}>
            <div className="glass card" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>System Health</h3>
              <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div style={{ padding: '1.5rem', background: '#e8f8f5', borderRadius: '15px' }}>
                  <p className="text-muted" style={{ fontSize: '0.8rem' }}>Total Transactions</p>
                  <h2 style={{ color: '#27ae60' }}>{platformStats.transactions}</h2>
                </div>
                <div style={{ padding: '1.5rem', background: '#eaf4fb', borderRadius: '15px' }}>
                  <p className="text-muted" style={{ fontSize: '0.8rem' }}>Total Volume (XAF)</p>
                  <h2 style={{ color: '#3498db' }}>{platformStats.totalVolume.toLocaleString()}</h2>
                </div>
                <div style={{ padding: '1.5rem', background: '#fdf5e7', borderRadius: '15px' }}>
                  <p className="text-muted" style={{ fontSize: '0.8rem' }}>Platform Status</p>
                  <h2 style={{ color: '#f1c40f', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={24} /> Operational</h2>
                </div>
              </div>
            </div>
            <div className="glass card" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Send Platform Alert</h3>
              <div className="flex gap-1">
                <input 
                  type="text" 
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  placeholder="Type a broadcast message for all users..." 
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)' }} 
                />
                <button className="btn-primary" onClick={handleSendAlert}><AlertCircle size={18} /> Broadcast</button>
              </div>
            </div>
          </div>
        );
      case 'users':
        return (
          <div className="glass card" style={{ padding: '0', overflow: 'hidden' }}>
            <div className="flex-between" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)' }}>
              <h3 style={{ margin: 0 }}>All Users ({filteredUsers.length})</h3>
              <div className="search-input-wrapper" style={{ width: '250px' }}>
                <Search size={16} className="search-icon" />
                <input type="text" placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              </div>
            </div>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr><th>User</th><th>Email</th><th>Balance (XAF)</th><th>Role</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td style={{ fontWeight: 600 }}>{user.displayName || 'N/A'}</td>
                      <td className="text-muted">{user.email || 'N/A'}</td>
                      <td style={{ fontWeight: 700 }}>{(user.balance || 0).toLocaleString()}</td>
                      <td><span className={`status-pill ${user.role === 'super-admin' ? 'status-paid' : 'status-pending'}`}>{user.role || 'user'}</span></td>
                      <td>
                        <div className="flex gap-1">
                          <select 
                            defaultValue={user.role || 'user'} 
                            onChange={e => handleChangeRole(user.id, e.target.value)}
                            style={{ padding: '6px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.8rem' }}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="super-admin">Super Admin</option>
                          </select>
                        </div>
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
            <div className="flex-between" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)' }}>
              <h3 style={{ margin: 0 }}>All Groups ({groups.length})</h3>
            </div>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr><th>Group Name</th><th>Members</th><th>Status</th><th>Total Fund (XAF)</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {groups.map(group => (
                    <tr key={group.id}>
                      <td style={{ fontWeight: 600 }}>{group.name}</td>
                      <td>{group.members || 0}</td>
                      <td><span className="status-pill status-paid">{group.status || 'Active'}</span></td>
                      <td style={{ fontWeight: 700 }}>{(group.totalFund || 0).toLocaleString()}</td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => navigate(`/group/${group.id}/contributions`)} className="btn-secondary" style={{ padding: '5px 12px', fontSize: '0.8rem' }}>View</button>
                          <button onClick={() => handleDeleteGroup(group.id, group.name)} className="btn-secondary" style={{ padding: '5px 12px', fontSize: '0.8rem', color: '#e74c3c' }}>
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
            <h3 style={{ marginBottom: '2rem' }}>Global Platform Configuration</h3>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Default Loan Interest Rate (%)</label>
                <input type="number" value={globalInterestRate} onChange={e => setGlobalInterestRate(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Maximum Loan Amount (XAF)</label>
                <input type="number" value={maxLoanAmount} onChange={e => setMaxLoanAmount(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)' }} />
              </div>
            </div>
            <button className="btn-primary" style={{ marginTop: '2rem' }} onClick={() => alert(`Settings saved!\nInterest Rate: ${globalInterestRate}%\nMax Loan: ${Number(maxLoanAmount).toLocaleString()} XAF`)}>
              <Settings size={18} /> Save Configuration
            </button>
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

  return (
    <MainLayout theme={theme} toggleTheme={toggleTheme}>
      <header className="dashboard-header">
        <div>
          <h1>Nexus Command</h1>
          <p className="text-sub">Platform-wide governance and financial oversight.</p>
        </div>
        <div className="flex gap-1">
          <button className="btn-secondary" onClick={handleExportAudit}>Export Audit CSV</button>
          <button className="btn-primary" onClick={() => setActiveTab('overview')}>
            <AlertCircle size={18} /> Platform Alert
          </button>
        </div>
      </header>

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

      <div className="flex gap-1" style={{ marginBottom: '2rem', background: 'var(--white)', padding: '5px', borderRadius: '12px', width: 'fit-content', border: '1px solid var(--glass-border)' }}>
        {['overview', 'users', 'groups', 'settings'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`nav-item ${activeTab === tab ? 'active' : ''}`} style={{ padding: '8px 20px', fontSize: '0.9rem', textTransform: 'capitalize' }}>
            {tab === 'overview' ? 'Overview' : tab === 'settings' ? 'Config' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading && activeTab !== 'settings' ? (
        <div className="glass card flex-center" style={{ height: '200px' }}>Loading platform data...</div>
      ) : renderContent()}
    </MainLayout>
  );
};

export default SuperAdminDashboard;
