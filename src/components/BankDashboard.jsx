import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  Activity, 
  ShieldCheck, 
  ExternalLink,
  Search,
  CheckCircle,
  FileText,
  BarChart3
} from 'lucide-react';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import MainLayout from './MainLayout';
import './Dashboard.css';

const BankDashboard = ({ theme, toggleTheme }) => {
  const { currentUser } = useAuth();
  const [bankData, setBankData] = useState({
    name: 'Ecobank Cameroon',
    totalLiquidity: 452500000,
    dailyVolume: 12450000,
    activeIntegrations: 85,
    status: 'Operational'
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Aggregated bank-level view (mocking for the specific partner)
    const q = query(collection(db, "transactions"), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(transList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const stats = [
    { label: 'Settlement Pool', value: `${bankData.totalLiquidity.toLocaleString()} XAF`, icon: <Wallet size={24} />, color: 'var(--primary-green)' },
    { label: 'Daily Clearing Volume', value: `${bankData.dailyVolume.toLocaleString()} XAF`, icon: <Activity size={24} />, color: '#3498db' },
    { label: 'Active Webhooks', value: bankData.activeIntegrations, icon: <ExternalLink size={24} />, color: '#9b59b6' },
    { label: 'System Health', value: bankData.status, icon: <ShieldCheck size={24} />, color: '#27ae60' },
  ];

  return (
    <MainLayout theme={theme} toggleTheme={toggleTheme}>
      <header className="dashboard-header">
        <div className="flex gap-1" style={{ alignItems: 'center' }}>
          <Building2 size={32} color="var(--primary-green)" />
          <div>
            <h1>Partner Banking Command</h1>
            <p className="text-sub">{bankData.name} • Institutional Liquidity Portal</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button className="btn-secondary"><FileText size={18} /> Daily Statement</button>
          <button className="btn-primary">Settlement Run</button>
        </div>
      </header>

      <div className="grid grid-4" style={{ marginBottom: '2rem', gap: '1.5rem' }}>
        {stats.map((stat, i) => (
          <div key={i} className="glass card">
            <div className="stat-icon" style={{ background: `${stat.color}15`, color: stat.color, marginBottom: '1.5rem' }}>
              {stat.icon}
            </div>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>{stat.label}</p>
            <h2 style={{ fontSize: 'clamp(1.2rem, 5vw, 1.8rem)', margin: 0 }}>{stat.value}</h2>
          </div>
        ))}
      </div>

      <div className="activity-grid">
        <div className="glass card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="flex-between" style={{ padding: '25px', borderBottom: '1px solid var(--glass-border)' }}>
            <h3 style={{ margin: 0 }}>Real-time Transaction Clearing</h3>
            <div className="search-input-wrapper" style={{ width: '250px' }}>
              <Search size={16} className="search-icon" />
              <input type="text" placeholder="Search REF-ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Amount</th>
                  <th>Clearing Time</th>
                  <th>Status</th>
                  <th>Method</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>TXN-{tx.id.substring(0,8).toUpperCase()}</td>
                    <td style={{ fontWeight: 800 }}>{tx.amount?.toLocaleString()} XAF</td>
                    <td className="text-muted">{tx.timestamp?.toDate ? tx.timestamp.toDate().toLocaleTimeString() : 'Processing'}</td>
                    <td>
                      <span className="status-pill status-paid">
                        <CheckCircle size={12} /> Cleared
                      </span>
                    </td>
                    <td>{tx.type === 'deposit' ? 'Inward Wire' : 'Outward Transfer'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex" style={{ flexDirection: 'column', gap: '2rem' }}>
          <div className="glass card">
            <h3 style={{ marginBottom: '1.5rem' }}>Market Performance</h3>
            <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '10px', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
              {[60, 45, 80, 55, 90, 70, 85].map((h, i) => (
                <div key={i} style={{ flex: 1, background: 'var(--primary-green)', height: `${h}%`, borderRadius: '4px', opacity: 0.6 + (h/200) }}></div>
              ))}
            </div>
            <div className="flex-between" style={{ marginTop: '1rem' }}>
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>Mon</span>
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>Sun</span>
            </div>
          </div>

          <div className="glass card" style={{ background: 'var(--primary-dark)', color: 'white' }}>
            <div className="flex gap-1" style={{ marginBottom: '1rem' }}>
              <BarChart3 color="var(--primary-green)" />
              <h3 style={{ margin: 0 }}>Liquidity Ratio</h3>
            </div>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}>Safety Margin: 12.5%</p>
              <div className="progress-bar-bg" style={{ height: '8px', background: 'rgba(255,255,255,0.1)' }}>
                <div className="progress-bar-fill" style={{ width: '85%', background: 'var(--primary-green)' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default BankDashboard;
