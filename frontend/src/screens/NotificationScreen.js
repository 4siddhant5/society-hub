import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { collection, doc, getDocs, onSnapshot, orderBy, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { FiArrowLeft, FiBell, FiCheckCircle, FiClipboard, FiMessageSquare, FiRadio, FiShield } from 'react-icons/fi';
import AppCard from '../components/ui/AppCard';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import SecondaryButton from '../components/ui/SecondaryButton';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import colors from '../design/colors';
import spacing from '../design/spacing';

const getIcon = (type) => {
  switch (type) {
    case 'ISSUE_CREATED':
    case 'issue':
      return FiClipboard;
    case 'ISSUE_UPDATED':
      return FiCheckCircle;
    case 'BROADCAST':
    case 'broadcast':
      return FiRadio;
    case 'ANNOUNCEMENT':
    case 'announcement':
      return FiMessageSquare;
    case 'POLL':
    case 'poll':
      return FiClipboard;
    case 'sos':
      return FiShield;
    default:
      return FiBell;
  }
};

const TYPE_COLORS = {
  ISSUE_CREATED: '#f59e0b',
  ISSUE_UPDATED: '#16a34a',
  BROADCAST: '#dc2626',
  ANNOUNCEMENT: '#16a34a',
  POLL: '#7c3aed',
  issue: '#f59e0b',
  announcement: '#16a34a',
  broadcast: '#dc2626',
  sos: '#dc2626',
  poll: '#7c3aed',
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
  } catch {
    return '';
  }
};

export default function NotificationScreen({ goBack }) {
  const { userData, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.societyId || !userData?.role) return;

    let unsub = () => {};
    try {
      const q = query(collection(db, 'notifications'), where('societyId', '==', userData.societyId), orderBy('timestamp', 'desc'));

      unsub = onSnapshot(
        q,
        (snapshot) => {
          let allNotifs = snapshot.docs.map((notifDoc) => ({
            id: notifDoc.id,
            ...notifDoc.data(),
          }));

          const uid = user?.uid;
          const role = userData.role;
          allNotifs = allNotifs.filter((notif) => {
            const roleOk = !notif.targetRole || notif.targetRole === role || notif.targetRole === 'all';
            if (!roleOk) return false;
            if (notif.userId) return notif.userId === uid;
            return true;
          });

          setNotifications(allNotifs);
          setLoading(false);
        },
        (error) => {
          if (error.code === 'failed-precondition' || error.message?.includes('index')) {
            const qFallback = query(collection(db, 'notifications'), where('societyId', '==', userData.societyId));
            unsub = onSnapshot(qFallback, (snapshot) => {
              const uid = user?.uid;
              const role = userData.role;
              let list = snapshot.docs.map((notifDoc) => ({
                id: notifDoc.id,
                ...notifDoc.data(),
              }));

              list = list.filter((notif) => {
                const roleOk = !notif.targetRole || notif.targetRole === role || notif.targetRole === 'all';
                if (!roleOk) return false;
                if (notif.userId) return notif.userId === uid;
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
            console.error('[NotificationScreen]', error);
            setLoading(false);
          }
        }
      );
    } catch (error) {
      console.error('[NotificationScreen] setup error:', error);
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
      snap.docs.forEach((snapDoc) => batch.update(snapDoc.ref, { read: true }));
      await batch.commit();
    } catch (error) {
      console.error('markAllRead error:', error);
    }
  };

  const markOneRead = async (id) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error('markOneRead error:', error);
    }
  };

  const unreadCount = notifications.filter((notif) => !notif.read).length;

  const renderItem = ({ item }) => {
    const color = TYPE_COLORS[item.type] || colors.primary;
    const Icon = getIcon(item.type);

    return (
      <TouchableOpacity style={styles.cardTouch} onPress={() => markOneRead(item.id)} activeOpacity={0.85}>
        <AppCard style={[styles.card, !item.read && styles.cardUnread]}>
          <View style={[styles.iconCircle, { backgroundColor: `${color}18` }]}>
            <Icon size={18} color={color} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.cardMsg} numberOfLines={2}>
              {item.message}
            </Text>
            <Text style={styles.cardTime}>{formatTime(item.timestamp)}</Text>
          </View>
          {!item.read ? <View style={[styles.unreadDot, { backgroundColor: color }]} /> : null}
        </AppCard>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.pagePadding}>
        <PageHeader
          eyebrow="Inbox"
          title="Notifications"
          subtitle="Broadcasts, announcements, issue updates, and society activity land here in one clean feed."
          rightContent={unreadCount > 0 ? <SecondaryButton title="Mark all read" onPress={markAllRead} /> : null}
        />
      </View>

      <View style={styles.headerActions}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <FiArrowLeft size={16} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        {unreadCount > 0 ? (
          <View style={styles.unreadBanner}>
            <FiBell size={14} color={colors.primary} />
            <Text style={styles.unreadBannerText}>
              {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
            </Text>
          </View>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <AppCard style={styles.emptyCard}>
              <EmptyState
                message="All caught up. New broadcasts, issue updates, and poll results will appear here."
                icon={FiBell}
              />
            </AppCard>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pagePadding: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  headerActions: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: colors.background,
      },
    }),
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  backText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  unreadBanner: {
    backgroundColor: colors.primarySurface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  unreadBannerText: {
    fontSize: 13,
    color: '#1d4ed8',
    fontWeight: '700',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: 40,
  },
  cardTouch: {
    marginBottom: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  cardUnread: {
    backgroundColor: colors.primarySurface,
    borderColor: '#bfdbfe',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardMsg: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 6,
  },
  cardTime: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
    marginLeft: 8,
    flexShrink: 0,
  },
  emptyCard: {
    marginTop: 12,
    marginBottom: 0,
  },
});
