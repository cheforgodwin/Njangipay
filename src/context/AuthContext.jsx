import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { db, auth, googleProvider } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const signup = async (email, password, phoneNumber = '') => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    // Initialize Firestore user doc
    await setDoc(doc(db, "users", res.user.uid), {
      email,
      phoneNumber,
      role: 'user',
      createdAt: new Date().toISOString()
    });
    return res;
  };

  const login = (email, password) => {
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
        email: res.user.email,
        role: 'user',
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
    return signInWithPhoneNumber(auth, phoneNumber, appVerifier);
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
    if (currentUser.displayName) return currentUser.displayName;
    if (currentUser.email) return currentUser.email.split('@')[0];
    if (currentUser.phoneNumber) return currentUser.phoneNumber;
    return 'User';
  };

  const value = {
    currentUser,
    userData,
    isAdmin: userData?.role === 'admin' || userData?.role === 'super-admin',
    isSuperAdmin: userData?.role === 'super-admin',
    signup,
    login,
    logout,
    resetPassword,
    googleSignIn,
    setupRecaptcha,
    phoneSignIn,
    getUserDisplayName,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
