import { Alert } from 'react-native';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';
import { db } from '../config/firebase';
import { playSOSSound } from './sosSound';

const lastSeenBySociety = new Map();
const lastSeenIdBySociety = new Map();

const getTimestampValue = (value) => {
  if (!value) return 0;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  return Number(value) || 0;
};

const sortByTimestampDesc = (list) => list.sort((a, b) => getTimestampValue(b?.timestamp) - getTimestampValue(a?.timestamp));

const normalizeAlerts = (docs) => sortByTimestampDesc(docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));

const triggerEmergencyFeedback = async () => {
  let feedbackFailed = false;

  try {
    await playSOSSound();
  } catch (error) {
    feedbackFailed = true;
    console.warn('[SOS] Sound playback failed:', error);
  }

  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    feedbackFailed = true;
    console.warn('[SOS] Haptics failed:', error);
  }

  if (feedbackFailed) {
    Alert.alert('Emergency Alert', 'An SOS alert was received. Audio or haptic feedback may be unavailable on this device.');
  }
};

export const listenToSOS = (societyId, callback) => {
  if (!societyId || typeof callback !== 'function') {
    return () => {};
  }

  if (!lastSeenBySociety.has(societyId)) {
    lastSeenBySociety.set(societyId, Date.now());
    lastSeenIdBySociety.set(societyId, null);
  }

  let activeSOS = [];
  let allSOS = [];

  const emitUpdate = () => {
    const latest = activeSOS[0] || null;
    callback(latest, allSOS, activeSOS);
  };

  const processFeedback = () => {
    if (!activeSOS.length) {
      return;
    }

    const latest = activeSOS[0];
    const latestTimestamp = getTimestampValue(latest?.timestamp);
    const lastSeenTimestamp = lastSeenBySociety.get(societyId) || 0;
    const lastSeenId = lastSeenIdBySociety.get(societyId);

    if (!latestTimestamp || latestTimestamp < lastSeenTimestamp) {
      return;
    }

    if (latestTimestamp === lastSeenTimestamp && latest?.id === lastSeenId) {
      return;
    }

    lastSeenBySociety.set(societyId, latestTimestamp);
    lastSeenIdBySociety.set(societyId, latest?.id || null);
    triggerEmergencyFeedback();
  };

  const applyActiveSnapshot = (snapshot) => {
    activeSOS = normalizeAlerts(snapshot.docs);
    console.log('ACTIVE SOS:', activeSOS);
    emitUpdate();
    processFeedback();
  };

  const applyAllSnapshot = (snapshot) => {
    allSOS = normalizeAlerts(snapshot.docs);
    console.log('ALL SOS:', allSOS);
    emitUpdate();
  };

  const activeQuery = query(
    collection(db, 'sosAlerts'),
    where('societyId', '==', societyId),
    where('status', '==', 'active'),
    orderBy('timestamp', 'desc')
  );

  const allQuery = query(
    collection(db, 'sosAlerts'),
    where('societyId', '==', societyId),
    orderBy('timestamp', 'desc')
  );

  let unsubActive = onSnapshot(
    activeQuery,
    applyActiveSnapshot,
    (error) => {
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        unsubActive();
        const activeFallbackQuery = query(
          collection(db, 'sosAlerts'),
          where('societyId', '==', societyId),
          where('status', '==', 'active')
        );
        unsubActive = onSnapshot(
          activeFallbackQuery,
          applyActiveSnapshot,
          (fallbackError) => console.error('[SOS] Active fallback listener error:', fallbackError)
        );
        return;
      }

      console.error('[SOS] Active listener error:', error);
    }
  );

  let unsubAll = onSnapshot(
    allQuery,
    applyAllSnapshot,
    (error) => {
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        unsubAll();
        const allFallbackQuery = query(
          collection(db, 'sosAlerts'),
          where('societyId', '==', societyId)
        );
        unsubAll = onSnapshot(
          allFallbackQuery,
          applyAllSnapshot,
          (fallbackError) => console.error('[SOS] History fallback listener error:', fallbackError)
        );
        return;
      }

      console.error('[SOS] History listener error:', error);
    }
  );

  return () => {
    unsubActive();
    unsubAll();
  };
};
