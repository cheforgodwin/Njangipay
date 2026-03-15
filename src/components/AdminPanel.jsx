import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Globe, 
  MapPin, 
  Plus, 
  LayoutDashboard,
  Wallet,
  Users,
  Target,
  Shield,
  MessageSquare
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { collection, query, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import MainLayout from './MainLayout';
import './Dashboard.css';

const AdminPanel = ({ theme, toggleTheme }) => {
  const location = useLocation();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "communities"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const communityList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (communityList.length === 0) {
        setCommunities([
          { id: '1', name: 'Global Savings Community A', description: 'Primary hub for international contributions.', members: 1240, status: 'Active', type: 'global' },
          { id: '2', name: 'Branch Yaoundé', description: 'Serving the Yaoundé metropolitan area.', members: 856, status: 'Active', type: 'local' },
        ]);
      } else {
        setCommunities(communityList);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddBranch = async () => {
    const name = prompt("Enter Branch Name:");
    if (!name) return;

    try {
      await addDoc(collection(db, "communities"), {
        name: name,
        description: "New localized unit served by NjangiPay expansion.",
        members: 0,
        status: "Active",
        type: "local",
        created_at: serverTimestamp()
      });
      alert(`Branch "${name}" added successfully!`);
    } catch (error) {
      console.error("Add branch error:", error);
      alert("Failed to add branch.");
    }
  };

  return (
    <MainLayout theme={theme} toggleTheme={toggleTheme}>
      <header className="dashboard-header">
        <div>
          <h1>Community Admin Panel</h1>
          <p className="text-sub">Manage your sub-communities and branches across the platform.</p>
        </div>
        <button className="btn-primary" onClick={handleAddBranch}>
          <Plus size={20} /> Add New Branch
        </button>
      </header>

      <div className="dashboard-grid">
        {loading ? (
             <div className="flex-center" style={{ gridColumn: '1/-1', height: '300px' }}>Loading clusters...</div>
        ) : communities.map((community) => (
          <div key={community.id} className="glass card flex" style={{ flexDirection: 'column' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <div className="stat-icon" style={{ margin: 0 }}>
                {community.type === 'global' ? <Globe color="var(--primary-green)" size={24} /> : <MapPin color="var(--primary-green)" size={24} />}
              </div>
              <span className="status-pill status-paid">{community.status || 'Active'}</span>
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>{community.name}</h3>
            <p className="text-sub" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>{community.description}</p>
            <div className="flex gap-1" style={{ alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
               <Users size={16} /> {community.members?.toLocaleString() || 0} Members
            </div>
            <button className="btn-secondary" style={{ marginTop: 'auto', width: '100%' }}>Manage Branch</button>
          </div>
        ))}
        
        <div 
          className="glass card flex-center" 
          style={{ border: '2px dashed var(--glass-border)', background: 'transparent', cursor: 'pointer', flexDirection: 'column', gap: '1rem' }}
          onClick={handleAddBranch}
        >
           <div className="flex-center" style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--accent-light)' }}>
              <Plus color="var(--primary-green)" />
           </div>
           <span className="text-muted" style={{ fontWeight: '600' }}>Add New Branch</span>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminPanel;
