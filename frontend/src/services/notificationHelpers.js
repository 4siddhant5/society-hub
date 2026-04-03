import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

/**
 * Push a structured notification to the `notifications` Firestore collection.
 *
 * Supported types: "ISSUE_CREATED" | "ISSUE_UPDATED" | "BROADCAST" | "ANNOUNCEMENT" | "POLL"
 * targetRole: "admin" | "resident" | "all"
 * userId: optional — if set, only that specific user sees the notification
 */
export const pushNotification = async ({
  societyId,
  type,
  title,
  message,
  targetRole = 'all',
  userId = null,
}) => {
  try {
    const payload = {
      societyId,
      type,
      title,
      message,
      targetRole,
      timestamp: Date.now(),
      read: false,
    };
    if (userId) payload.userId = userId;

    await addDoc(collection(db, 'notifications'), payload);
  } catch (e) {
    console.error('pushNotification error:', e);
  }
};
