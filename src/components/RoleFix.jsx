import React, { useState } from 'react';
import { doc, updateDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

const RoleFix = () => {
  const { currentUser, userData } = useAuth();
  const [fixing, setFixing] = useState(false);
  const [message, setMessage] = useState('');

  const fixCommunityRepRoles = async () => {
    if (!currentUser || userData?.role !== 'super-admin') {
      setMessage('Only super admin can fix roles');
      return;
    }

    setFixing(true);
    setMessage('');

    try {
      // Find all users with accountType 'community' but role 'admin'
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('accountType', '==', 'community'), where('role', '==', 'admin'));
      const querySnapshot = await getDocs(q);
      
      const updates = [];
      const fixedUsers = [];
      
      querySnapshot.forEach((docSnapshot) => {
        const userData = docSnapshot.data();
        console.log('Fixing role for user:', userData.username || userData.email);
        fixedUsers.push(userData.username || userData.email);
        
        updates.push(
          updateDoc(docSnapshot.ref, { role: 'community' })
        );
      });
      
      await Promise.all(updates);
      setMessage(`Successfully updated ${updates.length} community representative roles: ${fixedUsers.join(', ')}`);
      
      // Refresh the page to see changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error fixing user roles:', error);
      setMessage('Error fixing roles: ' + error.message);
    } finally {
      setFixing(false);
    }
  };

  // Only show for super admin
  if (!currentUser || userData?.role !== 'super-admin') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'var(--glass-bg)',
      border: '1px solid var(--glass-border)',
      borderRadius: '12px',
      padding: '1rem',
      zIndex: 1000,
      backdropFilter: 'blur(10px)'
    }}>
      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-green)' }}>Role Fix Tool</h4>
      <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem' }}>
        Fix community representatives incorrectly assigned 'admin' role
      </p>
      <button 
        onClick={fixCommunityRepRoles}
        disabled={fixing}
        style={{
          background: 'var(--primary-green)',
          color: 'white',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '6px',
          cursor: fixing ? 'not-allowed' : 'pointer',
          fontSize: '0.85rem'
        }}
      >
        {fixing ? 'Fixing...' : 'Fix Community Rep Roles'}
      </button>
      {message && (
        <p style={{ 
          margin: '0.5rem 0 0 0', 
          fontSize: '0.8rem', 
          color: message.includes('Error') ? 'red' : 'var(--primary-green)' 
        }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default RoleFix;
