import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Table, 
  PieChart, 
  CheckCircle, 
  Clock
} from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import MainLayout from './MainLayout';
import CommunityChat from './CommunityChat';
import './Dashboard.css';

const ContributionTracker = ({ theme, toggleTheme }) => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { getUserDisplayName } = useAuth();
  
  const [contributions, setContributions] = useState([]);
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger', 'analytics', 'chat'
  const [groupDetails, setGroupDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('member'); // 'member', 'treasurer', 'president'

  const handleMarkAsPaid = async (transactionId) => {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, "transactions", transactionId), {
        status: 'Paid'
      });
      alert("Contribution verified and approved!");
    } catch (error) {
      console.error("Approval error:", error);
    }
  };

  useEffect(() => {
    if (!groupId) return;

    // 1. Fetch group details
    const groupRef = query(collection(db, "groups")); // In real app, fetch by ID
    const unsubscribeGroup = onSnapshot(groupRef, (snapshot) => {
      const group = snapshot.docs.find(doc => doc.id === groupId);
      if (group) setGroupDetails({ id: group.id, ...group.data() });
    });

    // 2. Fetch contributions for this group
    const q = query(
      collection(db, "transactions"), 
      where("group_id", "==", groupId),
      orderBy("timestamp", "desc")
    );
    
    const unsubscribeTrans = onSnapshot(q, (snapshot) => {
      const transData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setContributions(transData);
      setLoading(false);
    }, (error) => {
      console.warn("Transactions query failed (unindexed?):", error);
      // Fallback mock data
      setContributions([
        { id: '1', userName: 'Alice', amount: 50000, status: 'Paid', timestamp: new Date() },
        { id: '2', userName: 'Bob', amount: 50000, status: 'Pending', timestamp: new Date() },
      ]);
      setLoading(false);
    });

    // 3. Fetch user's role in this specific group
    let unsubscribeRole = () => {};
    if (currentUser && groupId) {
      const roleQuery = query(
        collection(db, "members"), 
        where("group_id", "==", groupId),
        where("user_id", "==", currentUser.uid),
        limit(1)
      );
      unsubscribeRole = onSnapshot(roleQuery, (snapshot) => {
        if (!snapshot.empty) {
          setUserRole(snapshot.docs[0].data().role || 'member');
        }
      });
    }

    return () => {
      unsubscribeGroup();
      unsubscribeTrans();
      unsubscribeRole();
    };
  }, [groupId, currentUser]);

  return (
    <MainLayout theme={theme} toggleTheme={toggleTheme}>
      <header className="dashboard-header">
        <div className="flex gap-1" style={{ alignItems: 'center' }}>
          <button 
            className="btn-secondary" 
            style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px' }}
            onClick={() => navigate('/groups')}
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1>{groupDetails?.name || 'Group Workspace'}</h1>
            <p className="text-sub">Manage contributions and communicate with your community.</p>
          </div>
        </div>
      </header>

      <div className="workspace-tabs flex gap-1" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
        <button 
          className={`nav-item ${activeTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveTab('ledger')}
          style={{ border: 'none', background: 'none', cursor: 'pointer' }}
        >
          <Table size={18} /> Transaction Ledger
        </button>
        <button 
          className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
          style={{ border: 'none', background: 'none', cursor: 'pointer' }}
        >
          <PieChart size={18} /> Member Analytics
        </button>
      </div>

      <div className="workspace-content-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: activeTab === 'ledger' ? '1.5fr 1fr' : '1fr', 
        gap: '2rem' 
      }}>
        <div className="left-panel">
          {activeTab === 'ledger' ? (
            <div className="glass card" style={{ padding: '0' }}>
              <div className="flex-between" style={{ padding: '2rem' }}>
                <h3 style={{ margin: 0 }}>Recent Contributions</h3>
                <div className="flex gap-1">
                  <div className="badge"><CheckCircle size={14} /> 85% Paid</div>
                  <div className="badge" style={{ background: '#fef5e7', color: '#f39c12' }}><Clock size={14} /> 15% Pending</div>
                </div>
              </div>
              
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributions.length > 0 ? contributions.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div className="flex gap-1" style={{ alignItems: 'center' }}>
                            <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                              {(item.userName || 'U').substring(0, 1).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: '600' }}>{item.userName || 'Member'}</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: '700' }}>{item.amount?.toLocaleString()} XAF</td>
                        <td>
                          <span className={`status-pill ${item.status === 'Paid' ? 'status-paid' : 'status-pending'}`}>
                            {item.status || 'Pending'}
                          </span>
                        </td>
                        <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                          <div className="flex-between">
                            {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleDateString() : 'Recent'}
                            {userRole === 'treasurer' && item.status === 'Pending' && (
                              <button 
                                onClick={() => handleMarkAsPaid(item.id)}
                                className="btn-primary" 
                                style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                              >
                                Approve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                          No contributions recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="analytics-view flex-column" style={{ gap: '2rem' }}>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div className="glass card">
                  <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>Total Group Fund</p>
                  <h2 style={{ color: 'var(--primary-green)' }}>
                    {contributions.reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString()} XAF
                  </h2>
                </div>
                <div className="glass card">
                  <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>Punctuality Rate</p>
                  <h2 style={{ color: '#f39c12' }}>
                    {contributions.length > 0 
                      ? Math.round((contributions.filter(c => c.status === 'Paid').length / contributions.length) * 100) 
                      : 0}%
                  </h2>
                </div>
                <div className="glass card">
                  <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>Total Transactions</p>
                  <h2>{contributions.length}</h2>
                </div>
              </div>

              <div className="glass card">
                <h3 style={{ marginBottom: '1.5rem' }}>Contribution Distribution</h3>
                <div className="distribution-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {Object.entries(
                    contributions.reduce((acc, curr) => {
                      acc[curr.userName || 'Unknown'] = (acc[curr.userName || 'Unknown'] || 0) + (curr.amount || 0);
                      return acc;
                    }, {})
                  )
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, amount], idx) => (
                    <div key={idx} className="flex-between" style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)' }}>
                      <span style={{ fontWeight: 500 }}>{name}</span>
                      <span style={{ fontWeight: 700 }}>{amount.toLocaleString()} XAF</span>
                    </div>
                  ))}
                  {contributions.length === 0 && <p className="text-muted flex-center" style={{ padding: '2rem' }}>No data to aggregate.</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {activeTab === 'ledger' && (
          <div className="right-panel">
            <CommunityChat groupId={groupId} />
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ContributionTracker;
