import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Users, 
  Globe, 
  Shield, 
  ArrowRight
} from 'lucide-react';
import { collection, query, onSnapshot, orderBy, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import MainLayout from './MainLayout';
import './Dashboard.css';

const GroupsPage = ({ theme, toggleTheme }) => {
  const { currentUser, getUserDisplayName } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [userMemberships, setUserMemberships] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // 1. Fetch all groups
    const q = query(collection(db, "groups"), orderBy("createdAt", "desc"));
    const unsubscribeGroups = onSnapshot(q, (snapshot) => {
      const groupsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      if (groupsData.length === 0) {
        // Mock data if empty
        setGroups([
          { id: 'hub-a', name: 'Global Hub Unit A', members: 124, status: 'Active', focus: 'High Savings', entry: '100,000 XAF' },
          { id: 'yaounde-1', name: 'Branch Yaoundé - Central', members: 85, status: 'Active', focus: 'Retail P2P', entry: '50,000 XAF' },
          { id: 'tech-dev', name: 'Tech Developers Circle', members: 42, status: 'Open', focus: 'Investment', entry: '250,000 XAF' },
        ]);
      } else {
        setGroups(groupsData);
      }
      setLoading(false);
    });

    // 2. Fetch current user memberships
    let unsubscribeMem = () => {};
    if (currentUser) {
      const memQuery = query(collection(db, "members"), where("user_id", "==", currentUser.uid));
      unsubscribeMem = onSnapshot(memQuery, (snapshot) => {
        const membershipIds = new Set(snapshot.docs.map(doc => doc.data().group_id));
        setUserMemberships(membershipIds);
      });
    }

    return () => {
      unsubscribeGroups();
      unsubscribeMem();
    };
  }, [currentUser]);

  const handleJoinGroup = async (group) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (userMemberships.has(group.id)) {
      navigate(`/group/${group.id}/contributions`);
      return;
    }

    try {
      await addDoc(collection(db, "members"), {
        user_id: currentUser.uid,
        userName: getUserDisplayName(),
        group_id: group.id,
        groupName: group.name,
        joined_at: serverTimestamp(),
        aiRiskScore: 0.95,
        totalContributed: 0,
        status: "active"
      });
      alert(`Successfully joined ${group.name}!`);
      navigate(`/group/${group.id}/contributions`);
    } catch (error) {
      console.error("Join group error:", error);
      alert("Failed to join group. Please try again.");
    }
  };

  const filteredGroups = groups.filter(group => 
    group.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.focus?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout theme={theme} toggleTheme={toggleTheme}>
      <header className="dashboard-header">
        <div>
          <h1>Savings Communities</h1>
          <p className="text-sub">Join a group and start your savings journey with others.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/groups/create')}>
          <Plus size={20} /> Create New Group
        </button>
      </header>

      <div className="search-filter-bar">
        <div className="search-input-wrapper glass">
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            placeholder="Search communities by name or focus..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="groups-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
        {loading ? (
          <div className="flex-center" style={{ gridColumn: '1/-1', padding: '4rem' }}>
            <div className="typing-indicator">Loading groups...</div>
          </div>
        ) : filteredGroups.length > 0 ? filteredGroups.map(group => (
          <div key={group.id} className="glass card flex-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="flex-between">
              <div className="badge">
                {group.type === 'public' ? <Globe size={14} /> : <Shield size={14} />}
                {group.type || 'Community'}
              </div>
              <div className="flex gap-1" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <Users size={16} /> {group.members || 0} Members
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '0.5rem' }}>{group.name}</h3>
              <p className="text-sub" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                Circle focusing on <span style={{ color: 'var(--primary-dark)', fontWeight: '600' }}>{group.focus || 'P2P Savings'}</span> within the system.
              </p>
            </div>

            <div className="flex gap-2" style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
              <div style={{ flex: 1 }}>
                <p className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Entry Min.</p>
                <p style={{ fontWeight: '700', fontSize: '1.1rem' }}>{group.entry || '10,000'} XAF</p>
              </div>
              <div style={{ flex: 1 }}>
                <p className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</p>
                <div className={`status-pill ${group.status === 'Open' ? 'status-pending' : 'status-paid'}`}>
                   {userMemberships.has(group.id) ? 'Member' : group.status || 'Active'}
                </div>
              </div>
            </div>

            <button 
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => handleJoinGroup(group)}
            >
              {userMemberships.has(group.id) ? 'View Dashboard' : 'Join Group'} <ArrowRight size={18} />
            </button>
          </div>
        )) : (
          <div className="glass card flex-center" style={{ gridColumn: '1/-1', padding: '5rem', flexDirection: 'column', gap: '1rem' }}>
             <Users size={48} color="var(--text-muted)" />
             <h3>No groups found</h3>
             <p className="text-muted">Try adjusting your search query or create a new community.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default GroupsPage;
