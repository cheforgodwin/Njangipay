import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  Wallet, 
  Calendar, 
  TrendingUp, 
  Settings, 
  Bell, 
  FileText, 
  PieChart, 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  MessageSquare, 
  UserPlus, 
  Award, 
  Target, 
  Activity,
  BarChart3,
  CreditCard,
  Home,
  DollarSign,
  UserCheck,
  LogOut,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  runTransaction, 
  getDocs,
  increment 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import MainLayout from './MainLayout';
import '../styles/GroupDashboard.css';
import './Dashboard.css';

const GroupDashboard = ({ theme, toggleTheme }) => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, getUserDisplayName } = useAuth();
  
  // State Management
  const [groupDetails, setGroupDetails] = useState(null);
  const [members, setMembers] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [rotation, setRotation] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [meetings, setMeetings] = useState([]);
  
  // Determine active tab from URL path
  const getPathTab = () => {
    const path = location.pathname;
    if (path.includes('/members')) return 'members';
    if (path.includes('/contributions')) return 'contributions';
    if (path.includes('/rotation')) return 'rotation';
    if (path.includes('/loans')) return 'loans';
    if (path.includes('/meetings')) return 'meetings';
    if (path.includes('/audit')) return 'audit';
    if (path.includes('/reports')) return 'reports';
    return 'overview';
  };
  
  const [activeTab, setActiveTab] = useState(getPathTab());
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('member');
  const [showModal, setShowModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form States
  const [newMember, setNewMember] = useState({ email: '', role: 'member' });
  const [newContribution, setNewContribution] = useState({ amount: '', memberId: '', type: 'regular' });
  const [newLoan, setNewLoan] = useState({ amount: '', purpose: '', duration: '3 months', memberId: '' });
  const [newMeeting, setNewMeeting] = useState({ date: '', time: '', agenda: '', location: '' });
  const [newRule, setNewRule] = useState({ rule: '', fine: 0 });
  const [rotationOrder, setRotationOrder] = useState([]);

  // Fetch Group Data
  useEffect(() => {
    if (!groupId) return;

    const unsubscribeGroup = onSnapshot(doc(db, "groups", groupId), (doc) => {
      if (doc.exists()) {
        setGroupDetails({ id: doc.id, ...doc.data() });
      }
    });

    const unsubscribeMembers = onSnapshot(
      query(collection(db, "members"), where("group_id", "==", groupId)),
      (snapshot) => {
        const membersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMembers(membersData);
        
        // Set user role
        const currentUserMember = membersData.find(m => m.user_id === currentUser?.uid);
        setUserRole(currentUserMember?.role || 'member');
      }
    );

    const unsubscribeContributions = onSnapshot(
      query(collection(db, "contributions"), where("group_id", "==", groupId), orderBy("timestamp", "desc"), limit(50)),
      (snapshot) => {
        setContributions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );

    const unsubscribeLoans = onSnapshot(
      query(collection(db, "loans"), where("group_id", "==", groupId), orderBy("createdAt", "desc")),
      (snapshot) => {
        setLoans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );

    const unsubscribeRotation = onSnapshot(
      query(collection(db, "rotation"), where("group_id", "==", groupId), orderBy("order")),
      (snapshot) => {
        setRotation(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );

    const unsubscribeAudit = onSnapshot(
      query(collection(db, "audit_logs"), where("group_id", "==", groupId), orderBy("timestamp", "desc"), limit(100)),
      (snapshot) => {
        setAuditLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );

    const unsubscribeNotifications = onSnapshot(
      query(collection(db, "notifications"), where("group_id", "==", groupId), orderBy("timestamp", "desc"), limit(20)),
      (snapshot) => {
        setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );

    const unsubscribeMeetings = onSnapshot(
      query(collection(db, "meetings"), where("group_id", "==", groupId), orderBy("date")),
      (snapshot) => {
        setMeetings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );

    setLoading(false);

    return () => {
      unsubscribeGroup();
      unsubscribeMembers();
      unsubscribeContributions();
      unsubscribeLoans();
      unsubscribeRotation();
      unsubscribeAudit();
      unsubscribeNotifications();
      unsubscribeMeetings();
    };
  }, [groupId, currentUser]);

  // Handle tab changes and update URL
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const basePath = `/group/${groupId}`;
    const tabPath = tab === 'overview' ? basePath : `${basePath}/${tab}`;
    navigate(tabPath);
  };

  // Update active tab when URL changes
  useEffect(() => {
    setActiveTab(getPathTab());
  }, [location.pathname]);
  const calculateStats = () => {
    const totalContributions = contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
    const activeMembers = members.filter(m => m.status === 'active').length;
    const currentCycle = Math.floor(totalContributions / (groupDetails?.contributionAmount || 10000));
    const nextBeneficiary = rotation.find(r => r.status === 'pending');
    const totalLoans = loans.reduce((sum, l) => sum + (l.amount || 0), 0);
    const outstandingLoans = loans.filter(l => l.status === 'active').reduce((sum, l) => sum + (l.remainingAmount || l.amount || 0), 0);

    return {
      totalContributions,
      activeMembers,
      currentCycle,
      nextBeneficiary,
      totalLoans,
      outstandingLoans,
      availableBalance: totalContributions - outstandingLoans
    };
  };

  const stats = calculateStats();

  // Action Handlers
  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await runTransaction(db, async (transaction) => {
        // Check if user exists
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", newMember.email));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          throw new Error("User with this email not found. They must sign up first.");
        }
        
        const targetUser = querySnapshot.docs[0].data();
        const targetUserId = querySnapshot.docs[0].id;

        // Add member
        const memberRef = doc(collection(db, "members"));
        transaction.set(memberRef, {
          user_id: targetUserId,
          userName: targetUser.username || targetUser.fullName || newMember.email.split('@')[0],
          group_id: groupId,
          groupName: groupDetails?.name || 'Group',
          joined_at: serverTimestamp(),
          role: newMember.role,
          status: "active",
          totalContributed: 0,
          aiRiskScore: 0.95
        });

        // Update group member count
        const groupRef = doc(db, "groups", groupId);
        transaction.update(groupRef, {
          members: increment(1)
        });

        // Add to rotation
        const rotationRef = doc(collection(db, "rotation"));
        transaction.set(rotationRef, {
          group_id: groupId,
          member_id: targetUserId,
          memberName: targetUser.username || targetUser.fullName || newMember.email.split('@')[0],
          order: rotation.length + 1,
          status: 'pending',
          createdAt: serverTimestamp()
        });

        // Log audit
        const auditRef = doc(collection(db, "audit_logs"));
        transaction.set(auditRef, {
          group_id: groupId,
          action: 'member_added',
          actor: getUserDisplayName(),
          target: targetUser.username || targetUser.fullName,
          details: `Added ${newMember.role} to group`,
          timestamp: serverTimestamp()
        });
      });

      setShowModal(null);
      setNewMember({ email: '', role: 'member' });
      alert('Member added successfully!');
    } catch (error) {
      console.error("Error adding member:", error);
      alert(error.message);
    }
  };

  const handleRecordContribution = async (e) => {
    e.preventDefault();
    try {
      await runTransaction(db, async (transaction) => {
        // Add contribution record
        const contributionRef = doc(collection(db, "contributions"));
        transaction.set(contributionRef, {
          group_id: groupId,
          member_id: newContribution.memberId,
          memberName: members.find(m => m.user_id === newContribution.memberId)?.userName,
          amount: parseFloat(newContribution.amount),
          type: newContribution.type,
          timestamp: serverTimestamp(),
          status: 'confirmed'
        });

        // Update member's total contributed
        const memberRef = doc(db, "members", members.find(m => m.user_id === newContribution.memberId).id);
        transaction.update(memberRef, {
          totalContributed: increment(parseFloat(newContribution.amount))
        });

        // Log audit
        const auditRef = doc(collection(db, "audit_logs"));
        transaction.set(auditRef, {
          group_id: groupId,
          action: 'contribution_recorded',
          actor: getUserDisplayName(),
          target: members.find(m => m.user_id === newContribution.memberId)?.userName,
          details: `Recorded contribution of ${newContribution.amount} XAF`,
          amount: parseFloat(newContribution.amount),
          timestamp: serverTimestamp()
        });
      });

      setShowModal(null);
      setNewContribution({ amount: '', memberId: '', type: 'regular' });
      alert('Contribution recorded successfully!');
    } catch (error) {
      console.error("Error recording contribution:", error);
      alert('Failed to record contribution');
    }
  };

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "loans"), {
        group_id: groupId,
        borrower_id: newLoan.memberId,
        borrowerName: members.find(m => m.user_id === newLoan.memberId)?.userName,
        amount: parseFloat(newLoan.amount),
        purpose: newLoan.purpose,
        duration: newLoan.duration,
        status: 'pending',
        createdAt: serverTimestamp(),
        remainingAmount: parseFloat(newLoan.amount)
      });

      // Log audit
      await addDoc(collection(db, "audit_logs"), {
        group_id: groupId,
        action: 'loan_requested',
        actor: getUserDisplayName(),
        target: members.find(m => m.user_id === newLoan.memberId)?.userName,
        details: `Loan request of ${newLoan.amount} XAF for ${newLoan.purpose}`,
        amount: parseFloat(newLoan.amount),
        timestamp: serverTimestamp()
      });

      setShowModal(null);
      setNewLoan({ amount: '', purpose: '', duration: '3 months', memberId: '' });
      alert('Loan request submitted successfully!');
    } catch (error) {
      console.error("Error creating loan:", error);
      alert('Failed to create loan request');
    }
  };

  const handleScheduleMeeting = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "meetings"), {
        group_id: groupId,
        date: new Date(newMeeting.date),
        time: newMeeting.time,
        agenda: newMeeting.agenda,
        location: newMeeting.location,
        status: 'scheduled',
        createdAt: serverTimestamp(),
        attendees: []
      });

      // Log audit
      await addDoc(collection(db, "audit_logs"), {
        group_id: groupId,
        action: 'meeting_scheduled',
        actor: getUserDisplayName(),
        details: `Meeting scheduled for ${newMeeting.date} at ${newMeeting.time}`,
        timestamp: serverTimestamp()
      });

      setShowModal(null);
      setNewMeeting({ date: '', time: '', agenda: '', location: '' });
      alert('Meeting scheduled successfully!');
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      alert('Failed to schedule meeting');
    }
  };

  const handleProcessPayout = async (rotationId) => {
    try {
      await runTransaction(db, async (transaction) => {
        const rotationRef = doc(db, "rotation", rotationId);
        const rotationSnap = await transaction.get(rotationRef);
        
        if (!rotationSnap.exists()) throw new Error("Rotation record not found");
        
        const rotationData = rotationSnap.data();
        
        // Update rotation status
        transaction.update(rotationRef, {
          status: 'completed',
          paidAt: serverTimestamp()
        });

        // Log audit
        const auditRef = doc(collection(db, "audit_logs"));
        transaction.set(auditRef, {
          group_id: groupId,
          action: 'payout_processed',
          actor: getUserDisplayName(),
          target: rotationData.memberName,
          details: `Payout processed for ${rotationData.memberName}`,
          amount: stats.totalContributions / rotation.length,
          timestamp: serverTimestamp()
        });
      });

      alert('Payout processed successfully!');
    } catch (error) {
      console.error("Error processing payout:", error);
      alert('Failed to process payout');
    }
  };

  const filteredMembers = members.filter(member => 
    member.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <MainLayout theme={theme} toggleTheme={toggleTheme}>
        <div className="flex-center" style={{ height: '60vh' }}>
          <div className="spinner"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout theme={theme} toggleTheme={toggleTheme}>
      {/* Header */}
      <header className="dashboard-header">
        <div className="flex gap-1" style={{ alignItems: 'center' }}>
          <Users size={32} color="var(--primary-green)" />
          <div>
            <h1>{groupDetails?.name || 'Group Dashboard'}</h1>
            <p className="text-sub">
              {groupDetails?.focus} • {members.length} Members • Cycle {stats.currentCycle}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          {(userRole === 'admin' || userRole === 'leader') && (
            <>
              <button className="btn-secondary" onClick={() => setShowModal('addMember')}>
                <UserPlus size={18} /> Add Member
              </button>
              <button className="btn-secondary" onClick={() => setShowModal('contribution')}>
                <DollarSign size={18} /> Record Contribution
              </button>
              <button className="btn-secondary" onClick={() => setShowModal('meeting')}>
                <Calendar size={18} /> Schedule Meeting
              </button>
            </>
          )}
          <button className="btn-primary" onClick={() => setShowModal('loan')}>
            <CreditCard size={18} /> Request Loan
          </button>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-4" style={{ marginBottom: '2rem', gap: '1.5rem' }}>
        <div className="glass card">
          <div className="stat-icon" style={{ background: 'var(--primary-green)15', color: 'var(--primary-green)', marginBottom: '1.5rem' }}>
            <Wallet size={24} />
          </div>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>Total Savings</p>
          <h2 style={{ fontSize: 'clamp(1.2rem, 5vw, 1.8rem)', margin: 0 }}>
            {stats.totalContributions.toLocaleString()} XAF
          </h2>
        </div>
        <div className="glass card">
          <div className="stat-icon" style={{ background: '#3498db15', color: '#3498db', marginBottom: '1.5rem' }}>
            <Users size={24} />
          </div>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>Active Members</p>
          <h2 style={{ fontSize: 'clamp(1.2rem, 5vw, 1.8rem)', margin: 0 }}>{stats.activeMembers}</h2>
        </div>
        <div className="glass card">
          <div className="stat-icon" style={{ background: '#9b59b615', color: '#9b59b6', marginBottom: '1.5rem' }}>
            <Target size={24} />
          </div>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>Current Cycle</p>
          <h2 style={{ fontSize: 'clamp(1.2rem, 5vw, 1.8rem)', margin: 0 }}>{stats.currentCycle}</h2>
        </div>
        <div className="glass card">
          <div className="stat-icon" style={{ background: '#e74c3c15', color: '#e74c3c', marginBottom: '1.5rem' }}>
            <Award size={24} />
          </div>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>Next Beneficiary</p>
          <h2 style={{ fontSize: 'clamp(1rem, 4vw, 1.4rem)', margin: 0 }}>
            {stats.nextBeneficiary?.memberName || 'TBD'}
          </h2>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tab-navigation" style={{ marginBottom: '2rem' }}>
        {[
          { id: 'overview', label: 'Overview', icon: <Home size={18} /> },
          { id: 'members', label: 'Members', icon: <Users size={18} /> },
          { id: 'contributions', label: 'Contributions', icon: <DollarSign size={18} /> },
          { id: 'rotation', label: 'Rotation', icon: <RefreshCw size={18} /> },
          { id: 'loans', label: 'Loans', icon: <CreditCard size={18} /> },
          { id: 'meetings', label: 'Meetings', icon: <Calendar size={18} /> },
          { id: 'audit', label: 'Audit Trail', icon: <Shield size={18} /> },
          { id: 'reports', label: 'Reports', icon: <BarChart3 size={18} /> }
        ].map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-2" style={{ gap: '2rem' }}>
            <div className="glass card">
              <h3 style={{ marginBottom: '1.5rem' }}>Recent Activity</h3>
              <div className="activity-list">
                {auditLogs.slice(0, 5).map(log => (
                  <div key={log.id} className="activity-item" style={{ 
                    padding: '12px 0', 
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 500 }}>{log.action.replace('_', ' ')}</p>
                      <p className="text-muted" style={{ fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                        {log.actor} • {log.details}
                      </p>
                    </div>
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                      {log.timestamp?.toDate?.().toLocaleDateString() || 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass card">
              <h3 style={{ marginBottom: '1.5rem' }}>Notifications</h3>
              <div className="notifications-list">
                {notifications.length > 0 ? notifications.slice(0, 5).map(notification => (
                  <div key={notification.id} className="notification-item" style={{ 
                    padding: '12px', 
                    marginBottom: '8px',
                    background: 'var(--glass-bg)',
                    borderRadius: '8px',
                    borderLeft: '3px solid var(--primary-green)'
                  }}>
                    <p style={{ margin: 0, fontWeight: 500 }}>{notification.title}</p>
                    <p className="text-muted" style={{ fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                      {notification.message}
                    </p>
                  </div>
                )) : (
                  <p className="text-muted">No new notifications</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="glass card">
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h3>Group Members</h3>
              <div className="search-input-wrapper" style={{ width: '250px' }}>
                <Search size={16} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search members..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Total Contributed</th>
                    <th>Joined</th>
                    {(userRole === 'admin' || userRole === 'leader') && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map(member => (
                    <tr key={member.id}>
                      <td style={{ fontWeight: 600 }}>{member.userName}</td>
                      <td>
                        <span className={`badge ${member.role === 'admin' ? 'badge-primary' : member.role === 'leader' ? 'badge-warning' : 'badge-secondary'}`}>
                          {member.role}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${member.status === 'active' ? 'status-paid' : 'status-pending'}`}>
                          {member.status}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{member.totalContributed?.toLocaleString() || 0} XAF</td>
                      <td className="text-muted">
                        {member.joined_at?.toDate?.().toLocaleDateString() || 'N/A'}
                      </td>
                      {(userRole === 'admin' || userRole === 'leader') && (
                        <td>
                          <div className="flex gap-1">
                            <button className="btn-icon" title="Edit">
                              <Edit size={16} />
                            </button>
                            <button className="btn-icon btn-danger" title="Remove">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Contributions Tab */}
        {activeTab === 'contributions' && (
          <div className="glass card">
            <h3 style={{ marginBottom: '1.5rem' }}>Contribution History</h3>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Amount</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contributions.map(contribution => (
                    <tr key={contribution.id}>
                      <td style={{ fontWeight: 600 }}>{contribution.memberName}</td>
                      <td style={{ fontWeight: 700 }}>{contribution.amount?.toLocaleString()} XAF</td>
                      <td>
                        <span className="badge badge-secondary">{contribution.type}</span>
                      </td>
                      <td className="text-muted">
                        {contribution.timestamp?.toDate?.().toLocaleDateString() || 'N/A'}
                      </td>
                      <td>
                        <span className="status-pill status-paid">
                          <CheckCircle size={12} /> {contribution.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Rotation Tab */}
        {activeTab === 'rotation' && (
          <div className="glass card">
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h3>Payout Rotation</h3>
              {(userRole === 'admin' || userRole === 'leader') && (
                <button className="btn-secondary">
                  <RefreshCw size={18} /> Reorder
                </button>
              )}
            </div>
            <div className="rotation-list">
              {rotation.map((item, index) => (
                <div key={item.id} className="rotation-item" style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '16px',
                  marginBottom: '12px',
                  background: 'var(--glass-bg)',
                  borderRadius: '12px',
                  border: item.status === 'completed' ? '2px solid var(--primary-green)' : '1px solid var(--glass-border)'
                }}>
                  <div className="flex gap-1" style={{ alignItems: 'center' }}>
                    <div className="rotation-order" style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      background: item.status === 'completed' ? 'var(--primary-green)' : 'var(--primary-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      color: 'white'
                    }}>
                      {index + 1}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600 }}>{item.memberName}</p>
                      <p className="text-muted" style={{ fontSize: '0.85rem', margin: '2px 0 0 0' }}>
                        {item.status === 'completed' ? 'Received payout' : 'Awaiting payout'}
                      </p>
                    </div>
                  </div>
                  {item.status === 'pending' && (userRole === 'admin' || userRole === 'leader') && (
                    <button 
                      className="btn-primary"
                      onClick={() => handleProcessPayout(item.id)}
                    >
                      Process Payout
                    </button>
                  )}
                  {item.status === 'completed' && (
                    <span className="status-pill status-paid">
                      <CheckCircle size={12} /> Completed
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loans Tab */}
        {activeTab === 'loans' && (
          <div className="glass card">
            <h3 style={{ marginBottom: '1.5rem' }}>Group Loans</h3>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Borrower</th>
                    <th>Amount</th>
                    <th>Purpose</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map(loan => (
                    <tr key={loan.id}>
                      <td style={{ fontWeight: 600 }}>{loan.borrowerName}</td>
                      <td style={{ fontWeight: 700 }}>{loan.amount?.toLocaleString()} XAF</td>
                      <td>{loan.purpose}</td>
                      <td>{loan.duration}</td>
                      <td>
                        <span className={`status-pill ${loan.status === 'active' ? 'status-pending' : loan.status === 'completed' ? 'status-paid' : 'status-pending'}`}>
                          {loan.status}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {loan.remainingAmount?.toLocaleString() || loan.amount?.toLocaleString()} XAF
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Meetings Tab */}
        {activeTab === 'meetings' && (
          <div className="glass card">
            <h3 style={{ marginBottom: '1.5rem' }}>Scheduled Meetings</h3>
            <div className="meetings-list">
              {meetings.map(meeting => (
                <div key={meeting.id} className="meeting-item" style={{ 
                  padding: '16px',
                  marginBottom: '12px',
                  background: 'var(--glass-bg)',
                  borderRadius: '12px',
                  border: '1px solid var(--glass-border)'
                }}>
                  <div className="flex-between">
                    <div>
                      <p style={{ margin: 0, fontWeight: 600 }}>{meeting.agenda}</p>
                      <p className="text-muted" style={{ fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                        <Calendar size={14} /> {meeting.date?.toDate?.().toLocaleDateString()} • 
                        <Clock size={14} /> {meeting.time} • 
                        <Users size={14} /> {meeting.location}
                      </p>
                    </div>
                    <span className={`status-pill ${meeting.status === 'completed' ? 'status-paid' : 'status-pending'}`}>
                      {meeting.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Trail Tab */}
        {activeTab === 'audit' && (
          <div className="glass card">
            <h3 style={{ marginBottom: '1.5rem' }}>Audit Trail</h3>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Actor</th>
                    <th>Target</th>
                    <th>Details</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 600 }}>{log.action?.replace('_', ' ')}</td>
                      <td>{log.actor}</td>
                      <td>{log.target}</td>
                      <td className="text-muted" style={{ fontSize: '0.9rem' }}>{log.details}</td>
                      <td style={{ fontWeight: 600 }}>
                        {log.amount ? `${log.amount.toLocaleString()} XAF` : '-'}
                      </td>
                      <td className="text-muted">
                        {log.timestamp?.toDate?.().toLocaleDateString() || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="grid grid-2" style={{ gap: '2rem' }}>
            <div className="glass card">
              <h3 style={{ marginBottom: '1.5rem' }}>Financial Summary</h3>
              <div className="summary-stats">
                <div className="stat-item" style={{ marginBottom: '1rem' }}>
                  <div className="flex-between">
                    <span className="text-muted">Total Contributions:</span>
                    <span style={{ fontWeight: 700 }}>{stats.totalContributions.toLocaleString()} XAF</span>
                  </div>
                </div>
                <div className="stat-item" style={{ marginBottom: '1rem' }}>
                  <div className="flex-between">
                    <span className="text-muted">Total Loans:</span>
                    <span style={{ fontWeight: 700 }}>{stats.totalLoans.toLocaleString()} XAF</span>
                  </div>
                </div>
                <div className="stat-item" style={{ marginBottom: '1rem' }}>
                  <div className="flex-between">
                    <span className="text-muted">Outstanding Loans:</span>
                    <span style={{ fontWeight: 700 }}>{stats.outstandingLoans.toLocaleString()} XAF</span>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="flex-between">
                    <span className="text-muted">Available Balance:</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary-green)' }}>
                      {stats.availableBalance.toLocaleString()} XAF
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="glass card">
              <h3 style={{ marginBottom: '1.5rem' }}>Export Reports</h3>
              <div className="export-options">
                <button className="btn-secondary" style={{ width: '100%', marginBottom: '1rem' }}>
                  <Download size={18} /> Download Contribution Report
                </button>
                <button className="btn-secondary" style={{ width: '100%', marginBottom: '1rem' }}>
                  <Download size={18} /> Download Loan Report
                </button>
                <button className="btn-secondary" style={{ width: '100%', marginBottom: '1rem' }}>
                  <Download size={18} /> Download Audit Trail
                </button>
                <button className="btn-secondary" style={{ width: '100%' }}>
                  <Download size={18} /> Download Full Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {/* Add Member Modal */}
      {showModal === 'addMember' && (
        <div className="modal-overlay">
          <div className="glass modal-content">
            <h2>Add New Member</h2>
            <form onSubmit={handleAddMember} style={{ marginTop: '20px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Email Address</label>
                <input 
                  type="email" 
                  value={newMember.email} 
                  onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                  required 
                  placeholder="member@example.com"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Role</label>
                <select 
                  value={newMember.role}
                  onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}
                >
                  <option value="member">Member</option>
                  <option value="leader">Leader</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowModal(null)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Contribution Modal */}
      {showModal === 'contribution' && (
        <div className="modal-overlay">
          <div className="glass modal-content">
            <h2>Record Contribution</h2>
            <form onSubmit={handleRecordContribution} style={{ marginTop: '20px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Member</label>
                <select 
                  value={newContribution.memberId}
                  onChange={(e) => setNewContribution({...newContribution, memberId: e.target.value})}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}
                >
                  <option value="">Select member...</option>
                  {members.map(member => (
                    <option key={member.id} value={member.user_id}>{member.userName}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Amount (XAF)</label>
                <input 
                  type="number" 
                  value={newContribution.amount} 
                  onChange={(e) => setNewContribution({...newContribution, amount: e.target.value})}
                  required 
                  placeholder="10000"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Type</label>
                <select 
                  value={newContribution.type}
                  onChange={(e) => setNewContribution({...newContribution, type: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}
                >
                  <option value="regular">Regular</option>
                  <option value="fine">Fine</option>
                  <option value="bonus">Bonus</option>
                  <option value="penalty">Penalty</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowModal(null)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Record Contribution</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loan Request Modal */}
      {showModal === 'loan' && (
        <div className="modal-overlay">
          <div className="glass modal-content">
            <h2>Request Loan</h2>
            <form onSubmit={handleCreateLoan} style={{ marginTop: '20px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Amount (XAF)</label>
                <input 
                  type="number" 
                  value={newLoan.amount} 
                  onChange={(e) => setNewLoan({...newLoan, amount: e.target.value})}
                  required 
                  placeholder="50000"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Purpose</label>
                <textarea 
                  value={newLoan.purpose} 
                  onChange={(e) => setNewLoan({...newLoan, purpose: e.target.value})}
                  required 
                  placeholder="Describe the purpose of this loan..."
                  rows={3}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Duration</label>
                <select 
                  value={newLoan.duration}
                  onChange={(e) => setNewLoan({...newLoan, duration: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}
                >
                  <option value="1 month">1 Month</option>
                  <option value="3 months">3 Months</option>
                  <option value="6 months">6 Months</option>
                  <option value="1 year">1 Year</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowModal(null)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {showModal === 'meeting' && (
        <div className="modal-overlay">
          <div className="glass modal-content">
            <h2>Schedule Meeting</h2>
            <form onSubmit={handleScheduleMeeting} style={{ marginTop: '20px' }}>
              <div className="grid grid-2 gap-1" style={{ marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Date</label>
                  <input 
                    type="date" 
                    value={newMeeting.date} 
                    onChange={(e) => setNewMeeting({...newMeeting, date: e.target.value})}
                    required 
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Time</label>
                  <input 
                    type="time" 
                    value={newMeeting.time} 
                    onChange={(e) => setNewMeeting({...newMeeting, time: e.target.value})}
                    required 
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Agenda</label>
                <textarea 
                  value={newMeeting.agenda} 
                  onChange={(e) => setNewMeeting({...newMeeting, agenda: e.target.value})}
                  required 
                  placeholder="Meeting agenda..."
                  rows={3}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Location</label>
                <input 
                  type="text" 
                  value={newMeeting.location} 
                  onChange={(e) => setNewMeeting({...newMeeting, location: e.target.value})}
                  required 
                  placeholder="Meeting location or virtual link"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowModal(null)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Schedule Meeting</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default GroupDashboard;
