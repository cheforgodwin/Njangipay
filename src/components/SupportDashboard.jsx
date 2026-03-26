import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  MessageSquare, 
  UserCheck, 
  History, 
  LayoutDashboard, 
  Wallet, 
  Users, 
  Target, 
  CreditCard, 
  Search,
  CheckCircle,
  XCircle,
  HelpCircle,
  Globe,
  Shield,
  Moon,
  Sun
} from 'lucide-react';
import { collection, query, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import MainLayout from './MainLayout';
import './Dashboard.css';

const SupportDashboard = ({ theme, toggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLinkActive = (path) => location.pathname === path;

  const [tickets, setTickets] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Listen for tickets
    const qTickets = query(collection(db, "tickets"), orderBy("timestamp", "desc"));
    const unsubscribeTickets = onSnapshot(qTickets, (snapshot) => {
      const ticketList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (ticketList.length === 0) {
        setTickets([
          { user: 'Bello S.', topic: 'Payment Discrepancy', id: 'TK-9283', priority: 'High', time: '10m ago' },
          { user: 'Marie L.', topic: 'Branch Verification', id: 'TK-9104', priority: 'Medium', time: '1h ago' },
        ]);
      } else {
        setTickets(ticketList);
      }
    });

    // Listen for verifications
    const qVerif = query(collection(db, "verification_requests"), orderBy("timestamp", "desc"));
    const unsubscribeVerif = onSnapshot(qVerif, (snapshot) => {
      const verifList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (verifList.length === 0) {
        setVerifications([
          { id: 'v1', userName: 'Amadou T.', note: 'New Group Creator registration.', status: 'pending' },
          { id: 'v2', userName: 'Clarisse N.', note: 'KYC Document verification.', status: 'pending' },
        ]);
      } else {
        setVerifications(verifList);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeTickets();
      unsubscribeVerif();
    };
  }, []);

  const handleVerify = async (id, status) => {
    try {
      const verifRef = doc(db, "verification_requests", id);
      await updateDoc(verifRef, { status: status });
      alert(`Verification ${status} successfully.`);
    } catch (error) {
      console.error("Verify error:", error);
      alert("Failed to update verification status.");
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.topic?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout theme={theme} toggleTheme={toggleTheme}>
        <header className="dashboard-header">
          <div>
            <h1>Support & Verification</h1>
            <p className="text-sub">Review user inquiries and verify community registrations.</p>
          </div>
          <div className="search-filter-bar" style={{ margin: 0 }}>
             <div className="search-input-wrapper" style={{ width: '100%', maxWidth: '300px' }}>
                <Search size={18} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search tickets..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
          </div>
        </header>

        <div className="activity-grid">
          <div className="glass card" style={{ padding: '0', overflow: 'hidden' }}>
            <div className="flex-between" style={{ padding: '25px', borderBottom: '1px solid var(--glass-border)' }}>
              <div className="flex gap-1" style={{ alignItems: 'center' }}>
                <MessageSquare color="var(--primary-green)" />
                <h3 style={{ margin: 0 }}>Active Tickets Queue</h3>
              </div>
              <span className="status-pill status-pending">{filteredTickets.length} Active</span>
            </div>
            
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {loading ? (
                <div className="flex-center" style={{ height: '200px' }}>Syncing with Support Mesh...</div>
              ) : filteredTickets.map((ticket) => (
                <div key={ticket.id} className="flex-between" style={{ padding: '25px', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer' }}>
                   <div className="flex gap-1">
                      <div className="flex-center" style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'var(--accent-light)', fontWeight: '700' }}>
                         {ticket.user?.[0] || 'T'}
                      </div>
                      <div>
                         <h4 style={{ margin: 0 }}>{ticket.topic}</h4>
                         <p className="text-muted" style={{ fontSize: '0.85rem' }}>{ticket.id.substring(0,8)} • {ticket.user}</p>
                      </div>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: ticket.priority === 'High' ? '#e74c3c' : '#f39c12' }}>
                         {ticket.priority || 'Medium'} Priority
                      </span>
                      <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                        {ticket.timestamp?.toDate ? ticket.timestamp.toDate().toLocaleTimeString() : ticket.time || 'recent'}
                      </p>
                   </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex" style={{ flexDirection: 'column', gap: '2rem' }}>
            <div className="glass card">
               <h3 className="flex gap-1" style={{ marginBottom: '1.5rem', alignItems: 'center' }}>
                  <UserCheck color="var(--primary-green)" size={20} /> User Verification
               </h3>
               <div style={{ flexDirection: 'column', display: 'flex', gap: '1.5rem' }}>
                  {verifications.filter(v => v.status === 'pending').map((v) => (
                    <div key={v.id} className="glass" style={{ padding: '15px', borderRadius: '15px', background: 'var(--accent-light)' }}>
                       <div className="flex-between" style={{ marginBottom: '10px' }}>
                          <span style={{ fontWeight: '700' }}>{v.userName}</span>
                          <span className="status-pill status-pending" style={{ fontSize: '0.7rem' }}>Pending</span>
                       </div>
                       <p className="text-sub" style={{ fontSize: '0.8rem', marginBottom: '12px' }}>{v.note || v.description}</p>
                       <div className="flex gap-1">
                          <button onClick={() => handleVerify(v.id, 'approved')} className="btn-primary" style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}><CheckCircle size={14} /> Approve</button>
                          <button onClick={() => handleVerify(v.id, 'denied')} className="btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}><XCircle size={14} /> Deny</button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="glass card flex-center" style={{ flexDirection: 'column', gap: '1rem', border: '1px dashed var(--glass-border)' }}>
               <HelpCircle size={40} color="var(--text-muted)" />
               <p style={{ textAlign: 'center', margin: 0, fontWeight: '600' }}>Need Platform Help?</p>
               <button className="btn-secondary" style={{ width: '100%' }} onClick={() => window.open('https://firebase.google.com/docs/firestore', '_blank')}>Internal Documentation</button>
            </div>
          </div>
        </div>
    </MainLayout>
  );
};

export default SupportDashboard;
