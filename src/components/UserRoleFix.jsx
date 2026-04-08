import React, { useState } from 'react';
import { doc, updateDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

const UserRoleFix = () => {
  const { currentUser, userData } = useAuth();
  const [fixing, setFixing] = useState(false);
  const [message, setMessage] = useState('');
  const [targetUser, setTargetUser] = useState('dewise vision');

  const fixSpecificUserRole = async () => {
    if (!currentUser || (userData?.role !== 'super-admin' && userData?.email !== 'cheforgodwin01@gmail.com')) {
      setMessage('Only super admin can fix roles');
      return;
    }

    setFixing(true);
    setMessage('');

    try {
      // Find the specific user by username or email
      const usersRef = collection(db, 'users');
      
      // Try to find by username first
      let q = query(usersRef, where('username', '==', targetUser));
      let querySnapshot = await getDocs(q);
      
      // If not found, try by email
      if (querySnapshot.empty) {
        q = query(usersRef, where('email', '==', targetUser));
        querySnapshot = await getDocs(q);
      }
      
      if (querySnapshot.empty) {
        setMessage(`User "${targetUser}" not found`);
        return;
      }
      
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      console.log('Found user:', userData);
      console.log('Current role:', userData.role);
      console.log('Account type:', userData.accountType);
      
      // Update the role based on account type
      let newRole = 'user'; // default
      if (userData.accountType === 'community') {
        newRole = 'community';
      } else if (userData.accountType === 'bank') {
        newRole = 'bank-admin';
      } else if (userData.accountType === 'admin') {
        newRole = 'admin';
      } else if (userData.accountType === 'community-admin') {
        newRole = 'community-admin';
      } else if (userData.accountType === 'leader') {
        newRole = 'leader';
      } else if (userData.accountType === 'auditor') {
        newRole = 'auditor';
      }
      
      await updateDoc(userDoc.ref, { role: newRole });
      
      setMessage(`Successfully updated "${userData.username || userData.email}" role from "${userData.role}" to "${newRole}"`);
      
      // Refresh the page to see changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error fixing user role:', error);
      setMessage('Error fixing role: ' + error.message);
    } finally {
      setFixing(false);
    }
  };

  // Only show for super admin
  if (!currentUser || (userData?.role !== 'super-admin' && userData?.email !== 'cheforgodwin01@gmail.com')) {
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
      backdropFilter: 'blur(10px)',
      maxWidth: '300px'
    }}>
      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-green)' }}>Fix User Role</h4>
      <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem' }}>
        Fix user role based on account type
      </p>
      
      <input
        type="text"
        value={targetUser}
        onChange={(e) => setTargetUser(e.target.value)}
        placeholder="Username or email"
        style={{
          width: '100%',
          padding: '0.5rem',
          borderRadius: '6px',
          border: '1px solid var(--glass-border)',
          background: 'var(--glass-bg)',
          color: 'var(--text-main)',
          fontSize: '0.85rem',
          marginBottom: '1rem'
        }}
      />
      
      <button 
        onClick={fixSpecificUserRole}
        disabled={fixing}
        style={{
          background: 'var(--primary-green)',
          color: 'white',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '6px',
          cursor: fixing ? 'not-allowed' : 'pointer',
          fontSize: '0.85rem',
          width: '100%'
        }}
      >
        {fixing ? 'Fixing...' : 'Fix User Role'}
      </button>
      
      {message && (
        <p style={{ 
          margin: '0.5rem 0 0 0', 
          fontSize: '0.8rem', 
          color: message.includes('Error') ? 'red' : 'var(--primary-green)',
          wordBreak: 'break-word'
        }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default UserRoleFix;
