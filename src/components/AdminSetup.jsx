import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, CheckCircle, ArrowRight } from 'lucide-react';

const AdminSetup = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handlePromote = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        role: 'super-admin'
      });
      setSuccess(true);
    } catch (err) {
      console.error("Promotion error:", err);
      alert("Failed to promote user. Check console or firestore rules.");
    }
    setLoading(false);
  };

  if (!currentUser) {
    return (
      <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '20px' }}>
        <ShieldAlert size={60} color="#e74c3c" />
        <h2>Authentication Required</h2>
        <p>Please login first to use the NjangiPay Setup utility.</p>
        <button onClick={() => navigate('/login')} className="btn-primary">Go to Login</button>
      </div>
    );
  }

  return (
    <div className="flex-center" style={{ height: '100vh', padding: '20px' }}>
      <div className="glass card" style={{ maxWidth: '500px', textAlign: 'center', border: '1px solid var(--primary-green)' }}>
        <div className="stat-icon" style={{ background: 'var(--accent-light)', color: 'var(--primary-green)', margin: '0 auto 20px' }}>
          <ShieldAlert size={30} />
        </div>
        
        <h2>NjangiPay Admin Setup</h2>
        <p className="text-sub" style={{ margin: '15px 0 25px' }}>
          This utility will promote your current account (<b>{currentUser.email}</b>) to the <b>super-admin</b> role. 
          This grants global access to the system.
        </p>

        {success ? (
          <div style={{ color: '#27ae60', fontWeight: '700' }}>
            <CheckCircle size={40} style={{ marginBottom: '10px' }} />
            <p>Access Granted! You are now a Super Admin.</p>
            <button 
              onClick={() => {
                // Force reload to refresh AuthContext states
                window.location.href = '/super-admin';
              }} 
              className="btn-primary" 
              style={{ marginTop: '20px', width: '100%' }}
            >
              Enter NjangiPay Command <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <button 
            onClick={handlePromote} 
            disabled={loading}
            className="btn-primary" 
            style={{ width: '100%' }}
          >
            {loading ? 'Promoting...' : 'Promote to Super Admin'}
          </button>
        )}
        
        <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '20px' }}>
          <b>SECURITY NOTE:</b> After using this, please ask me to remove this route for security.
        </p>
      </div>
    </div>
  );
};

export default AdminSetup;
