import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  TrendingUp, 
  PieChart, 
  BarChart4, 
  LayoutDashboard, 
  Wallet, 
  Users, 
  Target, 
  CreditCard, 
  Sun, 
  Moon,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  BrainCircuit,
  Activity
} from 'lucide-react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const InvestorAnalytics = ({ theme, toggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const isLinkActive = (path) => location.pathname === path;

  const [portfolioStats, setPortfolioStats] = useState([
    { label: 'Total Invested Capital', value: '0 XAF', icon: <Wallet />, color: 'var(--primary-green)' },
    { label: 'Projected Annual ROI', value: '0%', icon: <TrendingUp />, color: '#3498db' },
    { label: 'Active Funding Positions', value: '0', icon: <Target />, color: '#9b59b6' },
    { label: 'Trust Multiplier', value: '1.0x', icon: <BrainCircuit />, color: '#f1c40f' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // Listen for user's investments/payouts in transactions
    const q = query(
      collection(db, "transactions"), 
      where("user_id", "==", currentUser.uid),
      where("type", "in", ["payout", "loan_fund"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalInvested = 0;
      let activePositions = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.type === 'loan_fund') {
          totalInvested += data.amount || 0;
          activePositions++;
        }
      });

      setPortfolioStats([
        { label: 'Total Invested Capital', value: `${totalInvested.toLocaleString()} XAF`, icon: <Wallet />, color: 'var(--primary-green)' },
        { label: 'Projected Annual ROI', value: '8.4%', icon: <TrendingUp />, color: '#3498db' },
        { label: 'Active Funding Positions', value: `${activePositions}`, icon: <Target />, color: '#9b59b6' },
        { label: 'Trust Multiplier', value: '1.4x', icon: <BrainCircuit />, color: '#f1c40f' },
      ]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <div className="sidebar-layout">
      <aside className="sidebar">
        <div className="sidebar-logo logo">🌱 NjangiPay</div>
        <div className="badge" style={{ margin: '0 20px 20px', background: '#34495e', color: 'white' }}>Capital Partner</div>
        <nav className="sidebar-nav">
          <Link to="/investor" className={`nav-item ${isLinkActive('/investor') ? 'active' : ''}`}>
            <LayoutDashboard size={20} /> Portfolio Overview
          </Link>
          <Link to="/marketplace" className={`nav-item ${isLinkActive('/marketplace') ? 'active' : ''}`}>
            <Target size={20} /> Opportunity Hub
          </Link>
          <Link to="/dashboard" className={`nav-item ${isLinkActive('/dashboard') ? 'active' : ''}`}>
            <Activity size={20} /> Performance Logs
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
            <h1>Investor Intelligence</h1>
            <p className="text-sub">Advanced analytics for your platform-wide capital allocation.</p>
          </div>
          <button className="btn-primary" onClick={() => {
            const lowRisk = prompt("Low Risk allocation % (current: 65%):", "65");
            const midRisk = prompt("Medium Risk allocation % (current: 25%):", "25");
            if (lowRisk && midRisk) {
              alert(`Capital reallocated!\nLow Risk: ${lowRisk}%\nMedium Risk: ${midRisk}%\nHigh Yield: ${100 - parseInt(lowRisk) - parseInt(midRisk)}%`);
            }
          }}>
          Refactor Allocation
        </button>
        </header>

        <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '2rem' }}>
          {portfolioStats.map((stat, i) => (
            <div key={i} className="glass card">
              <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color, marginBottom: '1.5rem' }}>
                {stat.icon}
              </div>
              <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>{stat.label}</p>
              <h2 style={{ fontSize: '1.8rem', margin: 0 }}>{stat.value}</h2>
            </div>
          ))}
        </div>

        <div className="activity-grid" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
          <div className="glass card">
             <div className="flex-between" style={{ marginBottom: '2rem' }}>
                <h3 style={{ margin: 0 }}>Capital Allocation by Risk</h3>
                <span className="text-muted" style={{ fontSize: '0.9rem' }}>Updated 1h ago</span>
             </div>
             
             <div className="flex" style={{ flexDirection: 'column', gap: '1.5rem' }}>
                {[
                  { label: 'Low Risk (Score > 0.8)', allocation: 65, color: 'var(--primary-green)' },
                  { label: 'Medium Risk (Score 0.4-0.8)', allocation: 25, color: '#f1c40f' },
                  { label: 'High Yield (Score < 0.4)', allocation: 10, color: '#e74c3c' },
                ].map((risk, i) => (
                  <div key={i}>
                    <div className="flex-between" style={{ marginBottom: '8px', fontSize: '0.9rem' }}>
                      <span style={{ fontWeight: '600' }}>{risk.label}</span>
                      <span style={{ fontWeight: '800' }}>{risk.allocation}%</span>
                    </div>
                    <div className="progress-bar-bg" style={{ height: '8px' }}>
                      <div className="progress-bar-fill" style={{ width: `${risk.allocation}%`, background: risk.color, height: '100%' }}></div>
                    </div>
                  </div>
                ))}
             </div>

             <div className="flex-between" style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>Cluster Performance</h3>
             </div>
             <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div style={{ padding: '15px', background: 'var(--off-white)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                   <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '5px' }}>Top Branch</p>
                   <p style={{ fontWeight: '700', margin: 0 }}>Yaoundé - Central</p>
                   <p style={{ color: 'var(--primary-green)', fontSize: '0.8rem' }}>+12.4% MoM</p>
                </div>
                <div style={{ padding: '15px', background: 'var(--off-white)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                   <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '5px' }}>Emerging Hub</p>
                   <p style={{ fontWeight: '700', margin: 0 }}>Douala North</p>
                   <p style={{ color: 'var(--primary-green)', fontSize: '0.8rem' }}>+8.2% MoM</p>
                </div>
             </div>
          </div>

          <div className="glass card" style={{ padding: '0', overflow: 'hidden' }}>
             <div style={{ padding: '25px', borderBottom: '1px solid var(--glass-border)' }}>
                <h3 style={{ margin: 0 }}>Monthly Performance</h3>
             </div>
             <div>
                {loading ? (
                   <div className="flex-center" style={{ height: '200px' }}>Analyzing yield curves...</div>
                ) : (
                  [
                    { month: 'September', returns: '+1.2M', growth: 'up' },
                    { month: 'August', returns: '+980K', growth: 'up' },
                    { month: 'July', returns: '+1.1M', growth: 'down' },
                    { month: 'June', returns: '+850K', growth: 'up' },
                    { month: 'May', returns: '+720K', growth: 'up' },
                  ].map((row, i) => (
                    <div key={i} className="flex-between" style={{ padding: '20px 25px', borderBottom: '1px solid var(--glass-border)' }}>
                       <span style={{ fontWeight: '600' }}>{row.month}</span>
                       <div className="flex gap-1" style={{ alignItems: 'center' }}>
                          <span style={{ fontWeight: '800', color: row.growth === 'up' ? 'var(--primary-green)' : '#e74c3c' }}>{row.returns}</span>
                          {row.growth === 'up' ? <ArrowUpRight size={14} color="#27ae60" /> : <ArrowDownRight size={14} color="#e74c3c" />}
                       </div>
                    </div>
                  ))
                )}
             </div>
             <button className="btn-secondary" style={{ width: 'calc(100% - 50px)', margin: '20px 25px' }}>Detailed Yield Report</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InvestorAnalytics;
