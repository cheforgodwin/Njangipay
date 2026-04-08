import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Users, 
  Globe, 
  Shield, 
  ArrowRight
} from 'lucide-react';
import { collection, query, onSnapshot, orderBy, where, addDoc, serverTimestamp, doc, runTransaction, increment, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import MainLayout from './MainLayout';
import './Dashboard.css';

const GroupsPage = ({ theme, toggleTheme }) => {
  const { currentUser, getUserDisplayName } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [groups, setGroups] = useState([]);
  const [userMemberships, setUserMemberships] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    focus: '',
    entry: '',
    type: 'public',
    description: '',
    frequency: 'Monthly',
    meetingDay: 'Last Sunday'
  });
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);

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

  // 3. Handle auto-join from invite link
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const joinId = params.get('join');
    if (joinId && groups.length > 0 && currentUser) {
      const groupToJoin = groups.find(g => g.id === joinId);
      if (groupToJoin && !userMemberships.has(joinId)) {
        // Automatically scroll to the group or trigger join
        const element = document.getElementById(`group-${joinId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('highlight-card');
          setTimeout(() => element.classList.remove('highlight-card'), 3000);
        }
      }
    }
  }, [location, groups, currentUser, userMemberships]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    
    try {
      const docRef = await addDoc(collection(db, "groups"), {
        ...newGroup,
        admin_id: currentUser.uid,
        members: 1,
        status: 'Active',
        createdAt: serverTimestamp()
      });
      
      // Also join the group as an admin
      await addDoc(collection(db, "members"), {
        user_id: currentUser.uid,
        userName: getUserDisplayName(),
        group_id: docRef.id,
        groupName: newGroup.name,
        joined_at: serverTimestamp(),
        aiRiskScore: 1.0, 
        totalContributed: 0,
        status: "active",
        role: "admin"
      });

      setShowCreateModal(false);
      setNewGroup({ name: '', type: 'public', focus: 'P2P Savings', entry: '10,000', description: '', frequency: 'Monthly', meetingDay: 'Last Sunday' });
      alert("Community circle created successfully!");
      navigate(`/group/${docRef.id}`);
    } catch (error) {
      console.error("Create group error:", error);
      alert("Failed to create group.");
    }
  };

  const handleJoinGroup = async (group) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (userMemberships.has(group.id)) {
      navigate(`/group/${group.id}`);
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const groupRef = doc(db, "groups", group.id);
        const groupSnap = await transaction.get(groupRef);
        
        if (!groupSnap.exists()) throw new Error("Group doesn't exist anymore.");
        
        // 1. Add membership
        const memRef = doc(collection(db, "members"));
        transaction.set(memRef, {
          user_id: currentUser.uid,
          userName: getUserDisplayName(),
          group_id: group.id,
          groupName: group.name,
          joined_at: serverTimestamp(),
          aiRiskScore: 0.95,
          totalContributed: 0,
          status: "active",
          role: "member"
        });

        // 2. Increment member count
        transaction.update(groupRef, {
          members: increment(1)
        });
      });

      alert(`Successfully joined ${group.name}!`);
    } catch (error) {
      console.error("Join group error:", error);
      alert("Failed to join group. Please try again.");
    }
  };

  const handleViewMembers = async (group) => {
    setSelectedGroup(group);
    try {
      const memQuery = query(collection(db, "members"), where("group_id", "==", group.id));
      const snapshot = await getDocs(memQuery);
      const members = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGroupMembers(members);
      setShowMembersModal(true);
    } catch (error) {
      console.error("Error fetching members:", error);
      alert("Failed to load members.");
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
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={20} /> Create New Group
        </button>
      </header>
      
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="glass modal-content">
            <h2>Create New Community</h2>
            <form onSubmit={handleCreateGroup} style={{ marginTop: '20px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Group Name</label>
                <input 
                  type="text" 
                  value={newGroup.name || ''} 
                  onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                  required 
                  placeholder="e.g. Douala Savvy Savers"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Savings Focus</label>
                <input 
                  type="text" 
                  value={newGroup.focus} 
                  onChange={(e) => setNewGroup({...newGroup, focus: e.target.value})}
                  placeholder="e.g. Real Estate, Business Capital"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}
                />
              </div>
              <div className="grid gap-1 grid-2" style={{ marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Frequency</label>
                  <select 
                    value={newGroup.frequency}
                    onChange={(e) => setNewGroup({...newGroup, frequency: e.target.value})}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Bi-Weekly">Bi-Weekly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Custom">Custom Days</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Meeting Day</label>
                  <input 
                    type="text" 
                    value={newGroup.meetingDay} 
                    onChange={(e) => setNewGroup({...newGroup, meetingDay: e.target.value})}
                    placeholder="e.g. Last Sunday, Every 15th"
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}
                  />
                </div>
              </div>
              <div className="grid gap-1 grid-2" style={{ marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Min Entry (XAF)</label>
                  <input 
                    type="text" 
                    value={newGroup.entry} 
                    onChange={(e) => setNewGroup({...newGroup, entry: e.target.value})}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Type</label>
                  <select 
                    value={newGroup.type}
                    onChange={(e) => setNewGroup({...newGroup, type: e.target.value})}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private (Invite Only)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Launch Group</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMembersModal && selectedGroup && (
        <div className="modal-overlay">
          <div className="glass modal-content" style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
            <h2>Members of {selectedGroup.name}</h2>
            <div style={{ marginTop: '20px' }}>
              {groupMembers.length > 0 ? (
                <div className="members-list">
                  {groupMembers.map(member => (
                    <div key={member.id} className="member-item" style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '12px', 
                      border: '1px solid var(--glass-border)', 
                      borderRadius: '8px', 
                      marginBottom: '8px',
                      background: 'var(--glass-bg)'
                    }}>
                      <div>
                        <strong>{member.userName}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Role: {member.role} • Joined: {member.joined_at?.toDate ? member.joined_at.toDate().toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Contributed: {member.totalContributed || 0} XAF
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No members found in this group.</p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
              <button onClick={() => setShowMembersModal(false)} className="btn-secondary" style={{ flex: 1 }}>Close</button>
            </div>
          </div>
        </div>
      )}

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

      <div className="groups-grid">
        {loading ? (
          <div className="flex-center" style={{ gridColumn: '1/-1', padding: '4rem' }}>
            <div className="typing-indicator">Loading groups...</div>
          </div>
        ) : filteredGroups.length > 0 ? filteredGroups.map(group => (
          <div 
            key={group.id} 
            id={`group-${group.id}`}
            className={`glass card flex-column ${new URLSearchParams(location.search).get('join') === group.id ? 'highlight-card' : ''}`}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
          >
            <div className="flex-between">
              <div className="badge">
                {group.type === 'public' ? <Globe size={14} /> : <Shield size={14} />}
                {group.type || 'Community'}
              </div>
              <div 
                className="flex gap-1" 
                style={{ color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer' }}
                onClick={() => handleViewMembers(group)}
              >
                <Users size={16} /> {group.members || 0} Members
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '0.5rem' }}>{group.name}</h3>
              <p className="text-sub" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                {group.frequency || 'Monthly'} cycle • {group.meetingDay || 'Last Sunday'} • {group.focus || 'P2P Savings'}
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
