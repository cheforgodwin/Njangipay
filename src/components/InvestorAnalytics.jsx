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
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import MainLayout from './MainLayout';
import './Dashboard.css';
import './InvestorAnalytics.css';

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
    <MainLayout theme={theme} toggleTheme={toggleTheme}>
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

        <div className="grid grid-4 investor-stats-grid">
          {portfolioStats.map((stat, i) => (
            <div key={i} className="glass card">
              <div className="stat-icon investor-stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
                {stat.icon}
              </div>
              <p className="text-muted investor-stat-label">{stat.label}</p>
              <h2 className="investor-stat-value">{stat.value}</h2>
            </div>
          ))}
        </div>

        <div className="activity-grid">
          <div className="glass card">
             <div className="flex-between investor-section-header">
                <h3 className="investor-section-title">Capital Allocation by Risk</h3>
                <span className="text-muted investor-section-time">Updated 1h ago</span>
             </div>
             
             <div className="flex investor-allocation-list">
                {[
                  { label: 'Low Risk (Score > 0.8)', allocation: 65, color: 'var(--primary-green)' },
                  { label: 'Medium Risk (Score 0.4-0.8)', allocation: 25, color: '#f1c40f' },
                  { label: 'High Yield (Score < 0.4)', allocation: 10, color: '#e74c3c' },
                ].map((risk, i) => (
                  <div key={i}>
                    <div className="flex-between investor-allocation-row">
                      <span className="investor-allocation-label">{risk.label}</span>
                      <span className="investor-allocation-pct">{risk.allocation}%</span>
                    </div>
                    <div className="progress-bar-bg investor-progress-bg">
                      <div className="progress-bar-fill investor-progress-fill" style={{ width: `${risk.allocation}%`, background: risk.color }}></div>
                    </div>
                  </div>
                ))}
             </div>

             <div className="flex-between investor-cluster-header">
                <h3 className="investor-section-title">Cluster Performance</h3>
             </div>
             <div className="grid grid-2 investor-cluster-grid">
                <div className="investor-cluster-card">
                   <p className="text-muted investor-cluster-label">Top Branch</p>
                   <p className="investor-cluster-name">Yaoundé - Central</p>
                   <p className="investor-cluster-growth">+12.4% MoM</p>
                </div>
                <div className="investor-cluster-card">
                   <p className="text-muted investor-cluster-label">Emerging Hub</p>
                   <p className="investor-cluster-name">Douala North</p>
                   <p className="investor-cluster-growth">+8.2% MoM</p>
                </div>
             </div>
          </div>

          <div className="glass card investor-yield-card">
             <div className="investor-yield-header">
                <h3 className="investor-section-title">Monthly Performance</h3>
             </div>
             <div>
                {loading ? (
                   <div className="flex-center investor-loading">Analyzing yield curves...</div>
                ) : (
                  [
                    { month: 'September', returns: '+1.2M', growth: 'up' },
                    { month: 'August', returns: '+980K', growth: 'up' },
                    { month: 'July', returns: '+1.1M', growth: 'down' },
                    { month: 'June', returns: '+850K', growth: 'up' },
                    { month: 'May', returns: '+720K', growth: 'up' },
                  ].map((row, i) => (
                    <div key={i} className="flex-between investor-yield-row">
                       <span className="investor-yield-month">{row.month}</span>
                       <div className="flex gap-1 investor-yield-data">
                          <span className="investor-yield-val" style={{ color: row.growth === 'up' ? 'var(--primary-green)' : '#e74c3c' }}>{row.returns}</span>
                          {row.growth === 'up' ? <ArrowUpRight size={14} color="#27ae60" /> : <ArrowDownRight size={14} color="#e74c3c" />}
                       </div>
                    </div>
                  ))
                )}
             </div>
             <button className="btn-secondary investor-yield-btn">Detailed Yield Report</button>
          </div>
        </div>
    </MainLayout>
  );
};

export default InvestorAnalytics;
