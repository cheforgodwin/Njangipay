import React, { useState, useEffect } from 'react';
import { 
  Download, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus
} from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import MainLayout from './MainLayout';
import './Dashboard.css';

const WalletPage = ({ theme, toggleTheme }) => {
  const { currentUser } = useAuth();
  
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userDocId, setUserDocId] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    // 1. Get user document and balance
    const userQuery = query(collection(db, "users"), where("uid", "==", currentUser.uid));
    const unsubscribeUser = onSnapshot(userQuery, (snapshot) => {
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        setBalance(userData.balance || 0);
        setUserDocId(snapshot.docs[0].id);
      } else {
        setBalance(500000); // Fallback
      }
    });

    // 2. Get transaction history
    const transQuery = query(
      collection(db, "transactions"), 
      where("user_id", "==", currentUser.uid),
      orderBy("timestamp", "desc")
    );
    const unsubscribeTrans = onSnapshot(transQuery, (snapshot) => {
      const transList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(transList);
      setLoading(false);
    }, (error) => {
      console.warn("Transactions query failed:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeUser();
      unsubscribeTrans();
    };
  }, [currentUser]);

  const handleDeposit = async () => {
    if (!userDocId) return;
    const amount = 10000;
    
    try {
      await addDoc(collection(db, "transactions"), {
        user_id: currentUser.uid,
        amount: amount,
        type: "deposit",
        title: "Wallet Refill",
        timestamp: serverTimestamp(),
        status: "completed"
      });

      const userRef = doc(db, "users", userDocId);
      await updateDoc(userRef, {
        balance: increment(amount)
      });

      alert("Deposit Successful! 10,000 XAF added to your wallet.");
    } catch (error) {
      console.error("Deposit error:", error);
      alert("Deposit failed. Please try again.");
    }
  };

  return (
    <MainLayout theme={theme} toggleTheme={toggleTheme}>
      <header className="dashboard-header">
        <div className="flex gap-1" style={{ alignItems: 'center' }}>
          <h1>My Wallet</h1>
        </div>
        <div className="flex gap-1">
           <button className="btn-secondary" onClick={() => window.print()}><Download size={18} /> Export CSV</button>
           <button className="btn-primary" onClick={handleDeposit}><Plus size={18} /> Add Funds</button>
        </div>
      </header>

      <div className="dashboard-grid wallet-grid">
        <div>
          <div className="glass card wallet-card-primary" style={{ padding: '40px', borderRadius: '30px' }}>
            <div className="flex-between" style={{ opacity: 0.8, marginBottom: '10px' }}>
               <span>Wallet Balance</span>
               <CreditCard size={20} />
            </div>
            <h2 className="hero-title" style={{ fontSize: '3.5rem', margin: '0 0 40px 0', color: '#fff' }}>
              {balance.toLocaleString()} XAF
            </h2>
            
            <div className="flex gap-1">
               <button className="btn-primary" style={{ flex: 1, background: 'rgba(255,255,255,0.2)' }} onClick={handleDeposit}>
                  <Download size={18} /> Deposit
               </button>
               <button className="btn-primary" style={{ flex: 1, background: 'white', color: 'var(--primary-green)' }}>
                  <ArrowUpRight size={18} /> Withdraw
               </button>
            </div>
          </div>

          <div className="glass card" style={{ marginTop: '30px' }}>
             <h3 style={{ margin: '0 0 20px 0' }}>Wallet Info</h3>
             <div className="flex" style={{ flexDirection: 'column', gap: '15px' }}>
                <div className="flex-between">
                   <span className="text-muted">Account ID</span>
                   <span style={{ fontWeight: '600' }}>NP-{currentUser?.uid ? currentUser.uid.substring(0,8).toUpperCase() : 'GUEST'}</span>
                </div>
                <div className="flex-between">
                   <span className="text-muted">Status</span>
                   <span style={{ color: '#27ae60', fontWeight: '700' }}>Verified</span>
                </div>
                <div className="flex-between">
                   <span className="text-muted">Currency</span>
                   <span style={{ fontWeight: '600' }}>XAF (CFA Franc)</span>
                </div>
             </div>
          </div>
        </div>

        <div className="glass card" style={{ padding: '0', overflow: 'hidden' }}>
           <div className="flex-between" style={{ padding: '30px', borderBottom: '1px solid #f0f0f0' }}>
             <h3 style={{ margin: 0 }}>Transaction History</h3>
             <button className="btn-secondary">Full History</button>
           </div>
           
           <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {loading ? (
                 <div className="flex-center" style={{ height: '200px' }}>Loading transactions...</div>
              ) : transactions.length > 0 ? (
                transactions.map((txn) => (
                  <div key={txn.id} className="flex-between" style={{ padding: '25px 30px', borderBottom: '1px solid #f9f9f9' }}>
                    <div className="flex gap-1" style={{ alignItems: 'center' }}>
                      <div style={{ width: '50px', height: '50px', borderRadius: '15px', background: txn.type === 'deposit' ? '#e8f8f5' : '#fdedec', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         {txn.type === 'deposit' ? <ArrowDownLeft color="#27ae60" size={24} /> : <ArrowUpRight color="#e74c3c" size={24} />}
                      </div>
                      <div>
                        <p style={{ fontWeight: '700', margin: 0, fontSize: '1.1rem' }}>{txn.title || (txn.type === 'deposit' ? 'Deposit' : 'Expense')}</p>
                        <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '5px' }}>
                          {txn.timestamp?.toDate ? txn.timestamp.toDate().toLocaleString() : 'Just now'}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: '800', fontSize: '1.1rem', margin: 0, color: txn.type === 'deposit' ? '#27ae60' : '#e74c3c' }}>
                        {txn.type === 'deposit' ? '+' : '-'} {txn.amount?.toLocaleString()} XAF
                      </p>
                      <p style={{ color: '#ccc', fontSize: '0.8rem', margin: '4px 0' }}>TXN-{txn.id.substring(0,8).toUpperCase()}</p>
                    </div>
                  </div>
                ))
              ) : (
                 <div style={{ padding: '40px', textAlign: 'center' }} className="text-muted">No transactions found.</div>
              )}
           </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default WalletPage;
