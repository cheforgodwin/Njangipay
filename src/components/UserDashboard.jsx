import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Users, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Search,
  Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import MainLayout from './MainLayout';
import './Dashboard.css';

const UserDashboard = ({ theme, toggleTheme }) => {
  const { currentUser, getUserDisplayName } = useAuth();
  const navigate = useNavigate();

  const [walletBalance, setWalletBalance] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [aiScore, setAiScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // 1. Listen for user profile/wallet updates
    const userRef = query(collection(db, "users"), where("uid", "==", currentUser.uid));
    const unsubscribeUser = onSnapshot(userRef, (snapshot) => {
      if (!snapshot.empty) {
        setWalletBalance(snapshot.docs[0].data().balance || 0);
      } else {
        setWalletBalance(500000); // Demo fallback
      }
    });

    // 2. Listen for member/relationship updates (AI Score)
    const memberRef = query(collection(db, "members"), where("user_id", "==", currentUser.uid), limit(1));
    const unsubscribeMember = onSnapshot(memberRef, (snapshot) => {
      if (!snapshot.empty) {
        setAiScore(snapshot.docs[0].data().aiRiskScore || 0.98);
      } else {
        setAiScore(0.98); // Demo fallback
      }
    });

    // 3. Listen for recent transactions
    const transRef = query(
      collection(db, "transactions"), 
      where("user_id", "==", currentUser.uid), 
      orderBy("timestamp", "desc"), 
      limit(5)
    );
    const unsubscribeTrans = onSnapshot(transRef, (snapshot) => {
      const trans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentActivity(trans);
      setLoading(false);
    }, (error) => {
      console.warn("Transactions listen failed (unindexed?):", error);
      setRecentActivity([
        { id: '1', type: 'saving', amount: 50000, timestamp: new Date(), title: 'Saving Contribution' },
        { id: '2', type: 'loan', amount: 5000, timestamp: new Date(), title: 'Loan Interest Payment' }
      ]);
      setLoading(false);
    });

    return () => {
      unsubscribeUser();
      unsubscribeMember();
      unsubscribeTrans();
    };
  }, [currentUser]);

  return (
    <MainLayout theme={theme} toggleTheme={toggleTheme}>
      <header className="dashboard-header">
        <div>
          <h1>Welcome back, {getUserDisplayName()}!</h1>
          <p className="text-sub">Here's what's happening with your savings today.</p>
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="glass card wallet-card-primary">
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <Wallet />
            <Plus style={{ cursor: 'pointer' }} onClick={() => navigate('/wallet')} />
          </div>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Total Saved Balance</p>
          <h2 className="hero-title" style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>
            {walletBalance.toLocaleString()} XAF
          </h2>
          <div className="flex gap-2" style={{ marginTop: '1.5rem', fontSize: '0.85rem' }}>
            <span>Real-time Sync Active</span>
          </div>
        </div>

        <div className="glass card">
          <h3 style={{ marginBottom: '1.5rem' }}>Active Njangi</h3>
          <div className="flex gap-1" style={{ alignItems: 'center' }}>
             <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users color="var(--primary-green)" />
             </div>
             <div>
               <p style={{ fontWeight: '700' }}>Global Hub Unit A</p>
               <p className="text-muted" style={{ fontSize: '0.85rem' }}>Next payout: 28 Oct</p>
             </div>
          </div>
          <div className="progress-track">
            <div className="progress-info">
               <span>Progress</span>
               <span style={{ fontWeight: '700' }}>75%</span>
            </div>
            <div className="progress-bar">
               <div className="progress-fill" style={{ width: '75%' }}></div>
            </div>
          </div>
        </div>

        <div className="glass card" style={{ border: aiScore > 0.8 ? '1px solid var(--primary-green)' : '1px solid #f1c40f', display: 'flex', flexDirection: 'column' }}>
           <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <Target size={18} color={aiScore > 0.8 ? "var(--primary-green)" : "#f39c12"} /> AI Credit Insight
           </h3>
           <p style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
             Your trust score is at <span style={{ color: aiScore > 0.8 ? 'var(--primary-green)' : '#f39c12', fontWeight: '700' }}>{(aiScore * 100).toFixed(0)}%</span>. 
             {aiScore > 0.8 ? " You are eligible for an immediate loan expansion." : " Maintain regular contributions to increase your score."}
           </p>
           <button className="btn-primary" style={{ width: '100%', marginTop: 'auto' }} onClick={() => navigate('/marketplace')}>
             {aiScore > 0.8 ? "Apply for Loan" : "Improve Score"}
           </button>
        </div>
      </div>

      <div className="activity-grid">
         <div className="glass card" style={{ padding: '0' }}>
            <div className="flex-between" style={{ padding: '2rem 2rem 1.5rem' }}>
               <h3 style={{ margin: 0 }}>Recent Activity</h3>
               <span className="badge" style={{ cursor: 'pointer' }} onClick={() => navigate('/wallet')}>View All</span>
            </div>
            <div style={{ padding: '0 2rem 2rem' }}>
               {recentActivity.length > 0 ? recentActivity.map((act, i) => (
                  <div key={act.id} className="flex-between" style={{ padding: '1rem 0', borderBottom: i < recentActivity.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                     <div className="flex gap-1" style={{ alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: act.type === 'loan' ? '#fdedec' : '#e8f8f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           {act.type === 'loan' ? <ArrowUpRight color="#e74c3c" size={18} /> : <ArrowDownLeft color="#27ae60" size={18} />}
                        </div>
                        <div>
                           <p style={{ fontWeight: '600' }}>{act.title || (act.type === 'loan' ? 'Loan Repayment' : 'Contribution')}</p>
                           <p className="text-muted" style={{ fontSize: '0.75rem' }}>{act.timestamp?.toDate ? act.timestamp.toDate().toLocaleDateString() : 'Recent'}</p>
                        </div>
                     </div>
                     <p style={{ fontWeight: '700', color: act.type === 'loan' ? '#e74c3c' : '#27ae60' }}>
                       {act.type === 'loan' ? '-' : '+'} {act.amount?.toLocaleString()} XAF
                     </p>
                  </div>
               )) : (
                 <div className="text-muted" style={{ textAlign: 'center', padding: '20px' }}>No recent activity found.</div>
               )}
            </div>
         </div>

         <div className="glass card">
            <h3 style={{ marginBottom: '1.5rem' }}>Quick Actions</h3>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
               <div className="flex-center" style={{ flexDirection: 'column', padding: '1.5rem', borderRadius: '15px', background: '#f0fbf4', cursor: 'pointer' }} onClick={() => navigate('/wallet')}>
                  <Plus color="var(--primary-green)" style={{ marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>Deposit</p>
               </div>
               <div className="flex-center" style={{ flexDirection: 'column', padding: '1.5rem', borderRadius: '15px', background: '#f5f5f5', cursor: 'pointer' }} onClick={() => navigate('/wallet')}>
                  <ArrowUpRight color="#666" style={{ marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>Transfer</p>
               </div>
               <div className="flex-center" style={{ flexDirection: 'column', padding: '1.5rem', borderRadius: '15px', background: '#f5f5f5', cursor: 'pointer' }} onClick={() => navigate('/groups')}>
                  <Users color="#666" style={{ marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>Join Unit</p>
               </div>
               <div className="flex-center" style={{ flexDirection: 'column', padding: '1.5rem', borderRadius: '15px', background: '#f5f5f5', cursor: 'pointer' }} onClick={() => navigate('/marketplace')}>
                  <Search color="#666" style={{ marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>Marketplace</p>
               </div>
            </div>
         </div>
      </div>
    </MainLayout>
  );
};

export default UserDashboard;
