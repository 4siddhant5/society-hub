const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * 1. CHAT MESSAGE
 * Prompt: notify all users except sender "New message from {senderName}"
 */
exports.onChatMessage = functions.firestore
  .document("chats/{societyId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const { societyId } = context.params;
    const message = snap.data();
    
    const senderId = message.senderId;
    const senderName = message.senderName || "Someone";
    
    // Fetch users in this society
    const usersSnap = await db.collection("users")
      .where("societyId", "==", societyId)
      .get();
      
    const tokens = [];
    usersSnap.forEach(doc => {
      const data = doc.data();
      if (doc.id !== senderId && data.fcmToken) {
        tokens.push(data.fcmToken);
      }
    });
    
    if (tokens.length === 0) return null;
    
    const payload = {
      notification: {
        title: "New Chat Message",
        body: `New message from ${senderName}`,
      },
      data: { type: "chat", societyId }
    };
    
    return messaging.sendToDevice(tokens, payload);
  });

/**
 * 2. ISSUE CREATED
 * Prompt: notify admin "New issue reported"
 */
exports.onIssueCreated = functions.firestore
  .document("issues/{issueId}")
  .onCreate(async (snap, context) => {
    const issue = snap.data();
    const societyId = issue.societyId;
    
    if (!societyId) return null;
    
    // Find admins for this society
    const adminsSnap = await db.collection("users")
      .where("societyId", "==", societyId)
      .where("role", "==", "admin")
      .get();
      
    const tokens = [];
    adminsSnap.forEach(doc => {
      if (doc.data().fcmToken) tokens.push(doc.data().fcmToken);
    });
    
    if (tokens.length === 0) return null;
    
    const payload = {
      notification: {
        title: "New Issue Reported",
        body: `A new issue: "${issue.title}" has been reported.`,
      },
      data: { type: "issue", issueId: context.params.issueId }
    };
    
    return messaging.sendToDevice(tokens, payload);
  });

/**
 * 3. ISSUE STATUS UPDATED
 * Prompt: notify resident "Your issue is now {status}"
 */
exports.onIssueUpdated = functions.firestore
  .document("issues/{issueId}")
  .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const prevValue = change.before.data();
    
    if (newValue.status === prevValue.status) return null;
    
    const creatorId = newValue.createdBy; // assuming user id of creator
    if (!creatorId) return null;
    
    const userSnap = await db.collection("users").doc(creatorId).get();
    if (!userSnap.exists) return null;
    
    const fcmToken = userSnap.data().fcmToken;
    if (!fcmToken) return null;
    
    const payload = {
      notification: {
        title: "Issue Status Update",
        body: `Your issue is now ${newValue.status}`,
      },
      data: { type: "issue", issueId: context.params.issueId }
    };
    
    return messaging.sendToDevice([fcmToken], payload);
  });

/**
 * 4. ANNOUNCEMENT CREATED
 * Prompt: notify all users "New announcement posted"
 */
exports.onAnnouncementCreated = functions.firestore
  .document("announcements/{announcementId}")
  .onCreate(async (snap, context) => {
    const ann = snap.data();
    const societyId = ann.societyId;
    if (!societyId) return null;
    
    const usersSnap = await db.collection("users")
      .where("societyId", "==", societyId)
      .get();
      
    const tokens = [];
    usersSnap.forEach(doc => {
      if (doc.data().fcmToken) tokens.push(doc.data().fcmToken);
    });
    
    if (tokens.length === 0) return null;
    
    const payload = {
      notification: {
        title: "New Announcement",
        body: "New announcement posted",
      },
      data: { type: "announcement" }
    };
    
    return messaging.sendToDevice(tokens, payload);
  });

/**
 * 5. POLL CREATED
 * Prompt: notify all users "New poll available"
 */
exports.onPollCreated = functions.firestore
  .document("polls/{pollId}")
  .onCreate(async (snap, context) => {
    const poll = snap.data();
    const societyId = poll.societyId;
    if (!societyId) return null;
    
    const usersSnap = await db.collection("users")
      .where("societyId", "==", societyId)
      .get();
      
    const tokens = [];
    usersSnap.forEach(doc => {
      if (doc.data().fcmToken) tokens.push(doc.data().fcmToken);
    });
    
    if (tokens.length === 0) return null;
    
    const payload = {
      notification: {
        title: "New Poll",
        body: "New poll available",
      },
      data: { type: "poll" }
    };
    
    return messaging.sendToDevice(tokens, payload);
  });

/**
 * 6. SOS ALERT
 * Prompt: notify ALL users "🚨 Emergency Alert!"
 */
exports.onSOSAlert = functions.firestore
  .document("sosAlerts/{alertId}") // assuming this collection
  .onCreate(async (snap, context) => {
    const alert = snap.data();
    const societyId = alert.societyId;
    
    let query = db.collection("users");
    if (societyId) {
       query = query.where("societyId", "==", societyId);
    }
    
    const usersSnap = await query.get();
      
    const tokens = [];
    usersSnap.forEach(doc => {
      if (doc.data().fcmToken) tokens.push(doc.data().fcmToken);
    });
    
    if (tokens.length === 0) return null;
    
    const payload = {
      notification: {
        title: "🚨 Emergency Alert!",
        body: alert.message || "An SOS alert was triggered in your society.",
      },
      data: { type: "sos", alertId: context.params.alertId }
    };
    
    // Use high priority for SOS
    const options = { priority: "high", timeToLive: 60 * 60 * 24 };
    
    return messaging.sendToDevice(tokens, payload, options);
  });
