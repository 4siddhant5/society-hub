import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { getUserDocument } from '../services/userService';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      setLoading(true);

      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeProfile = onSnapshot(
          userRef,
          (snapshot) => {
            if (snapshot.exists()) {
              setCurrentUser({
                uid: firebaseUser.uid,
                ...snapshot.data(),
                email: snapshot.data()?.email || firebaseUser.email || '',
                name: snapshot.data()?.name || firebaseUser.displayName || '',
                phoneNumber: snapshot.data()?.phoneNumber || firebaseUser.phoneNumber || '',
              });
            } else {
              setCurrentUser((prev) => {
                if (prev?.uid === firebaseUser.uid && prev?.role) {
                  return prev;
                }

                return {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  name: firebaseUser.displayName || '',
                  phoneNumber: firebaseUser.phoneNumber || '',
                };
              });
            }
            setLoading(false);
          },
          (error) => {
            console.error('Error listening to user profile:', error);
            setCurrentUser((prev) => {
              if (prev?.uid === firebaseUser.uid && prev?.role) {
                return prev;
              }

              return {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                name: firebaseUser.displayName || '',
                phoneNumber: firebaseUser.phoneNumber || '',
              };
            });
            setLoading(false);
          }
        );
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
      unsubscribe();
    };
  }, []);

  const refreshUser = useCallback(async () => {
    const firebaseUser = auth.currentUser;

    if (!firebaseUser) {
      setCurrentUser(null);
      return null;
    }

    setLoading(true);

    try {
      const userDoc = await getUserDocument(firebaseUser.uid);
      if (userDoc) {
        const nextUser = {
          uid: firebaseUser.uid,
          ...userDoc,
          email: userDoc.email || firebaseUser.email || '',
          name: userDoc.name || firebaseUser.displayName || '',
          phoneNumber: userDoc.phoneNumber || firebaseUser.phoneNumber || '',
        };
        setCurrentUser(nextUser);
        return nextUser;
      }

      if (currentUser?.uid === firebaseUser.uid && currentUser?.role) {
        setCurrentUser(currentUser);
        return currentUser;
      }

      const fallbackUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || '',
        phoneNumber: firebaseUser.phoneNumber || '',
      };
      setCurrentUser(fallbackUser);
      return fallbackUser;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const user = currentUser ? { uid: currentUser.uid, email: currentUser.email } : null;
  const userData = currentUser?.role ? currentUser : null;

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, user, userData, loading, setLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
