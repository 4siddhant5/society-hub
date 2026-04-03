import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Platform
} from "react-native";
import { db } from "../config/firebase";
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, writeBatch, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

// ─── Icon map keyed on new uppercase type strings ───────────────────────────
const getIcon = (type) => {
  switch (type) {
    case 'ISSUE_CREATED': return '🛠️';
    case 'ISSUE_UPDATED': return '✅';
    case 'BROADCAST':     return '📢';
    case 'ANNOUNCEMENT':  return '📣';
    case 'POLL':          return '📊';
    // Legacy lowercase types (backward compat)
    case 'issue':         return '🛠️';
    case 'announcement':  return '📣';
    case 'broadcast':     return '📢';
    case 'sos':           return '🚨';
    case 'poll':          return '📊';
    default:              return '🔔';
  }
};

const TYPE_COLORS = {
  ISSUE_CREATED: '#f59e0b',
  ISSUE_UPDATED: '#16a34a',
  BROADCAST:     '#dc2626',
  ANNOUNCEMENT:  '#16a34a',
  POLL:          '#7c3aed',
  // Legacy
  issue:         '#f59e0b',
  announcement:  '#16a34a',
  broadcast:     '#dc2626',
  sos:           '#dc2626',
  poll:          '#7c3aed',
};

const formatTime = (ts) => {
  if (!ts) return '';
  try {
    const d = new Date(ts?.toDate ? ts.toDate() : ts);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch { return ''; }
};

export default function NotificationScreen({ goBack }) {
  const { userData, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.societyId || !userData?.role) return;

    // Role-based query: fetch notifications targeted at this role OR "all"
    let unsub = () => {};
    try {
      const q = query(
        collection(db, 'notifications'),
        where('societyId', '==', userData.societyId),
        orderBy('timestamp', 'desc')
      );

      unsub = onSnapshot(q, (snapshot) => {
        let allNotifs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Retain role/userId filtering locally to prevent old bugs
        const uid = user?.uid;
        const role = userData.role;
        allNotifs = allNotifs.filter(n => {
          const roleOk = !n.targetRole || n.targetRole === role || n.targetRole === 'all';
          if (!roleOk) return false;
          if (n.userId) return n.userId === uid;
          return true;
        });

        if (allNotifs.length >= 0) {
          setNotifications(allNotifs);
        }
        setLoading(false);
      }, (e) => {
        // Fallback when composite index is missing
        if (e.code === 'failed-precondition' || e.message?.includes('index')) {
          console.warn('[NotificationScreen] Missing composite index. Falling back to unordered query.');
          const qFallback = query(
            collection(db, 'notifications'),
            where('societyId', '==', userData.societyId)
          );
          unsub = onSnapshot(qFallback, (snapshot) => {
            const uid = user?.uid;
            const role = userData.role;
            let list = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));

            // Manual role + userId filter in fallback
            list = list.filter(n => {
              const roleOk = !n.targetRole || n.targetRole === role || n.targetRole === 'all';
              if (!roleOk) return false;
              if (n.userId) return n.userId === uid;
              return true;
            });

            list.sort((a, b) => {
              const ta = a.timestamp?.toDate?.() ?? new Date(a.timestamp ?? 0);
              const tb = b.timestamp?.toDate?.() ?? new Date(b.timestamp ?? 0);
              return tb - ta;
            });
            setNotifications(list);
            setLoading(false);
          });
        } else {
          console.error('[NotificationScreen]', e);
          setLoading(false);
        }
      });
    } catch (e) {
      console.error('[NotificationScreen] setup error:', e);
      setLoading(false);
    }

    return () => unsub();
  }, [userData?.societyId, userData?.role, user?.uid]);

  const markAllRead = async () => {
    if (!userData?.societyId) return;
    try {
      const q = query(
        collection(db, 'notifications'),
        where('societyId', '==', userData.societyId),
        where('read', '==', false)
      );
      const snap = await getDocs(q);
      if (snap.empty) return;
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.update(d.ref, { read: true }));
      await batch.commit();
    } catch (e) { console.error('markAllRead error:', e); }
  };

  const markOneRead = async (id) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) { console.error('markOneRead error:', e); }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderItem = ({ item }) => {
    const color = TYPE_COLORS[item.type] || '#2563eb';
    const icon  = getIcon(item.type);

    return (
      <TouchableOpacity
        style={[styles.card, !item.read && styles.cardUnread]}
        onPress={() => markOneRead(item.id)}
        activeOpacity={0.85}
      >
        <View style={[styles.iconCircle, { backgroundColor: color + '18' }]}>
          {/* Icon shown ONCE here — do NOT embed icons in title/message text */}
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardMsg}  numberOfLines={2}>{item.message}</Text>
          <Text style={styles.cardTime}>{formatTime(item.timestamp)}</Text>
        </View>
        {!item.read && <View style={[styles.unreadDot, { backgroundColor: color }]} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead} style={styles.markBtn}>
            <Text style={styles.markBtnText}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {unreadCount > 0 ? (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadBannerText}>🔔 {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptyText}>
                Broadcasts, announcements, issue updates, and poll results will appear here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
    ...Platform.select({ web: { position: 'sticky', top: 0, zIndex: 10 } }),
  },
  backBtn: {},
  backText: { fontSize: 16, color: '#2563eb', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  markBtn: { paddingHorizontal: 4 },
  markBtnText: { fontSize: 13, color: '#2563eb', fontWeight: '600' },
  unreadBanner: {
    backgroundColor: '#eff6ff', paddingVertical: 10, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#bfdbfe',
  },
  unreadBannerText: { fontSize: 13, color: '#1d4ed8', fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardUnread: { backgroundColor: '#eff6ff' },
  iconCircle: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0,
  },
  iconText: { fontSize: 20 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  cardMsg:   { fontSize: 13, color: '#64748b', lineHeight: 20, marginBottom: 6 },
  cardTime:  { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, marginLeft: 8, flexShrink: 0 },
  empty: { flex: 1, alignItems: 'center', paddingTop: 100 },
  emptyIcon:  { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#334155', marginBottom: 8 },
  emptyText:  { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 22, paddingHorizontal: 32 },
});
