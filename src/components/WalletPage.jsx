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
import { processTransfer } from '../utils/transactionHelpers';
import MainLayout from './MainLayout';
import './Dashboard.css';
import './WalletPage.css';

const WalletPage = ({ theme, toggleTheme }) => {
  const { currentUser } = useAuth();
  
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userDocId, setUserDocId] = useState(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [recipientBank, setRecipientBank] = useState('Ecobank');

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!userDocId || !amount) return;
    const withdrawAmount = parseFloat(amount.replace(/,/g, ''));

    if (withdrawAmount > balance) {
      alert("Insufficient funds for withdrawal.");
      return;
    }

    try {
      // 1. Log transaction
      await addDoc(collection(db, "transactions"), {
        user_id: currentUser.uid,
        amount: withdrawAmount,
        type: "withdrawal",
        title: `Withdraw to ${recipientBank}`,
        timestamp: serverTimestamp(),
        status: "completed"
      });

      // 2. Update balance
      const userRef = doc(db, "users", userDocId);
      await updateDoc(userRef, {
        balance: increment(-withdrawAmount)
      });

      setShowWithdrawModal(false);
      setAmount('');
      alert(`Success! ${withdrawAmount.toLocaleString()} XAF sent to your ${recipientBank} account.`);
    } catch (error) {
      console.error("Withdrawal error:", error);
      alert("Withdrawal failed.");
    }
  };

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
      where("user_id", "==", currentUser.uid)
    );
    const unsubscribeTrans = onSnapshot(transQuery, (snapshot) => {
      const transList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Client-side sort to bypass index requirement
      transList.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
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

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!userDocId || !amount) return;
    const depositAmount = parseFloat(amount.replace(/,/g, ''));
    
    try {
      await addDoc(collection(db, "transactions"), {
        user_id: currentUser.uid,
        amount: depositAmount,
        type: "deposit",
        title: "Wallet Refill",
        timestamp: serverTimestamp(),
        status: "completed"
      });

      const userRef = doc(db, "users", userDocId);
      await updateDoc(userRef, {
        balance: increment(depositAmount)
      });

      setShowDepositModal(false);
      setAmount('');
      alert(`Success! ${depositAmount.toLocaleString()} XAF added to your wallet.`);
    } catch (error) {
      console.error("Deposit error:", error);
      alert("Deposit failed. Please try again.");
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!amount || !recipientId) return;
    const transferAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(transferAmount) || transferAmount <= 0) return;

    if (transferAmount > balance) {
      alert("Insufficient funds for this transfer.");
      return;
    }
    
    setLoading(true);
    try {
      const result = await processTransfer(currentUser.uid, recipientId, transferAmount);
      
      if (result.success) {
        setShowTransferModal(false);
        setAmount('');
        setRecipientId('');
        alert(`Successfully transferred ${transferAmount.toLocaleString()} XAF to NP-${recipientId}.`);
      } else {
        alert(`Transfer failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Transfer error:", error);
      alert("An unexpected error occurred during transfer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout theme={theme} toggleTheme={toggleTheme}>
      <header className="dashboard-header">
        <div className="flex gap-1 wallet-header-left">
          <h1>My Wallet</h1>
        </div>
        <div className="flex gap-1">
            <button className="btn-secondary" onClick={() => window.print()}><Download size={18} /> Export CSV</button>
            <button className="btn-secondary wallet-btn-withdraw" onClick={() => setShowWithdrawModal(true)}><ArrowUpRight size={18} /> Withdraw</button>
            <button className="btn-primary" onClick={() => setShowDepositModal(true)}><Plus size={18} /> Add Funds</button>
        </div>
      </header>

      {showDepositModal && (
        <div className="modal-overlay">
          <div className="glass modal-content">
            <h2>Add Funds</h2>
            <form onSubmit={handleDeposit} className="wallet-modal-form">
              <div className="wallet-modal-group">
                <label className="wallet-modal-label">Amount to Deposit (XAF)</label>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  required 
                  placeholder="25,000"
                  className="wallet-modal-input"
                />
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => setShowDepositModal(false)} className="btn-secondary wallet-modal-btn">Cancel</button>
                <button type="submit" className="btn-primary wallet-modal-btn">Confirm Deposit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTransferModal && (
        <div className="modal-overlay">
          <div className="glass modal-content">
            <h2>Transfer Funds</h2>
            <form onSubmit={handleTransfer} className="wallet-modal-form">
              <div className="wallet-modal-group">
                <label className="wallet-modal-label">Recipient Account ID</label>
                <input 
                  type="text" 
                  value={recipientId} 
                  onChange={(e) => setRecipientId(e.target.value.toUpperCase())}
                  required 
                  placeholder="NP-XXXXXXXX"
                  className="wallet-modal-input-sm"
                />
              </div>
              <div className="wallet-modal-group">
                <label className="wallet-modal-label">Amount (XAF)</label>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  required 
                  className="wallet-modal-input-sm"
                />
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => setShowTransferModal(false)} className="btn-secondary wallet-modal-btn">Cancel</button>
                <button type="submit" className="btn-primary wallet-modal-btn">Send XAF</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showWithdrawModal && (
        <div className="modal-overlay">
          <div className="glass modal-content">
            <h2>Withdraw to Bank</h2>
            <form onSubmit={handleWithdraw} className="wallet-modal-form">
              <div className="wallet-modal-group">
                <label className="wallet-modal-label">Select Partner Bank</label>
                <select 
                  value={recipientBank}
                  onChange={(e) => setRecipientBank(e.target.value)}
                  className="wallet-modal-input-sm"
                >
                  <option>Ecobank</option>
                  <option>SCB Cameroon</option>
                  <option>UBA</option>
                  <option>Afriland First Bank</option>
                </select>
              </div>
              <div className="wallet-modal-group">
                <label className="wallet-modal-label">Amount to Withdraw (XAF)</label>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  required 
                  className="wallet-modal-input-sm"
                />
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => setShowWithdrawModal(false)} className="btn-secondary wallet-modal-btn">Cancel</button>
                <button type="submit" className="btn-primary wallet-modal-btn wallet-modal-btn-danger">Confirm Withdrawal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="dashboard-grid wallet-grid">
        <div>
          <div className="glass card wallet-card-primary wallet-card-primary-wrapper">
            <div className="flex-between wallet-balance-header">
               <span>Wallet Balance</span>
               <CreditCard size={20} />
            </div>
            <h2 className="hero-title wallet-balance-amount">
              {balance.toLocaleString()} XAF
            </h2>
            
            <div className="flex gap-1 wallet-actions-container">
               <button className="btn-primary wallet-action-btn wallet-action-deposit" onClick={() => setShowDepositModal(true)}>
                  <Download size={18} /> Deposit
               </button>
               <button className="btn-primary wallet-action-btn wallet-action-transfer" onClick={() => setShowTransferModal(true)}>
                  <ArrowUpRight size={18} /> Transfer
               </button>
            </div>
          </div>

          <div className="glass card wallet-info-card">
             <h3 className="wallet-info-title">Wallet Info</h3>
             <div className="flex wallet-info-list">
                <div className="flex-between">
                   <span className="text-muted">Account ID</span>
                   <span className="wallet-info-val-bold">NP-{currentUser?.uid ? currentUser.uid.substring(0,8).toUpperCase() : 'GUEST'}</span>
                </div>
                <div className="flex-between">
                   <span className="text-muted">Status</span>
                   <span className="wallet-info-val-success">Verified</span>
                </div>
                <div className="flex-between">
                   <span className="text-muted">Currency</span>
                   <span className="wallet-info-val-bold">XAF (CFA Franc)</span>
                </div>
             </div>
          </div>
        </div>

        <div className="glass card wallet-history-card">
           <div className="flex-between wallet-history-header">
             <h3 className="wallet-history-title">Transaction History</h3>
             <button className="btn-secondary">Full History</button>
           </div>
           
           <div className="wallet-history-list">
              {loading ? (
                 <div className="flex-center wallet-history-loading">Loading transactions...</div>
              ) : transactions.length > 0 ? (
                transactions.map((txn) => (
                  <div key={txn.id} className="flex-between wallet-txn-item">
                    <div className="flex gap-1 wallet-txn-left">
                      <div className={`wallet-txn-icon-box ${txn.type === 'deposit' ? 'wallet-txn-deposit-bg' : 'wallet-txn-expense-bg'}`}>
                         {txn.type === 'deposit' ? <ArrowDownLeft color="#27ae60" size={24} /> : <ArrowUpRight color="#e74c3c" size={24} />}
                      </div>
                      <div>
                        <p className="wallet-txn-title">{txn.title || (txn.type === 'deposit' ? 'Deposit' : 'Expense')}</p>
                        <p className="text-muted wallet-txn-time">
                          {txn.timestamp?.toDate ? txn.timestamp.toDate().toLocaleString() : 'Just now'}
                        </p>
                      </div>
                    </div>
                    <div className="wallet-txn-right">
                      <p className={`wallet-txn-amount ${txn.type === 'deposit' ? 'wallet-txn-amount-pos' : 'wallet-txn-amount-neg'}`}>
                        {txn.type === 'deposit' ? '+' : '-'} {txn.amount?.toLocaleString()} XAF
                      </p>
                      <p className="wallet-txn-id">TXN-{txn.id.substring(0,8).toUpperCase()}</p>
                    </div>
                  </div>
                ))
              ) : (
                 <div className="text-muted wallet-txn-empty">No transactions found.</div>
              )}
           </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default WalletPage;
