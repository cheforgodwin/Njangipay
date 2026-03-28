import React, { useState, useEffect } from 'react';
import { 
  Building, Globe, MapPin, Plus, Users, X
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { collection, query, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import MainLayout from './MainLayout';
import './Dashboard.css';
import './AdminPanel.css';

const AdminPanel = ({ theme, toggleTheme }) => {
  const location = useLocation();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subGroups, setSubGroups] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [editDesc, setEditDesc] = useState('');

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
    };
  };

  const handleManage = (community) => {
    setSelectedCommunity(community);
    setEditDesc(community.description || '');
  };

  const handleSaveManage = async () => {
    if (!selectedCommunity) return;
    try {
      // Only update real docs (not demo placeholders like id '1', '2')
      if (!selectedCommunity.id.startsWith('demo-')) {
        await updateDoc(doc(db, "communities", selectedCommunity.id), {
          description: editDesc,
          status: 'Active'
        });
      }
      setCommunities(cs => cs.map(c => c.id === selectedCommunity.id ? { ...c, description: editDesc } : c));
      setSelectedCommunity(null);
      alert('Branch updated successfully!');
    } catch (e) {
      console.error(e);
      alert('Could not update. (Demo data cannot be persisted)');
      setSelectedCommunity(null);
    }
  };

  return (
    <>
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

      <div className="grid grid-3">
        {loading ? (
             <div className="flex-center admin-loading">Loading clusters...</div>
        ) : communities.map((community) => (
          <div key={community.id} className="glass card flex admin-card">
            <div className="flex-between">
              <div className="stat-icon admin-icon">
                {community.type === 'global' ? <Globe color="var(--primary-green)" size={24} /> : <MapPin color="var(--primary-green)" size={24} />}
              </div>
              <span className="status-pill status-paid">{community.status || 'Active'}</span>
            </div>
            
            <div>
              <h3 className="admin-title">{community.name}</h3>
              <p className="text-sub admin-desc">{community.description}</p>
            </div>

            <div className="admin-groups-container">
               <p className="admin-groups-title">Active Groups</p>
               <div className="flex-column admin-groups-list">
                  {subGroups.filter(g => g.type === 'public' || community.type === 'global').slice(0, 3).map(group => (
                    <div key={group.id} className="flex-between admin-group-item">
                       <span>{group.name}</span>
                       <span className="admin-group-mem">{group.members || 0} mem.</span>
                    </div>
                  ))}
                  {subGroups.length === 0 && <span className="text-muted admin-no-groups">No groups linked yet.</span>}
               </div>
            </div>

            <div className="flex-between admin-card-footer">
               <div className="flex gap-1"><Users size={16} /> {community.members?.toLocaleString() || 0} Total</div>
               <button className="btn-secondary admin-btn-manage" onClick={() => handleManage(community)}>Manage</button>
            </div>
          </div>
        ))}
        
        <div 
          className="glass card flex-center admin-add-card" 
          onClick={handleAddBranch}
        >
           <div className="flex-center admin-add-icon-box">
              <Plus color="var(--primary-green)" />
           </div>
           <span className="text-muted admin-add-text">Add New Branch</span>
        </div>
      </div>
    </MainLayout>

    {selectedCommunity && (
      <div className="modal-overlay">
        <div className="glass modal-content">
          <div className="flex-between admin-modal-header">
            <h2>Manage: {selectedCommunity.name}</h2>
            <button onClick={() => setSelectedCommunity(null)} className="admin-modal-close"><X size={24} /></button>
          </div>
          <label className="admin-modal-label">Branch Description</label>
          <textarea 
            value={editDesc}
            onChange={e => setEditDesc(e.target.value)}
            rows={4}
            className="admin-modal-textarea"
          />
          <div className="admin-modal-info">
            <p className="admin-modal-info-text">
              <strong>Members:</strong> {selectedCommunity.members || 0} &nbsp;|&nbsp;
              <strong>Status:</strong> {selectedCommunity.status || 'Active'} &nbsp;|&nbsp;
              <strong>Type:</strong> {selectedCommunity.type || 'local'}
            </p>
          </div>
          <div className="flex gap-1 admin-modal-actions">
            <button onClick={() => setSelectedCommunity(null)} className="btn-secondary admin-modal-btn">Cancel</button>
            <button onClick={handleSaveManage} className="btn-primary admin-modal-btn">Save Changes</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default AdminPanel;
