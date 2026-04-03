import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBSHarRYSKgHEJzT-M2JD_GM5gTFHcIp2U",
  authDomain: "society-hub-dd1fa.firebaseapp.com",
  projectId: "society-hub-dd1fa",
  storageBucket: "society-hub-dd1fa.firebasestorage.app",
  messagingSenderId: "834195517958",
  appId: "1:834195517958:web:99d662b83a9e8119b84987"
};

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
