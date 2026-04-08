// Utility to fix user roles - run this once to fix existing users
import { doc, updateDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export const fixCommunityRepRoles = async () => {
  try {
    // Find all users with accountType 'community' but role 'admin'
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('accountType', '==', 'community'), where('role', '==', 'admin'));
    const querySnapshot = await getDocs(q);
    
    const updates = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      console.log('Fixing role for user:', userData.username || userData.email);
      
      updates.push(
        updateDoc(doc.ref, { role: 'community' })
      );
    });
    
    await Promise.all(updates);
    console.log(`Updated ${updates.length} community representative roles`);
    
    return updates.length;
  } catch (error) {
    console.error('Error fixing user roles:', error);
    return 0;
  }
};

// Run this function in the browser console:
// fixCommunityRepRoles()
