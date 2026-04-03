importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBSHarRYSKgHEJzT-M2JD_GM5gTFHcIp2U",
  projectId: "society-hub-dd1fa",
  messagingSenderId: "834195517958",
  appId: "1:834195517958:web:99d662b83a9e8119b84987"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message', payload);
  const notificationTitle = payload.notification?.title || 'Society Hub';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon.png'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
