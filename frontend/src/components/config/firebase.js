import { getApp, getApps, initializeApp } from "firebase/app";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBSHarRYSKgHEJzT-M2JD_GM5gTFHcIp2U",
  authDomain: "society-hub-dd1fa.firebaseapp.com",
  projectId: "society-hub-dd1fa",
  storageBucket: "society-hub-dd1fa.firebasestorage.app",
  messagingSenderId: "834195517958",
  appId: "1:834195517958:web:99d662b83a9e8119b84987"
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const createAuth = () => {
  if (Platform.OS === "web") {
    return getAuth(app);
  }

  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    return getAuth(app);
  }
};

export const auth = createAuth();
export const db = getFirestore(app);
