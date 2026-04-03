import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app, db } from "../config/firebase";
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { Alert, Platform } from "react-native";

// Only initialize messaging if supported (e.g. web or properly linked app)
let messaging;
try {
  messaging = getMessaging(app);
} catch (error) {
  console.warn("Firebase messaging not supported in this environment");
}

export const requestNotificationPermission = async () => {
  if (!messaging) return false;
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      return true;
    } else {
      console.log('Unable to get permission to notify.');
      return false;
    }
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
};

export const getFCMToken = async () => {
  if (!messaging) return null;
  try {
    // You typically need to pass the VAPID key in a real web app config
    const currentToken = await getToken(messaging, {
      // vapidKey: 'YOUR_PUBLIC_VAPID_KEY_HERE'
    });
    if (currentToken) {
      return currentToken;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
    return null;
  }
};

export const saveTokenToFirestore = async (uid, societyId) => {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    const token = await getFCMToken();
    if (token) {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, { 
        fcmToken: token,
        societyId: societyId 
      });
      console.log("Token saved to firestore.");
    }
  } catch (error) {
    console.error("Error saving token:", error);
  }
};

export const listenToForegroundMessages = (navigation) => {
  if (!messaging) return () => {};
  
  return onMessage(messaging, (payload) => {
    console.log('Message received. ', payload);
    const { title, body } = payload.notification || {};
    // On web, you could use standard alert or toast
    if (Platform.OS !== 'web') {
      Alert.alert(title || "New Notification", body, [
        { text: "OK", onPress: () => console.log("Notification dismissed") }
      ]);
    } else {
       // Simple web alert for now
       // window.alert(`${title}\n${body}`);
       // Actually toast would be better, but console logging is safe fallback
       console.log(`[Foreground Notification] ${title}: ${body}`);
    }
  });
};
