import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { IoLocation } from 'react-icons/io5';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  return Number(value) || 0;
};

const formatTime = (value) => {
  const milliseconds = toMillis(value);
  if (!milliseconds) return 'Time unavailable';
  return new Date(milliseconds).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateTime = (value) => {
  const milliseconds = toMillis(value);
  if (!milliseconds) return 'Timestamp unavailable';
  return new Date(milliseconds).toLocaleString();
};

const getPriorityColor = (type) => {
  switch ((type || '').toLowerCase()) {
    case 'fire':
      return '#ef4444';
    case 'medical':
      return '#f59e0b';
    case 'security':
      return '#2563eb';
    default:
      return '#dc2626';
  }
};

const isActiveStatus = (status) => String(status || 'active').toLowerCase() === 'active';

const AlertCard = memo(({ item, expanded, onToggle, onResolve, canResolve, resolving }) => {
  const alertType = item?.type?.toUpperCase?.() || 'UNKNOWN';
  const alertLabel = item?.type === 'CUSTOM'
    ? item?.customType?.toUpperCase?.() || 'EMERGENCY'
    : alertType;
  const color = getPriorityColor(item?.type);
  const reporterName = item?.senderName || item?.userName || 'Unknown Resident';
  const message = item?.message || item?.description || 'Emergency assistance requested.';
  const flatNumber = item?.flatNumber || item?.flat || 'N/A';
  const isActive = isActiveStatus(item?.status);

  return (
    <Pressable onPress={onToggle} style={({ pressed }) => [styles.card, { borderLeftColor: color }, pressed && styles.cardPressed]}>
      <View style={styles.cardHeader}>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: `${color}18` }]}>
            <Text style={[styles.badgeText, { color }]}>{alertLabel}</Text>
          </View>
          <View style={[styles.statusBadge, isActive ? styles.statusBadgeActive : styles.statusBadgeResolved]}>
            <Text style={[styles.statusText, isActive ? styles.statusTextActive : styles.statusTextResolved]}>
              {isActive ? 'ACTIVE' : 'RESOLVED'}
            </Text>
          </View>
        </View>
        <Text style={styles.timeText}>{formatTime(item?.timestamp)}</Text>
      </View>

      <Text style={styles.messageText}>{message}</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>REPORTED BY</Text>
          <Text style={styles.metaValue}>{reporterName}</Text>
        </View>
        <View style={styles.locationBox}>
          <IoLocation size={14} color="#64748b" />
          <Text style={styles.locationValue}>Flat {flatNumber}</Text>
        </View>
      </View>

      {expanded ? (
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Alert Type</Text>
            <Text style={styles.detailValue}>{alertType}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Exact Time</Text>
            <Text style={styles.detailValue}>{formatDateTime(item?.timestamp)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{item?.location || `Flat ${flatNumber}`}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Additional Info</Text>
            <Text style={styles.detailValue}>{item?.additionalInfo || item?.notes || 'No extra info provided.'}</Text>
          </View>

          {!isActive && item?.resolvedAt ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Resolved At</Text>
              <Text style={styles.detailValue}>{formatDateTime(item?.resolvedAt)}</Text>
            </View>
          ) : null}

          {canResolve && isActive ? (
            <Pressable
              onPress={onResolve}
              disabled={resolving}
              style={({ pressed }) => [
                styles.resolveButton,
                resolving && styles.resolveButtonDisabled,
                pressed && !resolving && styles.resolveButtonPressed,
              ]}
            >
              <Text style={styles.resolveButtonText}>{resolving ? 'Resolving...' : 'Mark as Resolved'}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
});

function SOSAlertsScreenInner() {
  const { userData } = useAuth();
  const [activeSOS, setActiveSOS] = useState([]);
  const [allSOS, setAllSOS] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [indexNotice, setIndexNotice] = useState('');
  const [resolvingId, setResolvingId] = useState(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    console.log('ACTIVE SOS:', activeSOS);
  }, [activeSOS]);

  useEffect(() => {
    console.log('ALL SOS:', allSOS);
  }, [allSOS]);

  useEffect(() => {
    if (!userData?.societyId) return undefined;

    let unsubActive = () => {};
    let unsubAll = () => {};

    setLoading(true);
    setIndexNotice('');

    const applyActiveSnapshot = (snapshot) => {
      const list = snapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        .sort((a, b) => toMillis(b.timestamp) - toMillis(a.timestamp));

      setActiveSOS(list);
    };

    const applyAllSnapshot = (snapshot) => {
      const list = snapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        .sort((a, b) => toMillis(b.timestamp) - toMillis(a.timestamp));

      setAllSOS(list);
      setLoading(false);

      if (list.length && flatListRef.current) {
        flatListRef.current.scrollToOffset({ animated: true, offset: 0 });
      }
    };

    const activeQuery = query(
      collection(db, 'sosAlerts'),
      where('societyId', '==', userData.societyId),
      where('status', '==', 'active'),
      orderBy('timestamp', 'desc')
    );

    const allQuery = query(
      collection(db, 'sosAlerts'),
      where('societyId', '==', userData.societyId),
      orderBy('timestamp', 'desc')
    );

    unsubActive = onSnapshot(
      activeQuery,
      applyActiveSnapshot,
      (error) => {
        if (error.code === 'failed-precondition' || error.message?.includes('index')) {
          setIndexNotice('Create Firestore index: societyId ASC, status ASC, timestamp DESC');
          unsubActive();
          const activeFallbackQuery = query(
            collection(db, 'sosAlerts'),
            where('societyId', '==', userData.societyId),
            where('status', '==', 'active')
          );
          unsubActive = onSnapshot(
            activeFallbackQuery,
            applyActiveSnapshot,
            (fallbackError) => console.error('SOSAlertsScreen active fallback error:', fallbackError)
          );
          return;
        }

        console.error('SOSAlertsScreen active query error:', error);
      }
    );

    unsubAll = onSnapshot(
      allQuery,
      applyAllSnapshot,
      (error) => {
        if (error.code === 'failed-precondition' || error.message?.includes('index')) {
          setIndexNotice('Create Firestore index: societyId ASC, status ASC, timestamp DESC');
          unsubAll();
          const allFallbackQuery = query(
            collection(db, 'sosAlerts'),
            where('societyId', '==', userData.societyId)
          );
          unsubAll = onSnapshot(
            allFallbackQuery,
            applyAllSnapshot,
            (fallbackError) => {
              console.error('SOSAlertsScreen all fallback error:', fallbackError);
              setLoading(false);
            }
          );
          return;
        }

        console.error('SOSAlertsScreen all query error:', error);
        setLoading(false);
      }
    );

    return () => {
      unsubActive();
      unsubAll();
    };
  }, [userData?.societyId]);

  const handleResolve = useCallback(async (id) => {
    try {
      setResolvingId(id);
      const ref = doc(db, 'sosAlerts', id);

      await updateDoc(ref, {
        status: 'resolved',
        resolvedAt: serverTimestamp(),
      });

      console.log('SOS resolved');
    } catch (e) {
      console.error('Resolve failed', e);
      Alert.alert('Error', e?.message || 'Failed to resolve alert.');
    } finally {
      setResolvingId(null);
    }
  }, []);

  const renderItem = useCallback(
    ({ item }) => (
      <AlertCard
        item={item}
        expanded={expandedId === item?.id}
        onToggle={() => setExpandedId((prev) => (prev === item?.id ? null : item?.id))}
        onResolve={() => handleResolve(item?.id)}
        canResolve={userData?.role === 'admin'}
        resolving={resolvingId === item?.id}
      />
    ),
    [expandedId, handleResolve, resolvingId, userData?.role]
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#ef4444" />
          <Text style={styles.loadingText}>Loading SOS alerts...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={allSOS}
          keyExtractor={(item) => item?.id || `${toMillis(item?.timestamp)}`}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View>
              {activeSOS.length > 0 ? (
                <View style={styles.banner}>
                  <Text style={styles.bannerTitle}>Active Emergency Alerts ({activeSOS.length})</Text>
                  <Text style={styles.bannerText}>Resolve active alerts to clear this banner.</Text>
                </View>
              ) : null}
              {indexNotice ? (
                <View style={styles.notice}>
                  <Text style={styles.noticeText}>{indexNotice}</Text>
                </View>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No SOS history found</Text>
              <Text style={styles.emptyText}>Alerts will appear here when created.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

export default function SOSAlertsScreen() {
  return <SOSAlertsScreenInner />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingText: {
    marginTop: 12,
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  banner: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  bannerTitle: {
    color: '#b91c1c',
    fontWeight: '800',
    marginBottom: 4,
  },
  bannerText: {
    color: '#991b1b',
    fontWeight: '600',
    fontSize: 13,
  },
  notice: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fdba74',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  noticeText: {
    color: '#9a3412',
    textAlign: 'center',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 6,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeActive: {
    backgroundColor: '#fee2e2',
  },
  statusBadgeResolved: {
    backgroundColor: '#dcfce7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusTextActive: {
    color: '#ef4444',
  },
  statusTextResolved: {
    color: '#16a34a',
  },
  timeText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  messageText: {
    fontSize: 17,
    lineHeight: 24,
    color: '#0f172a',
    fontWeight: '800',
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaBlock: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.6,
  },
  metaValue: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '700',
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  locationValue: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  details: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 16,
    gap: 10,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  detailValue: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
  },
  resolveButton: {
    marginTop: 8,
    backgroundColor: '#dc2626',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  resolveButtonPressed: {
    opacity: 0.9,
  },
  resolveButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  resolveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    color: '#ef4444',
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});
