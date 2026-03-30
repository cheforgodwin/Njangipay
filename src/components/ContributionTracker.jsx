import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Table, 
  PieChart, 
  CheckCircle,
  Clock,
  UserPlus,
  Copy,
  Shuffle,
  FileText,
  AlertCircle,
  Save,
  MessageSquare
} from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import MainLayout from './MainLayout';
import CommunityChat from './CommunityChat';
import { processContribution } from '../utils/transactionHelpers';
import './Dashboard.css';

const ContributionTracker = ({ theme, toggleTheme }) => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { currentUser, getUserDisplayName } = useAuth();
  
  const [contributions, setContributions] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger', 'analytics', 'members', 'chat'
  const [groupDetails, setGroupDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('member'); // Derived from members state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isEditingRules, setIsEditingRules] = useState(false);
  const [rulesText, setRulesText] = useState('');
  const [structuredRules, setStructuredRules] = useState([]); // Array of { rule: '', fine: 0 }

  const handleInvite = () => {
    setShowInviteModal(true);
  };

  const handleManualAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail) return;
    
    try {
      const { addDoc, collection, serverTimestamp, query, where, getDocs } = await import('firebase/firestore');
      
      // 1. Check if user exists (simplification: find by email in users collection)
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", newMemberEmail));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        alert("User with this email not found. They must sign up first.");
        return;
      }
      
      const targetUser = querySnapshot.docs[0].data();
      const targetUserId = querySnapshot.docs[0].id; // The user ID

      // 2. Add to members collection
      await addDoc(collection(db, "members"), {
        user_id: targetUserId,
        userName: targetUser.userName || newMemberEmail.split('@')[0],
        group_id: groupId,
        groupName: groupDetails?.name || 'Group',
        joined_at: serverTimestamp(),
        aiRiskScore: 0.95,
        totalContributed: 0,
        status: "active",
        role: "member"
      });

      alert(`Success! ${newMemberEmail} added to the group.`);
      setShowAddMemberModal(false);
      setNewMemberEmail('');
    } catch (error) {
      console.error("Manual add error:", error);
      alert("Failed to add member.");
    }
  };

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/groups?join=${groupId}`;
    navigator.clipboard.writeText(inviteLink);
    alert("Invite link copied to clipboard! Share it with your community members.");
    setShowInviteModal(false);
  };

  const handleMarkAsPaid = async (transactionItem) => {
    try {
      const { doc, runTransaction, increment } = await import('firebase/firestore');
      
      await runTransaction(db, async (transaction) => {
        const txnRef = doc(db, "transactions", transactionItem.id);
        const groupRef = doc(db, "groups", groupId);
        
        // Update transaction status
        transaction.update(txnRef, { status: 'Paid' });
        
        // Atomically update group total fund
        transaction.update(groupRef, { 
          totalFund: increment(transactionItem.amount || 0) 
        });
      });

      alert("Contribution verified and group fund updated!");
    } catch (error) {
      console.error("Approval error:", error);
      alert("Failed to approve contribution.");
    }
  };

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const memberRef = doc(db, "members", memberId);
      await updateDoc(memberRef, { role: newRole });
      alert(`Role updated to ${newRole}`);
    } catch (error) {
      console.error("Role update error:", error);
      alert("Failed to update role.");
    }
  };

  const handleContribute = async () => {
    const amountStr = prompt('Enter contribution amount (XAF):');
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) { alert('Invalid amount.'); return; }

    const result = await processContribution(currentUser.uid, groupId, amount, 'contribution');
    if (result.success) {
      alert(`Success! ${amount.toLocaleString()} XAF contribution recorded.`);
    } else {
      alert(`Failed: ${result.error}`);
    }
  };

  const handleShuffleRotation = async () => {
    if (userRole !== 'admin') return;
    if (members.length < 2) {
      alert("Need at least 2 members to shuffle.");
      return;
    }

    if (!window.confirm("Shuffle official payout order? This will randomly reassign turn numbers.")) return;

    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      const shuffled = [...members].sort(() => Math.random() - 0.5);
      const newOrder = shuffled.map(m => m.user_id);
      
      await updateDoc(doc(db, "groups", groupId), {
        rotationOrder: newOrder,
        lastShuffled: new Date().toISOString()
      });
      alert("Rotation order updated and saved to secure ledger!");
    } catch (err) {
      console.error("Shuffle error:", err);
      alert("Failed to update rotation.");
    }
  };

  const handleSaveRules = async () => {
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      await updateDoc(doc(db, "groups", groupId), {
        rules: rulesText,
        structuredRules: structuredRules
      });
      setIsEditingRules(false);
      alert("Community Bylaws updated.");
    } catch (err) {
      console.error("Rules save error:", err);
      alert("Failed to save rules.");
    }
  };

  const addRuleField = () => {
    setStructuredRules([...structuredRules, { rule: '', fine: 0 }]);
  };

  const removeRuleField = (index) => {
    setStructuredRules(structuredRules.filter((_, i) => i !== index));
  };

  const updateRuleField = (index, field, value) => {
    const updated = [...structuredRules];
    updated[index][field] = value;
    setStructuredRules(updated);
  };

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);

    // 1. Fetch group details directly by ID
    const groupDocRef = doc(db, "groups", groupId);
    const unsubscribeGroup = onSnapshot(groupDocRef, (snapshot) => {
      if (snapshot.exists()) {
        setGroupDetails({ id: snapshot.id, ...snapshot.data() });
      } else {
        console.warn("Group not found by ID:", groupId);
        setGroupDetails(null); // Clear group details if not found
        setLoading(false); // Stop loading if group not found
      }
    });

    // 2. Fetch contributions for this group
    const q = query(
      collection(db, "transactions"), 
      where("group_id", "==", groupId)
    );
    
    const unsubscribeTrans = onSnapshot(q, (snapshot) => {
      const transData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort client-side to avoid index requirement
      transData.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setContributions(transData);
      setLoading(false);
    }, (error) => {
      console.warn("Transactions query failed (unindexed?):", error);
      // Fallback mock data
      setContributions([
        { id: '1', userName: 'Alice', amount: 50000, status: 'Paid', timestamp: new Date() },
        { id: '2', userName: 'Bob', amount: 50000, status: 'Pending', timestamp: new Date() },
      ]);
      setLoading(false);
    });

    // 4. Fetch all members of this group
    const membersQuery = query(
      collection(db, "members"), 
      where("group_id", "==", groupId)
    );
    const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
      const membersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort client-side
      membersData.sort((a, b) => (b.joined_at?.seconds || 0) - (a.joined_at?.seconds || 0));
      setMembers(membersData);
    }, (error) => {
      console.warn("Members fetch failed:", error);
    });

    return () => {
      unsubscribeGroup();
      unsubscribeTrans();
      unsubscribeMembers();
    };
  }, [groupId, currentUser]);

  useEffect(() => {
    if (members.length > 0 && currentUser) {
      const me = members.find(m => m.user_id === currentUser.uid);
      if (me) setUserRole(me.role || 'member');
    }
    if (groupDetails?.rules) {
      setRulesText(groupDetails.rules);
    }
    if (groupDetails?.structuredRules) {
      setStructuredRules(groupDetails.structuredRules);
    }
  }, [members, currentUser, groupDetails]);

  if (loading && !groupDetails) {
    return (
      <MainLayout theme={theme} toggleTheme={toggleTheme}>
        <div className="flex-center" style={{ height: '70vh', flexDirection: 'column', gap: '1rem' }}>
          <div className="spinner"></div>
          <p className="text-muted">Loading Workspace...</p>
        </div>
      </MainLayout>
    );
  }

  if (!loading && !groupDetails) {
    return (
      <MainLayout theme={theme} toggleTheme={toggleTheme}>
        <div className="flex-center" style={{ height: '70vh', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '2rem', background: 'var(--accent-light)', borderRadius: '50%', marginBottom: '1rem' }}>
             <X size={48} color="var(--primary-dark)" />
          </div>
          <h3>Group Namespace Empty</h3>
          <p className="text-muted" style={{ maxWidth: '350px', textAlign: 'center' }}>The community you are looking for does not exist or you don't have access permissions.</p>
          <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/groups')}>Discover Communities</button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout theme={theme} toggleTheme={toggleTheme}>
      <header className="dashboard-header">
        <div className="flex gap-1" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <button 
            className="btn-secondary" 
            style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px' }}
            onClick={() => navigate('/groups')}
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1>{groupDetails?.name || 'Group Workspace'}</h1>
            <p className="text-sub">
              {members.length} Members • Manage contributions and communicate with your community.
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          {userRole === 'admin' && (
            <button className="btn-secondary" onClick={() => setShowAddMemberModal(true)}>
              + Add Member
            </button>
          )}
          <button className="btn-primary" onClick={handleInvite}>
            <UserPlus size={18} /> Invite
          </button>
        </div>
      </header>

      {showAddMemberModal && (
        <div className="modal-overlay">
          <div className="glass modal-content" style={{ maxWidth: '450px' }}>
            <h2>Manual Member Insertion</h2>
            <p className="text-sub" style={{ marginBottom: '1.5rem' }}>Directly add a registered NjangiPay user to your community.</p>
            <form onSubmit={handleManualAddMember}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Member Email</label>
                <input 
                  type="email" 
                  className="auth-input" 
                  style={{ width: '100%' }}
                  placeholder="name@example.com"
                  value={newMemberEmail}
                  onChange={e => setNewMemberEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-1">
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Add to Roster</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInviteModal && (
        <div className="modal-overlay">
          <div className="glass modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="stat-icon" style={{ margin: '0 auto 1.5rem', background: '#e8f8f5', color: 'var(--primary-green)' }}>
              <UserPlus size={32} />
            </div>
            <h2>Invite Members</h2>
            <p className="text-sub" style={{ marginBottom: '2rem' }}>
              Share this secure link with people you want to join <strong>{groupDetails?.name}</strong>.
            </p>
            
            <div className="flex gap-1" style={{ background: 'rgba(0,0,0,0.05)', padding: '12px', borderRadius: '10px', marginBottom: '2rem', fontSize: '0.85rem', wordBreak: 'break-all' }}>
              <code>{window.location.origin}/groups?join={groupId}</code>
            </div>

            <div className="flex gap-1">
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowInviteModal(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={copyInviteLink}>
                <Copy size={16} /> Copy Link
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="workspace-tabs flex gap-1" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <button 
          className={`nav-item ${activeTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveTab('ledger')}
          style={{ border: 'none', background: 'none', cursor: 'pointer' }}
        >
          <Table size={18} /> Transaction Ledger
        </button>
        <button 
          className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
          style={{ border: 'none', background: 'none', cursor: 'pointer' }}
        >
          <PieChart size={18} /> Member Analytics
        </button>
        <button 
          className={`nav-item ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
          style={{ border: 'none', background: 'none', cursor: 'pointer' }}
        >
          <UserPlus size={18} /> Members Roster
        </button>
        <button 
          className={`nav-item ${activeTab === 'rotation' ? 'active' : ''}`}
          onClick={() => setActiveTab('rotation')}
          style={{ border: 'none', background: 'none', cursor: 'pointer' }}
        >
          <Shuffle size={18} /> Payout Rotation
        </button>
        <button 
          className={`nav-item ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
          style={{ border: 'none', background: 'none', cursor: 'pointer' }}
        >
          <FileText size={18} /> Rules & Bylaws
        </button>
      </div>

      <div className="workspace-content-grid">
        <div className="left-panel">
          {activeTab === 'ledger' ? (
            <div className="glass card" style={{ padding: '0' }}>
              <div className="flex-between" style={{ padding: '2rem' }}>
                <h3 style={{ margin: 0 }}>Recent Contributions</h3>
                <div className="flex gap-1">
                  <div className="badge"><CheckCircle size={14} /> 85% Paid</div>
                  <div className="badge" style={{ background: '#fef5e7', color: '#f39c12' }}><Clock size={14} /> 15% Pending</div>
                  {userRole === 'member' && (
                    <button
                      className="btn-primary"
                      style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                      onClick={handleContribute}
                    >
                      + Contribute
                    </button>
                  )}
                </div>
              </div>
              
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributions.length > 0 ? contributions.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div className="flex gap-1" style={{ alignItems: 'center' }}>
                            <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                              {(item.userName || 'U').substring(0, 1).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: '600' }}>{item.userName || 'Member'}</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: '700' }}>{item.amount?.toLocaleString()} XAF</td>
                        <td>
                          <span className={`status-pill ${item.status === 'Paid' ? 'status-paid' : 'status-pending'}`}>
                            {item.status || 'Pending'}
                          </span>
                        </td>
                        <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                          <div className="flex-between">
                            {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleDateString() : 'Recent'}
                            {userRole === 'treasurer' && item.status === 'Pending' && (
                              <button 
                                onClick={() => handleMarkAsPaid(item)}
                                className="btn-primary" 
                                style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                              >
                                Approve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                          No contributions recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'members' ? (
            <div className="glass card" style={{ padding: '0' }}>
              <div className="flex-between" style={{ padding: '2rem', borderBottom: '1px solid var(--glass-border)' }}>
                <h3 style={{ margin: 0 }}>Community Roster ({members.length})</h3>
                <div className="badge">{members.filter(m => m.status === 'active').length} Active Now</div>
              </div>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(member => (
                      <tr key={member.id}>
                        <td>
                          <div className="flex gap-1" style={{ alignItems: 'center' }}>
                            <div className="avatar" style={{ width: '36px', height: '36px', background: 'var(--accent-light)', color: 'var(--primary-dark)' }}>
                              {(member.userName || 'U').substring(0, 1).toUpperCase()}
                            </div>
                            <div>
                               <p style={{ fontWeight: '700', margin: 0 }}>{member.userName || 'Verified User'}</p>
                               <p className="text-muted" style={{ fontSize: '0.75rem', margin: 0 }}>NP-{member.user_id?.substring(0,8).toUpperCase()}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          {userRole === 'admin' && member.user_id !== currentUser.uid ? (
                            <select 
                              value={member.role || 'member'} 
                              onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                              style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--glass-border)', fontSize: '0.8rem', background: 'white' }}
                            >
                              <option value="member">Member</option>
                              <option value="treasurer">Treasurer</option>
                              <option value="president">President</option>
                              <option value="moderator">Moderator</option>
                            </select>
                          ) : (
                            <span style={{ fontSize: '0.85rem', fontWeight: '600', textTransform: 'capitalize' }}>{member.role || 'Member'}</span>
                          )}
                        </td>
                        <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                          {member.joined_at?.toDate ? member.joined_at.toDate().toLocaleDateString() : 'Recent'}
                        </td>
                        <td>
                          <span className={`status-pill ${member.status === 'active' ? 'status-paid' : 'status-pending'}`} style={{ fontSize: '0.7rem' }}>
                            {member.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="analytics-view flex-column" style={{ gap: '2rem' }}>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div className="glass card">
                  <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>Total Group Fund</p>
                  <h2 style={{ color: 'var(--primary-green)' }}>
                    {contributions.reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString()} XAF
                  </h2>
                </div>
                <div className="glass card">
                  <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>Punctuality Rate</p>
                  <h2 style={{ color: '#f39c12' }}>
                    {contributions.length > 0 
                      ? Math.round((contributions.filter(c => c.status === 'Paid').length / contributions.length) * 100) 
                      : 0}%
                  </h2>
                </div>
                <div className="glass card">
                  <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>Total Transactions</p>
                  <h2>{contributions.length}</h2>
                </div>
              </div>

              <div className="glass card">
                <h3 style={{ marginBottom: '1.5rem' }}>Contribution Distribution</h3>
                <div className="distribution-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {Object.entries(
                    contributions.reduce((acc, curr) => {
                      acc[curr.userName || 'Unknown'] = (acc[curr.userName || 'Unknown'] || 0) + (curr.amount || 0);
                      return acc;
                    }, {})
                  )
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, amount], idx) => (
                    <div key={idx} className="flex-between" style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)' }}>
                      <span style={{ fontWeight: 500 }}>{name}</span>
                      <span style={{ fontWeight: 700 }}>{amount.toLocaleString()} XAF</span>
                    </div>
                  ))}
                  {contributions.length === 0 && <p className="text-muted flex-center" style={{ padding: '2rem' }}>No data to aggregate.</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="right-panel">
          {activeTab === 'rotation' ? (
            <div className="glass card flex-column" style={{ gap: '1.5rem' }}>
              <div className="flex-between">
                <h3 style={{ margin: 0 }}>Rotation Schedule</h3>
                {userRole === 'admin' && (
                  <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={handleShuffleRotation}>
                    <Shuffle size={14} /> Shuffle
                  </button>
                )}
              </div>
              <div className="rotation-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(groupDetails?.rotationOrder || members.map(m => m.user_id)).map((uid, index) => {
                  const member = members.find(m => m.user_id === uid);
                  if (!member) return null;
                  return (
                    <div key={uid} className="flex-between" style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--glass-border)' }}>
                       <div className="flex gap-1" style={{ alignItems: 'center' }}>
                         <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-green)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700' }}>
                           {index + 1}
                         </div>
                         <span style={{ fontWeight: 600 }}>{member.userName}</span>
                       </div>
                       <span className="text-muted" style={{ fontSize: '0.8rem' }}>Turn #{index + 1}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: '1rem', background: '#e8f8f5', borderRadius: '10px', display: 'flex', gap: '10px' }}>
                <AlertCircle size={18} color="var(--primary-green)" />
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--primary-dark)' }}>
                  This order determine payouts. {userRole === 'admin' ? 'Shuffling updates this for everyone.' : 'Contact admin to change sequence.'}
                </p>
              </div>
            </div>
          ) : activeTab === 'rules' ? (
            <div className="glass card">
               <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0 }}>Community Bylaws</h3>
                  {userRole === 'admin' && !isEditingRules && (
                    <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setIsEditingRules(true)}>Edit Rules</button>
                  )}
                  {isEditingRules && (
                    <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={handleSaveRules}>
                      <Save size={14} /> Save
                    </button>
                  )}
               </div>
               {isEditingRules ? (
                 <div className="flex-column" style={{ gap: '1.5rem' }}>
                   <div>
                     <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>General Bylaws & Description</label>
                     <textarea 
                       className="auth-input" 
                       style={{ width: '100%', height: '150px', padding: '1rem', background: 'white', color: 'black' }}
                       value={rulesText}
                       onChange={e => setRulesText(e.target.value)}
                       placeholder="Enter group context, mission, etc..."
                     />
                   </div>

                   <div>
                     <label className="form-label" style={{ display: 'block', marginBottom: '1rem' }}>Protocols & Penalties (Fines)</label>
                     {structuredRules.map((sr, idx) => (
                       <div key={idx} className="flex gap-1" style={{ marginBottom: '1rem', alignItems: 'center' }}>
                         <input 
                           type="text" 
                           placeholder="Rule / Violation (e.g. Late Meeting Arrival)" 
                           className="auth-input" 
                           style={{ flex: 3, padding: '10px' }}
                           value={sr.rule}
                           onChange={(e) => updateRuleField(idx, 'rule', e.target.value)}
                         />
                         <input 
                           type="number" 
                           placeholder="Fine (XAF)" 
                           className="auth-input" 
                           style={{ flex: 1, padding: '10px' }}
                           value={sr.fine}
                           onChange={(e) => updateRuleField(idx, 'fine', parseInt(e.target.value) || 0)}
                         />
                         <button className="btn-secondary" style={{ padding: '10px', color: '#e74c3c' }} onClick={() => removeRuleField(idx)}>×</button>
                       </div>
                     ))}
                     <button className="btn-secondary" style={{ width: '100%', border: '1px dashed var(--glass-border)', background: 'transparent' }} onClick={addRuleField}>
                       + Add Penalty Protocol
                     </button>
                   </div>
                 </div>
               ) : (
                 <div className="rules-display flex-column" style={{ gap: '2rem' }}>
                   <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'var(--text-main)' }}>
                     {groupDetails?.rules || "No official bylaws have been posted for this community yet."}
                   </div>
                   
                   {structuredRules.length > 0 && (
                     <div className="fines-board" style={{ marginTop: '1rem' }}>
                        <h4 style={{ marginBottom: '1rem', color: 'var(--primary-dark)' }}>Penalty Scale</h4>
                        <div className="flex-column" style={{ gap: '10px' }}>
                          {structuredRules.map((sr, idx) => (
                            <div key={idx} className="flex-between" style={{ padding: '0.75rem 1rem', background: 'rgba(231, 76, 60, 0.05)', borderRadius: '8px', borderLeft: '4px solid #e74c3c' }}>
                               <span style={{ fontWeight: 600 }}>{sr.rule}</span>
                               <span style={{ fontWeight: 800, color: '#e74c3c' }}>{sr.fine?.toLocaleString()} XAF Fine</span>
                            </div>
                          ))}
                        </div>
                     </div>
                   )}
                 </div>
               )}
            </div>
          ) : (
            <CommunityChat groupId={groupId} />
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ContributionTracker;
