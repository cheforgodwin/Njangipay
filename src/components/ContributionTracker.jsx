import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Table, 
  PieChart, 
  CheckCircle, 
  Clock
} from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
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

    return () => {
      unsubscribeGroup();
      unsubscribeTrans();
    };
  }, [groupId]);

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
                          {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleDateString() : 'Recent'}
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
            <div className="glass card flex-center" style={{ height: '400px' }}>
              <div style={{ textAlign: 'center' }}>
                <PieChart size={48} color="var(--primary-green)" style={{ marginBottom: '1rem' }} />
                <h3>Analytics Coming Soon</h3>
                <p className="text-muted">We're building advanced insights for your group.</p>
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
