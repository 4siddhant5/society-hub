import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Alert } from 'react-native';

// Initialize with the time the app started, so we ignore old historical alerts
let lastSeenTimestamp = Date.now();

export const listenToSOSAlerts = (societyId) => {
  if (!societyId) return null;

  console.log("Starting local SOS listener for society:", societyId);
  
  const q = query(
    collection(db, "sosAlerts"), 
    where("societyId", "==", societyId)
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const alert = change.doc.data();
        // Trigger alert only if it's genuinely new (timestamp exists and is greater than initial app start)
        if (alert.timestamp && alert.timestamp > lastSeenTimestamp) {
          const typeLabel = alert.type === 'custom' ? (alert.customType || 'Other') : alert.type.charAt(0).toUpperCase() + alert.type.slice(1);
          
          Alert.alert(
            "🚨 Emergency Alert",
            `${typeLabel} in Flat ${alert.flat}`
          );
          
          // Move the pointer forward to avoid duplicate alerts if state re-triggers
          if (alert.timestamp > lastSeenTimestamp) {
            lastSeenTimestamp = alert.timestamp;
          }
        }
      }
    });
  }, (error) => {
    console.error("Local notification service error:", error);
  });

  return unsubscribe;
};
