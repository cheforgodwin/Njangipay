import React, { useState } from 'react';
import { 
  Calendar, Clock, CheckCircle, AlertTriangle, 
  ArrowRight, Users, UserCheck, RefreshCcw, DollarSign 
} from 'lucide-react';
import MainLayout from './MainLayout';
import './Dashboard.css';
import './PayoutRotation.css';

const PayoutRotation = ({ theme, toggleTheme }) => {
  const [rotationSettings, setRotationSettings] = useState({
    cycleLength: 'Monthly',
    payoutAmount: 500000,
    currentTurn: 2,
    totalMembers: 12
  });

  const [members, setMembers] = useState([
    { id: 1, name: 'Jean-Pierre', status: 'Paid Out', month: 'January', amount: 500000, paid: true },
    { id: 2, name: 'Marie Claire', status: 'Up Next', month: 'February', amount: 500000, paid: false, ready: true },
    { id: 3, name: 'Godwin Chefor', status: 'Waiting', month: 'March', amount: 500000, paid: false },
    { id: 4, name: 'Ahmadou B.', status: 'Waiting', month: 'April', amount: 500000, paid: false },
  ]);

  const handleApprovePayout = (id) => {
    setMembers(members.map(m => m.id === id ? { ...m, status: 'Paid Out', paid: true } : m));
    setRotationSettings(prev => ({ ...prev, currentTurn: prev.currentTurn + 1 }));
    alert('Smart Contract Executed: Funds disbursed to Mobile Money automatically!');
  };

  return (
    <MainLayout theme={theme} toggleTheme={toggleTheme}>
      <header className="dashboard-header">
        <div>
          <h1>Automated Payout Rotation</h1>
          <p className="text-sub">Eliminate human error and coordinate your Njangi distributions seamlessly.</p>
        </div>
        <button className="btn-secondary flex gap-1 items-center">
          <RefreshCcw size={18} /> Shuffle Order
        </button>
      </header>

      <div className="grid grid-3 payout-grid">
        <div className="glass card payout-cycle-card">
          <div>
            <p className="payout-card-label">Active Cycle</p>
            <h2 className="payout-card-value">{rotationSettings.cycleLength}</h2>
          </div>
          <Calendar size={32} color="var(--primary-green)" opacity={0.5} />
        </div>
        <div className="glass card payout-cycle-card">
          <div>
            <p className="payout-card-label">Standard Payout</p>
            <h2 className="payout-card-value">{rotationSettings.payoutAmount.toLocaleString()} XAF</h2>
          </div>
          <DollarSign size={32} color="#f1c40f" opacity={0.5} />
        </div>
        <div className="glass card payout-cycle-card">
          <div>
            <p className="payout-card-label">Next Disbursement</p>
            <h2 className="payout-card-value">in 4 Days</h2>
          </div>
          <Clock size={32} color="#3498db" opacity={0.5} />
        </div>
      </div>

      <div className="glass card rotation-container">
        <div className="rotation-header">
          <h3 className="rotation-title">
            <Users size={20} color="var(--primary-green)" /> Official Rotation Schedule
          </h3>
        </div>
        
        <div className="rotation-list">
          {members.map((member, index) => (
            <div key={member.id} className={`flex-between rotation-item ${index + 1 === rotationSettings.currentTurn ? 'current-turn' : ''}`}>
              <div className="flex gap-2 items-center">
                <div className={`rotation-avatar ${member.paid ? 'paid' : 'pending'}`}>
                  {index + 1}
                </div>
                <div>
                  <h4 className="rotation-name">
                    {member.name} 
                    {index + 1 === rotationSettings.currentTurn && <span className="badge badge-current">Current Turn</span>}
                  </h4>
                  <p className="text-sub rotation-details">Payout Month: {member.month}</p>
                </div>
              </div>

              <div className="flex gap-2 items-center">
                <div className="rotation-amount-wrapper">
                  <p className="rotation-amount">{member.amount.toLocaleString()} XAF</p>
                  <p className={`rotation-status ${member.paid ? 'paid' : 'pending'}`}>
                    {member.paid ? 'Disbursed' : 'Pending'}
                  </p>
                </div>

                {member.paid ? (
                  <button className="btn-secondary btn-settled" disabled>
                    <CheckCircle size={18} /> Settled
                  </button>
                ) : index + 1 === rotationSettings.currentTurn ? (
                  <button className="btn-primary" onClick={() => handleApprovePayout(member.id)}>
                    Approve Payout <ArrowRight size={18} className="btn-approve-arrow" />
                  </button>
                ) : (
                  <button className="btn-secondary btn-locked" disabled>
                    <AlertTriangle size={18} /> Locked
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default PayoutRotation;
