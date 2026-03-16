import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  ArrowUpRight, 
  BrainCircuit, 
  ShieldCheck, 
  Info,
  Clock,
  LayoutDashboard,
  Wallet,
  Users,
  Target,
  CreditCard,
  Sun,
  Moon
} from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import MainLayout from './MainLayout';
import { collection, query, onSnapshot, orderBy, limit, addDoc, serverTimestamp, doc, updateDoc, increment, where, getDocs } from 'firebase/firestore';
import './Dashboard.css';

const Marketplace = ({ theme, toggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLinkActive = (path) => location.pathname === path;

  const [loanRequests, setLoanRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [newLoan, setNewLoan] = useState({
    amount: '',
    duration: '3 Months',
    purpose: '',
    interest: '5%'
  });
  const { currentUser, getUserDisplayName } = useAuth();
  const [userBalance, setUserBalance] = useState(0);
  const [userDocId, setUserDocId] = useState(null);
  const [userRiskScore, setUserRiskScore] = useState(0.85);

  useEffect(() => {
    if (!currentUser) return;

    // 1. Listen for user balance (needed for funding check)
    const userQuery = query(collection(db, "users"), where("uid", "==", currentUser.uid));
    const unsubscribeUser = onSnapshot(userQuery, (snapshot) => {
      if (!snapshot.empty) {
        setUserBalance(snapshot.docs[0].data().balance || 0);
        setUserDocId(snapshot.docs[0].id);
      }
    });

    // 1.5 Fetch user risk score from members record
    const riskQuery = query(collection(db, "members"), where("user_id", "==", currentUser.uid), limit(1));
    const unsubscribeRisk = onSnapshot(riskQuery, (snapshot) => {
      if (!snapshot.empty) {
        setUserRiskScore(snapshot.docs[0].data().aiRiskScore || 0.85);
      }
    });

    // 2. Listen for loan requests
    const q = query(collection(db, "loan_requests"), orderBy("timestamp", "desc"), limit(10));
    const unsubscribeLoans = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setLoanRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else {
        setLoanRequests([
          { id: 'lr-1', user: 'Samuel K.', amount: 250000, interest: '5%', duration: '3 Months', risk: 'Low', aiScore: 0.95 },
          { id: 'lr-2', user: 'Fiona B.', amount: 1000000, interest: '8%', duration: '12 Months', risk: 'Medium', aiScore: 0.72 },
        ]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeUser();
      unsubscribeRisk();
      unsubscribeLoans();
    };
  }, [currentUser]);

  const handlePostLoan = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    
    try {
      await addDoc(collection(db, "loan_requests"), {
        user_id: currentUser.uid,
        user: getUserDisplayName(),
        amount: parseFloat(newLoan.amount),
        duration: newLoan.duration,
        interest: newLoan.interest,
        purpose: newLoan.purpose,
        aiScore: userRiskScore, 
        timestamp: serverTimestamp(),
        status: 'open'
      });
      
      setShowLoanModal(false);
      setNewLoan({ amount: '', duration: '3 Months', purpose: '', interest: '5%' });
      alert("Loan request posted to marketplace!");
    } catch (error) {
      console.error("Post loan error:", error);
      alert("Failed to post loan request.");
    }
  };

  const handleFundLoan = async (loan) => {
    if (!currentUser || !userDocId) return;
    
    if (loan.user_id === currentUser.uid) {
      alert("You cannot fund your own loan request.");
      return;
    }

    if (userBalance < loan.amount) {
      alert("Insufficient balance to fund this loan.");
      return;
    }

    const confirm = window.confirm(`Are you sure you want to fund ${loan.user}'s request for ${loan.amount.toLocaleString()} XAF?`);
    if (!confirm) return;

    try {
      // 1. Deduct from funder
      await updateDoc(doc(db, "users", userDocId), {
        balance: increment(-loan.amount)
      });

      // 2. Log transaction for funder
      await addDoc(collection(db, "transactions"), {
        user_id: currentUser.uid,
        amount: loan.amount,
        type: "loan_funding",
        title: `Funded Loan for ${loan.user}`,
        timestamp: serverTimestamp(),
        status: "completed"
      });

      // 3. Close the request (or update status)
      await updateDoc(doc(db, "loan_requests", loan.id), {
        status: 'funded',
        fundedBy: currentUser.uid
      });

      alert("Transaction Successful! You have funded this loan.");
    } catch (error) {
      console.error("Funding error:", error);
      alert("Failed to fund loan. Please try again.");
    }
  };

  return (
    <div className="sidebar-layout">
      <aside className="sidebar">
        <div className="sidebar-logo logo">🌱 NjangiPay</div>
        <nav className="sidebar-nav">
          <Link to="/dashboard" className={`nav-item ${isLinkActive('/dashboard') ? 'active' : ''}`}>
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link to="/wallet" className={`nav-item ${isLinkActive('/wallet') ? 'active' : ''}`}>
            <Wallet size={20} /> My Wallet
          </Link>
          <Link to="/groups" className={`nav-item ${isLinkActive('/groups') ? 'active' : ''}`}>
            <Users size={20} /> Savings Groups
          </Link>
          <Link to="/marketplace" className={`nav-item ${isLinkActive('/marketplace') ? 'active' : ''}`}>
            <Target size={20} /> Marketplace
          </Link>
          <Link to="/admin/communities" className={`nav-item ${isLinkActive('/admin/communities') ? 'active' : ''}`}>
            <CreditCard size={20} /> Loans & Risk
          </Link>
        </nav>

        <div className="sidebar-footer" style={{ padding: '20px', borderTop: '1px solid var(--glass-border)' }}>
          <button onClick={toggleTheme} className="theme-toggle-btn" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', fontWeight: '600' }}>
            {theme === 'light' ? <><Moon size={20} /> Dark Mode</> : <><Sun size={20} /> Light Mode</>}
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>Loan Marketplace</h1>
            <p className="text-sub">Fund community requests and earn competitive returns.</p>
          </div>
          <div className="flex gap-1">
             <button className="btn-secondary" onClick={() => navigate('/wallet')}>My Portfolio</button>
             <button className="btn-primary" onClick={() => setShowLoanModal(true)}>Post Loan Request</button>
          </div>
        </header>

        {showLoanModal && (
          <div className="modal-overlay">
            <div className="glass modal-content">
              <h2>Post Loan Request</h2>
              <form onSubmit={handlePostLoan} style={{ marginTop: '20px' }}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px' }}>Amount (XAF)</label>
                  <input 
                    type="number" 
                    value={newLoan.amount} 
                    onChange={(e) => setNewLoan({...newLoan, amount: e.target.value})}
                    required 
                    placeholder="500,000"
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px' }}>Purpose of Loan</label>
                  <input 
                    type="text" 
                    value={newLoan.purpose} 
                    onChange={(e) => setNewLoan({...newLoan, purpose: e.target.value})}
                    required 
                    placeholder="e.g. Agricultural Equipment"
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px' }}>Duration</label>
                    <select 
                      value={newLoan.duration}
                      onChange={(e) => setNewLoan({...newLoan, duration: e.target.value})}
                      style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}
                    >
                      <option>1 Month</option>
                      <option>3 Months</option>
                      <option>6 Months</option>
                      <option>12 Months</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px' }}>Interest Rate</label>
                    <select 
                      value={newLoan.interest}
                      onChange={(e) => setNewLoan({...newLoan, interest: e.target.value})}
                      style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}
                    >
                      <option>3%</option>
                      <option>5%</option>
                      <option>8%</option>
                      <option>10%</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-1" style={{ marginTop: '30px' }}>
                  <button type="button" onClick={() => setShowLoanModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>Post to Market</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="activity-grid" style={{ gridTemplateColumns: '1.8fr 1fr' }}>
          <div>
            <div className="search-filter-bar">
              <div className="search-input-wrapper">
                <Search className="search-icon" size={18} />
                <input 
                  type="text" 
                  id="loan-search"
                  name="search"
                  placeholder="Search loan requests..." 
                  aria-label="Search loan requests"
                />
              </div>
              <button className="btn-secondary"><Filter size={18} /> Filters</button>
            </div>

            <div className="flex" style={{ flexDirection: 'column', gap: '1.5rem' }}>
              {loading ? (
                <div className="flex-center" style={{ height: '200px' }}>Analyzing Trust Ledger...</div>
              ) : (
                loanRequests.map((req) => (
                  <div key={req.id} className="glass card">
                     <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                        <div className="flex gap-1" style={{ alignItems: 'center' }}>
                           <div className="flex-center" style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--primary-green)', color: '#fff', fontWeight: '800' }}>
                              {req.user ? req.user.split(' ')[0][0] : 'U'}
                           </div>
                           <div>
                              <h3 style={{ margin: 0 }}>{req.user || 'Anonymous'}</h3>
                              <p className="text-muted" style={{ fontSize: '0.85rem' }}>Request ID: {req.id.substring(0,8).toUpperCase()} • Community Verified</p>
                           </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                           <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>AI Risk Score</p>
                           <div className="flex gap-1" style={{ alignItems: 'center', fontWeight: '700', color: (req.aiScore || 0) > 0.8 ? 'var(--primary-green)' : '#f39c12' }}>
                              <BrainCircuit size={16} /> {(req.aiScore * 100).toFixed(0)}% Confidence
                           </div>
                        </div>
                     </div>

                     <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', padding: '1.5rem', background: 'var(--accent-light)', borderRadius: '12px' }}>
                        <div>
                           <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Amount</p>
                           <p style={{ fontWeight: '800', fontSize: '1.1rem' }}>{req.amount?.toLocaleString() || req.amount} XAF</p>
                        </div>
                        <div>
                           <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Duration</p>
                           <p style={{ fontWeight: '800', fontSize: '1.1rem' }}>{req.duration}</p>
                        </div>
                        <div>
                           <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Interest</p>
                           <p style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--primary-green)' }}>{req.interest}</p>
                        </div>
                        <div>
                           <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Security</p>
                           <p style={{ fontWeight: '800', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <ShieldCheck size={16} color="var(--primary-green)" /> {req.security || 'Collateral'}
                           </p>
                        </div>
                     </div>

                     <div className="flex gap-1" style={{ marginTop: '1.5rem' }}>
                        <button 
                          className="btn-primary" 
                          style={{ flex: 2 }} 
                          onClick={() => handleFundLoan(req)}
                          disabled={req.status === 'funded'}
                        >
                           {req.status === 'funded' ? 'Funded' : 'Fund Loan'} <ArrowUpRight size={18} />
                        </button>
                        <button className="btn-secondary" style={{ flex: 1 }}>Details</button>
                     </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex" style={{ flexDirection: 'column', gap: '2rem' }}>
            <div className="glass card" style={{ border: '1px solid var(--primary-green)' }}>
              <h3 className="flex gap-1" style={{ marginBottom: '1rem', alignItems: 'center' }}>
                <BrainCircuit color="var(--primary-green)" /> Smart Lending
              </h3>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                NjangiPay AI evaluates borrower history across all sub-communities to provide a comprehensive <span style={{ color: 'var(--primary-green)', fontWeight: '700' }}>aiRiskScore</span>.
              </p>
              <div className="flex gap-1" style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--accent-light)', borderRadius: '12px' }}>
                 <Info size={20} color="var(--primary-dark)" />
                 <p style={{ fontSize: '0.85rem', margin: 0, fontWeight: '500' }}>High-confidence loans (AI Score {'>'} 0.9) increase your trust multiplier.</p>
              </div>
            </div>

            <div className="glass card">
              <h3 style={{ marginBottom: '1.5rem' }}>Your Portfolio</h3>
              <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
                 <div className="flex-between">
                    <span className="text-muted" style={{ fontSize: '0.9rem' }}>Active Loans Offered</span>
                    <span style={{ fontWeight: '700' }}>4 Items</span>
                 </div>
                 <div className="flex-between">
                    <span className="text-muted" style={{ fontSize: '0.9rem' }}>Projected Returns</span>
                    <span style={{ fontWeight: '700', color: 'var(--primary-green)' }}>+12,400 XAF</span>
                 </div>
                 <div className="flex-between">
                    <span className="text-muted" style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                       Next Payout <Clock size={14} />
                    </span>
                    <span style={{ fontWeight: '700' }}>24 Oct</span>
                 </div>
              </div>
              <button className="btn-secondary" style={{ width: '100%', marginTop: '2rem', padding: '0.8rem' }}>Manage Portfolio</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Marketplace;
