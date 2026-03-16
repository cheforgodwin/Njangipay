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
  const [subGroups, setSubGroups] = useState([]);

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

  useEffect(() => {
    // Listen for groups to show hierarchy
    const qGroups = query(collection(db, "groups"));
    const unsubscribeGroups = onSnapshot(qGroups, (snapshot) => {
      setSubGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribeGroups();
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
          <h1>Branch Intelligence Center</h1>
          <p className="text-sub">Manage your sub-communities and hierarchical savings groups.</p>
        </div>
        <button className="btn-primary" onClick={handleAddBranch}>
          <Plus size={20} /> Add New Branch
        </button>
      </header>

      <div className="dashboard-grid">
        {loading ? (
             <div className="flex-center" style={{ gridColumn: '1/-1', height: '300px' }}>Loading clusters...</div>
        ) : communities.map((community) => (
          <div key={community.id} className="glass card flex" style={{ flexDirection: 'column', gap: '1rem' }}>
            <div className="flex-between">
              <div className="stat-icon" style={{ margin: 0 }}>
                {community.type === 'global' ? <Globe color="var(--primary-green)" size={24} /> : <MapPin color="var(--primary-green)" size={24} />}
              </div>
              <span className="status-pill status-paid">{community.status || 'Active'}</span>
            </div>
            
            <div>
              <h3 style={{ marginBottom: '0.25rem' }}>{community.name}</h3>
              <p className="text-sub" style={{ fontSize: '0.85rem' }}>{community.description}</p>
            </div>

            <div style={{ padding: '1rem', background: 'var(--accent-light)', borderRadius: '12px' }}>
               <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px' }}>Active Groups</p>
               <div className="flex-column" style={{ gap: '8px' }}>
                  {subGroups.filter(g => g.type === 'public' || community.type === 'global').slice(0, 3).map(group => (
                    <div key={group.id} className="flex-between" style={{ fontSize: '0.85rem' }}>
                       <span>{group.name}</span>
                       <span style={{ fontWeight: 600 }}>{group.members || 0} mem.</span>
                    </div>
                  ))}
                  {subGroups.length === 0 && <span className="text-muted" style={{ fontSize: '0.8rem' }}>No groups linked yet.</span>}
               </div>
            </div>

            <div className="flex-between" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 'auto' }}>
               <div className="flex gap-1"><Users size={16} /> {community.members?.toLocaleString() || 0} Total</div>
               <button className="btn-secondary" style={{ padding: '5px 15px' }}>Manage</button>
            </div>
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
