import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  sendEmailVerification
} from 'firebase/auth';
import { db, auth, googleProvider } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const normalizeUserIdentifier = (identifier) => {
    const trimVal = (identifier || '').toString().trim();
    if (!trimVal) return '';

    if (trimVal.includes('@')) {
      return trimVal.toLowerCase();
    }

    const sanitized = trimVal
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '.')
      .replace(/\.+/g, '.')
      .replace(/^\.|\.$/g, '');

    return sanitized ? `${sanitized}@local.njangipay` : '';
  };

  const normalizeCameroonPhone = (rawPhone) => {
    if (!rawPhone || !rawPhone.toString().trim()) return '';
    let digits = rawPhone.toString().replace(/[^0-9+]/g, '');

    if (digits.startsWith('+')) {
      digits = digits.slice(1);
    }

    if (digits.startsWith('237')) {
      digits = digits.slice(3);
    } else if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }

    // Cameroon mobile numbers are 9 digits and start with 6.
    if (digits.length !== 9 || !digits.startsWith('6')) {
      throw new Error('Invalid Cameroon phone number. Use MTN/Orange format like 6XXXXXXXX.');
    }

    // Optional check for MTN/Orange prefix ranges
    const prefix = Number(digits.slice(0, 2));
    const validRanges = [65,66,67,68,69,70,71,72,73,74,75,76,77,78,79];
    if (!validRanges.includes(prefix)) {
      throw new Error('Phone must be a valid Cameroon MTN/Orange mobile number.');
    }

    return `+237${digits}`;
  };

  const signup = async (usernameOrEmail, password, phoneNumber = '', extraData = {}) => {
    const email = normalizeUserIdentifier(usernameOrEmail);
    let normalizedPhone = '';

    if (phoneNumber) {
      normalizedPhone = normalizeCameroonPhone(phoneNumber);
    }

    const res = await createUserWithEmailAndPassword(auth, email, password);
    
    // Send email verification for "real email" security
    try {
      await sendEmailVerification(res.user);
    } catch (e) {
      console.warn("Could not send verification email:", e);
    }

    // Initialize Firestore user doc
    await setDoc(doc(db, "users", res.user.uid), {
      uid: res.user.uid,
      username: extraData.username || usernameOrEmail,
      email,
      phoneNumber: normalizedPhone,
      role: email === 'cheforgodwin01@gmail.com' ? 'super-admin' : (
        extraData.accountType === 'community' ? 'community' : 
        extraData.accountType === 'bank' ? 'bank-admin' :
        extraData.accountType === 'admin' ? 'admin' :
        extraData.accountType === 'community-admin' ? 'community-admin' :
        extraData.accountType === 'leader' ? 'leader' :
        extraData.accountType === 'auditor' ? 'auditor' : 'user'
      ),
      emailVerified: false,
      createdAt: new Date().toISOString(),
      ...extraData
    });
    return res;
  };

  const login = (usernameOrEmail, password) => {
    const email = normalizeUserIdentifier(usernameOrEmail);
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    setUserData(null);
    return signOut(auth);
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const googleSignIn = async () => {
    const res = await signInWithPopup(auth, googleProvider);
    const userDoc = await getDoc(doc(db, "users", res.user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, "users", res.user.uid), {
        uid: res.user.uid,
        email: res.user.email,
        role: 'user',
        emailVerified: true, // Google accounts are pre-verified
        createdAt: new Date().toISOString()
      });
    }
    return res;
  };
  function setupRecaptcha(containerId) {
    if (!auth) return;
    return new RecaptchaVerifier(auth, containerId, {
      'size': 'invisible',
      'callback': (response) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });
  }

  function phoneSignIn(phoneNumber, appVerifier) {
    const normalized = normalizeCameroonPhone(phoneNumber);
    return signInWithPhoneNumber(auth, normalized, appVerifier);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const docRef = doc(db, "users", user.uid);
          // Use a promise with a timeout for the initial fetch to avoid hanging the app if Firebase is struggling to sync
          const fetchWithTimeout = (promise, ms) => {
             let timeoutId;
             const timeoutPromise = new Promise((_, reject) => {
               timeoutId = setTimeout(() => reject(new Error('Fetch timeout')), ms);
             });
             return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
          };

          const docSnap = await fetchWithTimeout(getDoc(docRef), 5000);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
             console.warn("User document not found in Firestore for UID:", user.uid);
          }
        } catch (err) {
          console.error("Error fetching user data/timeout:", err);
          // Don't set userData, but let the app proceed with basic auth info
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const getUserDisplayName = () => {
    if (!currentUser) return 'Guest';
    if (userData?.username) return userData.username;
    if (userData?.fullName) return userData.fullName;
    if (currentUser.displayName) return currentUser.displayName;
    if (currentUser.email) return currentUser.email.split('@')[0];
    if (currentUser.phoneNumber) return currentUser.phoneNumber;
    return 'User';
  };

  const value = {
    currentUser,
    userData,
    isAdmin: userData?.role === 'admin' || userData?.role === 'super-admin' || userData?.role === 'community-admin',
    isSuperAdmin: userData?.role === 'super-admin' || currentUser?.email === 'cheforgodwin01@gmail.com',
    isBankAdmin: userData?.role === 'bank-admin' || userData?.role === 'super-admin',
    isLeader: userData?.role === 'leader' || userData?.role === 'admin' || userData?.role === 'community-admin' || userData?.role === 'super-admin',
    isAuditor: userData?.role === 'auditor' || userData?.role === 'admin' || userData?.role === 'community-admin' || userData?.role === 'super-admin',
    isCommunity: userData?.role === 'community',
    isCommunityAdmin: userData?.role === 'community-admin',
    signup,
    login,
    logout,
    resetPassword,
    googleSignIn,
    setupRecaptcha,
    phoneSignIn,
    getUserDisplayName,
    loading,
    // Helper function to check if user is leader of a specific group
    isGroupLeader: async (groupId) => {
      if (!currentUser) return false;
      if (userData?.role === 'super-admin' || userData?.role === 'admin' || userData?.role === 'community-admin') return true;
      
      try {
        const { doc, getDoc, collection, query, where } = await import('firebase/firestore');
        const membersRef = collection(db, "members");
        const q = query(membersRef, where("user_id", "==", currentUser.uid), where("group_id", "==", groupId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const memberDoc = querySnapshot.docs[0];
          const memberData = memberDoc.data();
          return memberData.role === 'leader' || memberData.role === 'admin';
        }
        return false;
      } catch (error) {
        console.error("Error checking group leader status:", error);
        return false;
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
