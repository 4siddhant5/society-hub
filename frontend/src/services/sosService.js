import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { pushNotification } from './notificationHelpers';

export const sendSOS = async (data) => {
  try {
    const normalizedType = typeof data?.type === 'string' ? data.type.toUpperCase() : 'SOS';
    const payload = {
      ...data,
      type: normalizedType,
      userId: data?.userId || data?.senderId || '',
      flat: data?.flat || data?.flatNumber || '',
      flatNumber: data?.flatNumber || data?.flat || '',
      status: 'active',
      timestamp: serverTimestamp(),
    };

    await addDoc(collection(db, 'sosAlerts'), payload);

    const typeLabel = normalizedType === 'CUSTOM'
      ? data?.customType || 'EMERGENCY'
      : normalizedType;

    let notificationFailed = false;
    try {
      await pushNotification({
        societyId: data?.societyId,
        type: 'sos',
        title: `SOS: ${typeLabel}`,
        message: data?.message || `Emergency reported by ${data?.senderName || 'Resident'}`,
      });
    } catch (error) {
      notificationFailed = true;
      console.warn('SOS push notification failed:', error);
    }

    return { notificationFailed };
  } catch (error) {
    console.error('Error sending SOS alert:', error);
    throw error;
  }
};
