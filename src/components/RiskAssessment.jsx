import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  ShieldCheck, 
  UserX, 
  Send, 
  Check, 
  Clock,
  LayoutDashboard,
  Wallet,
  Users,
  Target
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import MainLayout from './MainLayout';
import './Dashboard.css';

const RiskAssessment = ({ theme, toggleTheme }) => {
  const location = useLocation();
  const [riskData, setRiskData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "members"), orderBy("aiRiskScore", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRiskData(docs);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Listen Error:", error);
      setRiskData([
        { id: '1', userName: 'Samuel', aiRiskScore: 0.15, status: 'High Risk', message: 'Critical trend detected. Predictive model suggests 85% probability of default.' },
        { id: '2', userName: 'Mercy', aiRiskScore: 0.42, status: 'Medium Risk', message: 'Late contribution patterns emerging. Behavioral analysis recommends intervention.' },
        { id: '3', userName: 'David', aiRiskScore: 0.98, status: 'Verified Safe', message: 'Exemplary financial behavior. High trust score allows for expansion.' }
      ]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getRiskColor = (score) => {
    if (score < 0.3) return '#e74c3c';
    if (score < 0.7) return '#f39c12';
    return 'var(--primary-green)';
  };

  const getRiskIcon = (score) => {
    if (score < 0.3) return <AlertTriangle size={24} />;
    if (score < 0.7) return <Clock size={24} />;
    return <ShieldCheck size={24} />;
  };

  return (
    <MainLayout theme={theme} toggleTheme={toggleTheme}>
      <header className="dashboard-header">
        <div>
          <h1>AI Risk Assessment Center</h1>
          <p className="text-sub">Global monitoring of borrower creditworthiness and default predictions.</p>
        </div>
        <button className="btn-secondary" onClick={() => window.print()}>
          Generate Report
        </button>
      </header>

      {loading ? (
        <div className="flex-center" style={{ height: '300px' }}>
          <div className="loader">Analyzing scores...</div>
        </div>
      ) : (
        <div className="dashboard-grid">
          {riskData.map((member) => (
            <div key={member.id} className="glass card flex" style={{ flexDirection: 'column', borderLeft: `6px solid ${getRiskColor(member.aiRiskScore)}` }}>
              <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-icon" style={{ 
                  background: member.aiRiskScore < 0.3 ? '#fdedec' : member.aiRiskScore < 0.7 ? '#fef9e7' : '#e8f8f5', 
                  color: getRiskColor(member.aiRiskScore), 
                  margin: 0 
                }}>
                  {getRiskIcon(member.aiRiskScore)}
                </div>
                <span className={`status-pill ${member.aiRiskScore < 0.3 ? 'status-high-risk' : member.aiRiskScore < 0.7 ? 'status-pending' : 'status-paid'}`}>
                  {member.aiRiskScore < 0.3 ? 'High Risk' : member.aiRiskScore < 0.7 ? 'Medium Risk' : 'Verified Safe'}
                </span>
              </div>
              <h3 style={{ marginBottom: '0.25rem' }}>{member.userName || `User_${member.id.substring(0,4)}`}</h3>
              <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>AI Model: <span style={{ color: getRiskColor(member.aiRiskScore), fontWeight: '700' }}>Score {member.aiRiskScore.toFixed(2)}</span></p>
              <p className="text-sub" style={{ fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                {member.message || (member.aiRiskScore < 0.3 ? "Critical default probability detected." : member.aiRiskScore < 0.7 ? "Moderate risk observed in patterns." : "Consistently secure behavior.")}
              </p>
              <button className="btn-primary" style={{ width: '100%', marginTop: 'auto', background: getRiskColor(member.aiRiskScore), border: 'none' }}>
                 {member.aiRiskScore < 0.3 ? <><UserX size={18} /> Review Account</> : member.aiRiskScore < 0.7 ? <><Send size={18} /> Send Reminder</> : <><Check size={18} /> Approve Expansion</>}
              </button>
            </div>
          ))}
        </div>
      )}
    </MainLayout>
  );
};

export default RiskAssessment;
