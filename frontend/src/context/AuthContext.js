import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserDocument } from '../services/userService';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        // Fetch user metadata from Firestore
        const userDoc = await getUserDocument(firebaseUser.uid);
        if (userDoc) {
          setCurrentUser({ uid: firebaseUser.uid, ...userDoc });
        } else {
          // If no doc exists yet, just set basic auth info
          setCurrentUser({ uid: firebaseUser.uid, email: firebaseUser.email });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const user = currentUser ? { uid: currentUser.uid, email: currentUser.email } : null;
  const userData = currentUser?.role ? currentUser : null;

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, user, userData, loading, setLoading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
