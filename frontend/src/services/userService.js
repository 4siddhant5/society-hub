import { db } from "../config/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export const createUserDocument = async (uid, userData) => {
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      ...userData,
      createdAt: Date.now()
    });
    return true;
  } catch (error) {
    console.error("Error creating user document:", error);
    throw error;
  }
};

export const getUserDocument = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user document:", error);
    throw error;
  }
};

export const updateUserStatus = async (uid, status) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { status });
    return true;
  } catch (error) {
    console.error("Error updating user status:", error);
    throw error;
  }
};
