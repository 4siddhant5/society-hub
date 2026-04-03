import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  FlatList,
  TouchableWithoutFeedback
} from "react-native";
import { db } from "../../config/firebase";
import {
  collection, query, where, orderBy, onSnapshot,
  updateDoc, doc, writeBatch, getDocs
} from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { FiMenu, FiUser, FiBell } from 'react-icons/fi';

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

const TYPE_ICONS = {
  issue: '🔧',
  announcement: '📣',
  broadcast: '📢',
  sos: '🚨',
};

const Header = ({ title, onMenuPress, showMenuIcon, onProfilePress, onNotificationsPress }) => {
  const { userData } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!userData?.societyId) return;
    let unsub = () => {};
    try {
      const q = query(
        collection(db, 'notifications'),
        where('societyId', '==', userData.societyId),
        orderBy('timestamp', 'desc')
      );
      unsub = onSnapshot(q, (snap) => {
        setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 50));
      }, (e) => {
        if (e.code === 'failed-precondition' || e.message?.includes('index')) {
          console.warn(
            '[Notifications] Missing Firestore composite index. Falling back to unordered query.\n' +
            'Create it at: https://console.firebase.google.com/project/society-hub-dd1fa/firestore/indexes\n' +
            'Collection: notifications | Fields: societyId ASC, timestamp DESC'
          );
          // Fallback: fetch without orderBy, sort client-side
          const qFallback = query(
            collection(db, 'notifications'),
            where('societyId', '==', userData.societyId)
          );
          unsub = onSnapshot(qFallback, (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => {
              const ta = a.timestamp?.toDate?.() ?? new Date(a.timestamp ?? 0);
              const tb = b.timestamp?.toDate?.() ?? new Date(b.timestamp ?? 0);
              return tb - ta;
            });
            setNotifications(list.slice(0, 50));
          });
        } else {
          console.error('[Notifications]', e);
        }
      });
    } catch (e) {
      console.error('[Notifications] setup error:', e);
    }
    return () => unsub();
  }, [userData?.societyId]);

  const markAllRead = async () => {
    if (!userData?.societyId) return;
    try {
      const q = query(
        collection(db, 'notifications'),
        where('societyId', '==', userData.societyId),
        where('read', '==', false)
      );
      const snap = await getDocs(q);
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

  return (
    <>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          {showMenuIcon && (
            <TouchableOpacity onPress={onMenuPress} style={styles.iconButton}>
              <FiMenu size={24} color="#64748b" />
            </TouchableOpacity>
          )}
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.rightSection}>
          {/* Bell — tap to open dropdown preview, long-press to open full NotificationScreen */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowDropdown(v => !v)}
            onLongPress={onNotificationsPress}
            delayLongPress={400}
          >
            <FiBell size={22} color="#64748b" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeNum}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Profile */}
          <TouchableOpacity style={styles.profileButton} onPress={onProfilePress}>
            <View style={styles.avatar}>
              <FiUser size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notification dropdown */}
      {showDropdown && (
        <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
          <View style={styles.dropdownOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdown}>
                <View style={styles.dropdownHeader}>
                  <Text style={styles.dropdownTitle}>Notifications</Text>
                  <View style={styles.dropdownHeaderRight}>
                    {notifications.length > 0 && (
                      <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
                        <Text style={styles.markAllText}>Mark all read</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => { setShowDropdown(false); if (onNotificationsPress) onNotificationsPress(); }}
                      style={styles.viewAllBtn}
                    >
                      <Text style={styles.viewAllText}>View All</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {notifications.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyIcon}>🔔</Text>
                    <Text style={styles.emptyText}>No notifications yet</Text>
                  </View>
                ) : (
                  <FlatList
                    data={notifications}
                    keyExtractor={item => item.id}
                    style={styles.notifList}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.notifItem, !item.read && styles.notifUnread]}
                        onPress={() => markOneRead(item.id)}
                      >
                        <Text style={styles.notifIcon}>
                          {TYPE_ICONS[item.type] || '🔔'}
                        </Text>
                        <View style={styles.notifText}>
                          <Text style={styles.notifTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={styles.notifMsg} numberOfLines={2}>
                            {item.message}
                          </Text>
                          <Text style={styles.notifTime}>{formatTime(item.timestamp)}</Text>
                        </View>
                        {!item.read && <View style={styles.unreadDot} />}
                      </TouchableOpacity>
                    )}
                  />
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 70,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    ...Platform.select({ web: { position: 'sticky', top: 0, zIndex: 100 } }),
  },
  leftSection: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginLeft: 12 },
  rightSection: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { padding: 8, marginLeft: 8, position: 'relative' },
  badge: {
    position: 'absolute', top: 4, right: 4,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#ef4444',
    borderWidth: 2, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeNum: { color: '#fff', fontSize: 9, fontWeight: '800' },
  profileButton: { marginLeft: 12 },
  avatar: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#2563eb',
    alignItems: 'center', justifyContent: 'center',
  },

  // Dropdown overlay
  dropdownOverlay: {
    position: 'absolute', top: 70, left: 0, right: 0, bottom: 0,
    zIndex: 999,
    ...Platform.select({ web: { position: 'fixed' } }),
  },
  dropdown: {
    position: 'absolute', top: 0, right: 16,
    width: 340, maxHeight: 440,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1, borderColor: '#e2e8f0',
    ...Platform.select({
      web: {
        boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.15)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 12,
      },
    }),
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  dropdownTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  dropdownHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  markAllBtn: {},
  markAllText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  viewAllBtn: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  viewAllText: { fontSize: 13, color: '#2563eb', fontWeight: '700' },

  notifList: { maxHeight: 360 },
  notifItem: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: 14, borderBottomWidth: 1, borderBottomColor: '#f8fafc',
  },
  notifUnread: { backgroundColor: '#eff6ff' },
  notifIcon: { fontSize: 20, marginRight: 12, marginTop: 2 },
  notifText: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  notifMsg: { fontSize: 12, color: '#64748b', lineHeight: 18, marginBottom: 4 },
  notifTime: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#2563eb', marginTop: 4, marginLeft: 8,
  },

  emptyBox: { alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8' },
});

export default Header;
