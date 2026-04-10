import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import {
  IoAddCircle,
  IoAlertCircle,
  IoArrowForward,
  IoCalendar,
  IoNotifications,
  IoStatsChart,
  IoTimeOutline,
  IoBarChart,
  IoFlash,
} from '../../utils/iconCompat';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ResidentBroadcastCard from '../../components/ui/ResidentBroadcastCard';
import colors from '../../design/colors';
import shadows from '../../design/shadows';
import spacing from '../../design/spacing';
import { isPollExpired } from '../../components/polls/pollUtils';

// ─── Constants ──────────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { key: 'issue', label: 'Report Issue', icon: IoAddCircle, color: '#2563eb', screen: 'CreateIssue', tab: null, metaSuffix: 'active' },
  { key: 'notice', label: 'Notice Board', icon: IoNotifications, color: '#16a34a', screen: 'Announcements', tab: null, metaSuffix: 'new' },
  { key: 'polls', label: 'Polls', icon: IoStatsChart, color: '#f59e0b', screen: 'Polls', tab: null },
  { key: 'emergency', label: 'Emergency', icon: IoAlertCircle, color: '#dc2626', screen: 'SOS', tab: null },
  { key: 'booking', label: 'Book Facility', icon: IoCalendar, color: '#7c3aed', screen: 'Booking', tab: 'book', metaSuffix: 'pending' },
];

const MS_IN_WEEK = 7 * 24 * 60 * 60 * 1000;
const CARD_RADIUS = 16;
const CARD_PADDING = spacing.md;
const SECTION_SPACING = spacing.lg;

// ─── Helpers ─────────────────────────────────────────────────────────────────────
const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  if (value?.seconds) return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatDate = (value) => {
  const time = toMillis(value);
  if (!time) return 'Recently';
  const diff = Date.now() - time;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? 'Just now' : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(time).toLocaleDateString();
};

const getAnnouncementBody = (item) => item?.description || item?.message || '';

const getAnnouncementImage = (item) =>
  item?.imageUrl || item?.image || item?.thumbnail || item?.thumbnailUrl ||
  item?.photoUrl || item?.coverImage || item?.bannerUrl || '';

const isActiveIssue = (issue) => {
  const status = String(issue?.status || '').toLowerCase();
  return status !== 'resolved' && status !== 'closed';
};

// ─── Status Badge (Pill Style) ────────────────────────────────────────────────────
const STATUS_CONFIG = {
  open:        { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', label: 'Open' },
  'in progress': { bg: '#fefce8', text: '#854d0e', border: '#fde68a', label: 'In Progress' },
  inprogress:  { bg: '#fefce8', text: '#854d0e', border: '#fde68a', label: 'In Progress' },
  resolved:    { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', label: 'Resolved' },
  closed:      { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0', label: 'Closed' },
  approved:    { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', label: 'Approved' },
  pending:     { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa', label: 'Pending' },
  active:      { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', label: 'Active' },
  new:         { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff', label: 'New' },
};

const PillBadge = ({ status }) => {
  const key = String(status || 'open').toLowerCase().trim();
  const cfg = STATUS_CONFIG[key] || STATUS_CONFIG.open;
  return (
    <View style={[pillStyles.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <Text style={[pillStyles.label, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
};

const pillStyles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

// ─── Quick Action Card ─────────────────────────────────────────────────────────
const QuickActionCard = ({ action, isDark, onPress, metaValue }) => {
  const Icon = action.icon;
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered, pressed }) => [
        styles.actionCard,
        shadows.card,
        {
          backgroundColor: isDark ? '#111827' : '#ffffff',
          borderColor: isDark ? 'rgba(148,163,184,0.14)' : colors.border,
        },
        hovered && styles.actionCardHovered,
        hovered && shadows.hover,
        pressed && styles.actionCardPressed,
      ]}
    >
      <View style={[styles.actionIconWrap, { backgroundColor: `${action.color}18` }]}>
        <Icon size={22} color={action.color} />
      </View>
      <View style={styles.actionTextWrap}>
        <Text style={[styles.actionLabel, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{action.label}</Text>
        {typeof metaValue === 'number' && metaValue > 0 ? (
          <Text style={[styles.actionMeta, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            {metaValue} {action.metaSuffix}
          </Text>
        ) : null}
      </View>
      <IoArrowForward size={16} color='#94a3b8' />
    </Pressable>
  );
};

// ─── Stat Pill ─────────────────────────────────────────────────────────────────
const StatPill = ({ label, value }) => (
  <View style={styles.statPill}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ─── Activity Feed Item ─────────────────────────────────────────────────────────
const ACTIVITY_ICONS = {
  issue:    { Icon: IoAddCircle,    color: '#2563eb' },
  poll:     { Icon: IoBarChart,     color: '#f59e0b' },
  booking:  { Icon: IoCalendar,     color: '#7c3aed' },
  announce: { Icon: IoNotifications, color: '#16a34a' },
};

const ActivityItem = ({ item, isDark }) => {
  const cfg = ACTIVITY_ICONS[item.type] || ACTIVITY_ICONS.announce;
  const { Icon, color } = cfg;
  return (
    <View style={[actStyles.row, { borderBottomColor: isDark ? 'rgba(148,163,184,0.1)' : '#f1f5f9' }]}>
      <View style={[actStyles.iconWrap, { backgroundColor: `${color}16` }]}>
        <Icon size={15} color={color} />
      </View>
      <View style={actStyles.copy}>
        <Text style={[actStyles.title, { color: isDark ? '#e2e8f0' : '#1e293b' }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[actStyles.meta, { color: isDark ? '#64748b' : '#94a3b8' }]}>
          {item.subtitle} · {formatDate(item.createdAt)}
        </Text>
      </View>
      {item.status ? <PillBadge status={item.status} /> : null}
    </View>
  );
};

const actStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  meta: {
    fontSize: 11,
    fontWeight: '500',
  },
});

// ─── Main Component ─────────────────────────────────────────────────────────────
const ResidentHomeScreen = ({
  userData,
  issues,
  announcements,
  latestBroadcast,
  onDismissBroadcast,
  onNavigate,
  polls: pollsProp,
}) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const handleDismissBroadcast = onDismissBroadcast;
  const [pendingBookings, setPendingBookings] = useState(0);
  const [polls, setPolls] = useState(pollsProp || []);

  // sync if parent passes polls
  useEffect(() => { if (pollsProp) setPolls(pollsProp); }, [pollsProp]);

  // fetch polls if not passed
  useEffect(() => {
    if (pollsProp || !userData?.societyId) return undefined;
    const q = query(collection(db, 'polls'), where('societyId', '==', userData.societyId));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (toMillis(b.createdAt) || 0) - (toMillis(a.createdAt) || 0));
      setPolls(list);
    });
    return unsub;
  }, [userData?.societyId, pollsProp]);

  const isMobile = width < 680;
  const isCompact = width < 920;
  const isDesktop = width >= 1100;
  const isWeb = Platform.OS === 'web';

  const actionGridColumns = isMobile
    ? '1fr'
    : isDesktop
    ? 'repeat(3, minmax(0, 1fr))'
    : 'repeat(2, minmax(0, 1fr))';

  const recentIssues = useMemo(() => issues.slice(0, 4), [issues]);
  const featuredAnnouncement = announcements[0] || null;

  const activeIssuesCount = useMemo(
    () => issues.filter((i) => isActiveIssue(i)).length,
    [issues]
  );

  const newAnnouncementsCount = useMemo(
    () => announcements.filter((i) => Date.now() - toMillis(i.createdAt) <= MS_IN_WEEK).length,
    [announcements]
  );

  // Latest active (non-expired, non-closed) poll
  const latestActivePoll = useMemo(() => {
    return polls.find((p) => !p.isClosed && !isPollExpired(p)) || polls[0] || null;
  }, [polls]);

  // Activity Feed: mix issues + announcements + polls (max 5)
  const activityFeed = useMemo(() => {
    const items = [];

    issues.slice(0, 3).forEach((i) => {
      items.push({
        id: `issue-${i.id}`,
        type: 'issue',
        title: i.title || 'Issue reported',
        subtitle: 'Issue',
        status: i.status || 'open',
        createdAt: i.createdAt,
      });
    });

    announcements.slice(0, 2).forEach((a) => {
      items.push({
        id: `ann-${a.id}`,
        type: 'announce',
        title: a.title || 'New announcement',
        subtitle: 'Notice',
        status: null,
        createdAt: a.createdAt,
      });
    });

    polls.slice(0, 2).forEach((p) => {
      items.push({
        id: `poll-${p.id}`,
        type: 'poll',
        title: p.question || p.title || 'New poll',
        subtitle: 'Poll',
        status: p.isClosed || isPollExpired(p) ? 'closed' : 'active',
        createdAt: p.createdAt,
      });
    });

    // Sort by date desc, take top 5
    items.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
    return items.slice(0, 5);
  }, [issues, announcements, polls]);

  const actionMeta = useMemo(() => ({
    issue: activeIssuesCount,
    notice: newAnnouncementsCount,
    booking: pendingBookings,
  }), [activeIssuesCount, newAnnouncementsCount, pendingBookings]);

  useEffect(() => {
    if (!userData?.societyId || !user?.uid) { setPendingBookings(0); return undefined; }
    const bookingQuery = query(
      collection(db, 'bookings', userData.societyId, 'entries'),
      where('userId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(bookingQuery, (snapshot) => {
      const count = snapshot.docs.reduce((total, docSnap) => {
        const status = String(docSnap.data()?.status || '').toLowerCase();
        return total + (status === 'pending' ? 1 : 0);
      }, 0);
      setPendingBookings(count);
    });
    return unsubscribe;
  }, [user?.uid, userData?.societyId]);

  // Pulse animation for emergency card
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulseAnim]);

  // ─── Render
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#0b1220' : '#f8fafc' }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.contentInner}>

        {/* ── Priority Broadcast Banner ───────────────────────────────── */}
        {false ? (
          <View style={[styles.broadcastBanner, { backgroundColor: isDark ? '#3f1d1d' : '#fff1f2' }]}>
            <View style={styles.broadcastCopy}>
              <Text style={styles.broadcastEyebrow}>Priority update</Text>
              <Text style={[styles.broadcastTitle, { color: isDark ? '#fecaca' : '#9f1239' }]}>
                {latestBroadcast.title}
              </Text>
              <Text style={[styles.broadcastMessage, { color: isDark ? '#fecdd3' : '#881337' }]}>
                {latestBroadcast.message}
              </Text>
            </View>
            <TouchableOpacity onPress={handleDismissBroadcast} style={styles.broadcastDismiss} activeOpacity={0.85}>
              <Text style={styles.broadcastDismissText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ── Hero Card ─────────────────────────────────────────────── */}
        <View style={[styles.heroCard, shadows.card, { backgroundColor: isDark ? '#1d4ed8' : '#2563eb' }]}>
          <View style={styles.heroGlowPrimary} />
          <View style={styles.heroGlowSecondary} />
          <View style={[styles.heroContent, isCompact && styles.heroContentCompact]}>
            <View style={[styles.heroTextBlock, isCompact && styles.heroTextBlockCompact]}>
              <Text style={styles.heroTitle}>Welcome back, {userData?.name?.split(' ')[0] || 'Resident'} 👋</Text>
              <Text style={styles.heroSubtitle}>Your society hub — all in one place.</Text>
            </View>
            <View style={[styles.heroStats, isCompact && styles.heroStatsCompact]}>
              <StatPill label="Issues" value={activeIssuesCount} />
              <StatPill label="Notices" value={newAnnouncementsCount} />
              <StatPill label="Bookings" value={pendingBookings} />
            </View>
          </View>
        </View>

        {/* ── Quick Actions Grid ─────────────────────────────────────── */}
        {latestBroadcast ? (
          <ResidentBroadcastCard
            broadcast={latestBroadcast}
            isDark={isDark}
            onClose={onDismissBroadcast}
            style={styles.broadcastCard}
          />
        ) : null}

        <View style={[styles.sectionBlock, latestBroadcast && styles.sectionBlockAfterBroadcast]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Quick actions</Text>
            <Text style={[styles.sectionSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              Jump straight into what you need.
            </Text>
          </View>
          <View
            style={[
              styles.actionGrid,
              Platform.OS === 'web' && { gridTemplateColumns: actionGridColumns },
            ]}
          >
            {QUICK_ACTIONS.map((action) => (
              <QuickActionCard
                key={action.key}
                action={action}
                isDark={isDark}
                metaValue={actionMeta[action.key]}
                onPress={() =>
                  action.tab
                    ? onNavigate(action.screen, { initialTab: action.tab })
                    : onNavigate(action.screen)
                }
              />
            ))}
          </View>
        </View>

        {/* ── Two-Column Dashboard Grid ──────────────────────────────── */}
        <View
          nativeID="dashboard-container"
          style={[
            styles.dashboardGrid,
            isDesktop ? styles.dashboardGridDesktop : styles.dashboardGridStack,
            isDesktop && isWeb && styles.dashboardGridDesktopWeb,
          ]}
        >

          {/* ───── LEFT / MAIN COLUMN ───── */}
          <View style={[styles.dashboardMain, isDesktop ? styles.dashboardMainDesktop : styles.dashboardColumnStack]}>

            {/* Announcement Spotlight */}
            {featuredAnnouncement ? (
              <View style={styles.mainSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                    Announcement spotlight
                  </Text>
                  <TouchableOpacity onPress={() => onNavigate('Announcements')} activeOpacity={0.85}>
                    <Text style={styles.sectionLink}>See all</Text>
                  </TouchableOpacity>
                </View>

                <Pressable
                  onPress={() => onNavigate('Announcements')}
                  style={({ hovered, pressed }) => [
                    styles.announcementCard,
                    shadows.card,
                    {
                      backgroundColor: isDark ? '#111827' : '#ffffff',
                      borderColor: isDark ? 'rgba(148,163,184,0.14)' : '#e2e8f0',
                    },
                    hovered && styles.cardHovered,
                    pressed && styles.cardPressed,
                  ]}
                >
                  {getAnnouncementImage(featuredAnnouncement) ? (
                    <Image
                      source={{ uri: getAnnouncementImage(featuredAnnouncement) }}
                      style={styles.announcementThumb}
                      resizeMode="cover"
                    />
                  ) : null}
                  <View style={styles.announcementBody}>
                    <Text style={[styles.eyebrow, { color: isDark ? '#93c5fd' : '#2563eb' }]}>
                      Latest notice
                    </Text>
                    <Text style={[styles.cardTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]} numberOfLines={2}>
                      {featuredAnnouncement.title}
                    </Text>
                    <Text style={[styles.cardBody, { color: isDark ? '#cbd5e1' : '#475569' }]} numberOfLines={2}>
                      {getAnnouncementBody(featuredAnnouncement)}
                    </Text>
                    <View style={styles.cardFooter}>
                      <View style={styles.cardFooterLeft}>
                        <IoTimeOutline size={12} color={isDark ? '#64748b' : '#94a3b8'} />
                        <Text style={[styles.cardDate, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                          {formatDate(featuredAnnouncement.createdAt)}
                        </Text>
                      </View>
                      <View style={styles.readMoreBtn}>
                        <Text style={styles.readMoreText}>Read more</Text>
                        <IoArrowForward size={13} color="#2563eb" />
                      </View>
                    </View>
                  </View>
                </Pressable>
              </View>
            ) : null}

            {/* Recent Issues */}
            <View style={styles.mainSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Recent issues</Text>
                <TouchableOpacity onPress={() => onNavigate('MyIssues')} activeOpacity={0.85}>
                  <Text style={styles.sectionLink}>See all</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.sectionStack}>
                {recentIssues.length === 0 ? (
                  <View style={[styles.emptyCard, { backgroundColor: isDark ? '#111827' : '#ffffff', borderColor: isDark ? 'rgba(148,163,184,0.14)' : '#e2e8f0' }]}>
                    <Text style={[styles.emptyText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                      No recent issues reported.
                    </Text>
                  </View>
                ) : (
                  recentIssues.map((issue) => (
                    <Pressable
                      key={issue.id}
                      style={({ hovered, pressed }) => [
                        styles.issueCard,
                        shadows.card,
                        {
                          backgroundColor: isDark ? '#111827' : '#ffffff',
                          borderColor: isDark ? 'rgba(148,163,184,0.14)' : '#e2e8f0',
                        },
                        hovered && styles.cardHovered,
                        pressed && styles.cardPressed,
                      ]}
                    >
                      <View style={styles.issueHeader}>
                        <View style={styles.issueHeaderCopy}>
                          <Text style={[styles.issueTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]} numberOfLines={1}>
                            {issue.title}
                          </Text>
                          <View style={styles.issueMeta}>
                            <IoTimeOutline size={11} color={isDark ? '#64748b' : '#94a3b8'} />
                            <Text style={[styles.issueDate, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                              {formatDate(issue.createdAt)}
                            </Text>
                          </View>
                        </View>
                        <PillBadge status={issue.status || 'open'} />
                      </View>
                      {issue.description ? (
                        <Text style={[styles.issueDescription, { color: isDark ? '#94a3b8' : '#64748b' }]} numberOfLines={1}>
                          {issue.description}
                        </Text>
                      ) : null}
                    </Pressable>
                  ))
                )}
              </View>
            </View>
          </View>

          {/* ───── RIGHT / SIDEBAR ───── */}
          <View
            nativeID="right-panel"
            style={[styles.dashboardSide, isDesktop ? styles.dashboardSideDesktop : styles.dashboardColumnStack]}
          >
            {/* 1. Real-time Activity Feed */}
            <View
              style={[
                styles.panelCard,
                isDesktop ? styles.activityFeedCardDesktop : styles.activityFeedCardStack,
                shadows.card,
                { backgroundColor: isDark ? '#111827' : '#ffffff', borderColor: isDark ? 'rgba(148,163,184,0.14)' : '#e2e8f0' },
              ]}
            >
              <View style={styles.activityFeedHeader}>
                <Text style={[styles.panelTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Activity Feed</Text>
              </View>

              <View style={styles.activityFeedList}>
                {activityFeed.length === 0 ? (
                  <Text style={[styles.emptyText, { color: isDark ? '#64748b' : '#94a3b8', paddingTop: 12 }]}>
                    No recent activity.
                  </Text>
                ) : (
                  activityFeed.map((item) => (
                    <ActivityItem key={item.id} item={item} isDark={isDark} />
                  ))
                )}
              </View>
            </View>

            {/* 2. Recent Poll CTA */}
            {latestActivePoll ? (
              <Pressable
                onPress={() => onNavigate('Polls')}
                style={({ hovered, pressed }) => [
                  styles.pollCard,
                  styles.staticSideCard,
                  shadows.card,
                  {
                    backgroundColor: isDark ? '#1a1133' : '#faf5ff',
                    borderColor: isDark ? 'rgba(167,139,250,0.18)' : '#e9d5ff',
                  },
                  hovered && styles.cardHovered,
                  pressed && styles.cardPressed,
                ]}
              >
                <View style={styles.pollCardHeader}>
                  <View style={[styles.pollBadge, { backgroundColor: isDark ? 'rgba(167,139,250,0.18)' : '#ede9fe' }]}>
                    <IoBarChart size={14} color="#7c3aed" />
                    <Text style={styles.pollBadgeText}>Active Poll</Text>
                  </View>
                </View>
                <Text style={[styles.pollQuestion, { color: isDark ? '#e9d5ff' : '#4c1d95' }]} numberOfLines={2}>
                  {latestActivePoll.question || latestActivePoll.title || 'Community Poll'}
                </Text>
                <View style={styles.pollCTA}>
                  <Text style={styles.pollCTAText}>Vote Now</Text>
                  <IoArrowForward size={14} color="#7c3aed" />
                </View>
              </Pressable>
            ) : null}

            {/* 3. Emergency Card (compact + pulsing) */}
            <Animated.View style={[styles.emergencyWrap, styles.staticSideCard, { transform: [{ scale: pulseAnim }] }]}>
              <TouchableOpacity
                onPress={() => onNavigate('SOS')}
                activeOpacity={0.9}
                style={[styles.emergencyCard, shadows.card]}
              >
                <View style={styles.emergencyGlow1} />
                <View style={styles.emergencyGlow2} />
                <View style={styles.emergencyContent}>
                  <View style={styles.emergencyIconWrap}>
                    <IoFlash size={18} color="#ffffff" />
                  </View>
                  <View style={styles.emergencyText}>
                    <Text style={styles.emergencyTitle}>Emergency</Text>
                    <Text style={styles.emergencySubtitle}>Tap to trigger alert</Text>
                  </View>
                  <View style={styles.emergencyArrow}>
                    <IoArrowForward size={16} color="rgba(255,255,255,0.85)" />
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>

          </View>
        </View>
      </View>
    </ScrollView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl || 40,
    flexGrow: 1,
  },
  contentInner: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
  },

  // ── Section helpers ────────────────────────────
  sectionBlock: {
    marginTop: SECTION_SPACING,
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    flexWrap: 'wrap',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  sectionLink: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Broadcast Banner ───────────────────────────
  broadcastBanner: {
    borderRadius: CARD_RADIUS,
    padding: CARD_PADDING,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.18)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    flexWrap: 'wrap',
    width: '100%',
  },
  broadcastCopy: { flex: 1, minWidth: 0 },
  broadcastEyebrow: {
    color: '#e11d48',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  broadcastTitle: { fontSize: 15, lineHeight: 21, fontWeight: '800' },
  broadcastMessage: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  broadcastDismiss: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(15,23,42,0.06)' },
  broadcastDismissText: { color: '#e11d48', fontSize: 12, fontWeight: '800' },

  // ── Hero Card ─────────────────────────────────
  heroCard: {
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    paddingHorizontal: CARD_PADDING,
    paddingVertical: 18,
    position: 'relative',
    width: '100%',
    ...Platform.select({
      web: { backgroundImage: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 55%, #0ea5e9 100%)' },
    }),
  },
  heroGlowPrimary: {
    position: 'absolute', width: 180, height: 180, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)', top: -60, right: -44,
  },
  heroGlowSecondary: {
    position: 'absolute', width: 120, height: 120, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)', bottom: -48, left: -30,
  },
  heroContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  heroContentCompact: { flexDirection: 'column', alignItems: 'flex-start', gap: 12 },
  heroTextBlock: { flex: 1, maxWidth: 560 },
  heroTextBlockCompact: { maxWidth: '100%' },
  heroTitle: { color: '#ffffff', fontSize: 21, lineHeight: 28, fontWeight: '800' },
  heroSubtitle: { marginTop: 4, color: 'rgba(255,255,255,0.82)', fontSize: 13, lineHeight: 19 },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 10 },
  heroStatsCompact: { justifyContent: 'flex-start', width: '100%' },

  statPill: {
    paddingHorizontal: 13, paddingVertical: 7, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', minWidth: 66,
  },
  statValue: { color: '#ffffff', fontSize: 17, fontWeight: '900' },
  statLabel: { marginTop: 2, color: 'rgba(255,255,255,0.78)', fontSize: 10, fontWeight: '600', textAlign: 'center' },
  broadcastCard: {
    marginTop: spacing.md,
  },

  // ── Quick Actions ──────────────────────────────
  actionGrid: {
    gap: 10,
    width: '100%',
    ...Platform.select({
      web: { display: 'grid' },
      default: { flexDirection: 'column' },
    }),
  },
  actionCard: {
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      web: { cursor: 'pointer', transitionDuration: '200ms', transitionProperty: 'transform, box-shadow, border-color' },
    }),
  },
  actionCardHovered: { transform: [{ scale: 1.018 }] },
  actionCardPressed: { transform: [{ scale: 0.985 }] },
  actionIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  actionTextWrap: { flex: 1, minWidth: 0 },
  actionLabel: { fontSize: 14, lineHeight: 19, fontWeight: '700' },
  actionMeta: { marginTop: 3, fontSize: 12, fontWeight: '600' },

  // ── Dashboard Grid ─────────────────────────────
  dashboardGrid: {
    marginTop: SECTION_SPACING,
    gap: SECTION_SPACING,
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  dashboardGridStack: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  dashboardGridDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dashboardGridDesktopWeb: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    alignItems: 'start',
  },
  dashboardMain: {
    minWidth: 0,
    flexDirection: 'column',
    gap: spacing.md,
  },
  dashboardMainDesktop: {
    flex: 2,
  },
  dashboardSide: {
    minWidth: 0,
    flexDirection: 'column',
    gap: spacing.md,
  },
  dashboardSideDesktop: {
    flex: 1,
  },
  sectionBlockAfterBroadcast: {
    marginTop: spacing.md,
  },
  dashboardColumnStack: {
    width: '100%',
    flexShrink: 0,
  },
  mainSection: {
    width: '100%',
    flexDirection: 'column',
  },
  sectionStack: {
    flexDirection: 'column',
    gap: spacing.md,
  },

  // ── Generic card interactions ───────────────────
  cardHovered: {
    transform: [{ translateY: -2 }],
    ...Platform.select({ web: { boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } }),
  },
  cardPressed: { transform: [{ scale: 0.985 }] },

  // ── Announcement Card ──────────────────────────
  announcementCard: {
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    height: 'auto',
    overflow: 'hidden',
    width: '100%',
    ...Platform.select({
      web: { cursor: 'pointer', transitionDuration: '200ms', transitionProperty: 'transform, box-shadow' },
    }),
  },
  announcementThumb: {
    width: '100%',
    height: 140,
    backgroundColor: '#dbeafe',
  },
  announcementBody: {
    padding: CARD_PADDING,
    gap: 6,
  },
  eyebrow: {
    fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7,
  },
  cardTitle: { fontSize: 16, lineHeight: 22, fontWeight: '800' },
  cardBody: { fontSize: 13, lineHeight: 19 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  cardFooterLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardDate: { fontSize: 11, fontWeight: '500' },
  readMoreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, backgroundColor: '#eff6ff',
    borderWidth: 1, borderColor: '#bfdbfe',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  readMoreText: { color: '#2563eb', fontSize: 12, fontWeight: '700' },

  // ── Issue Cards ─────────────────────────────────
  issueCard: {
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    height: 'auto',
    padding: CARD_PADDING,
    // No marginBottom — parent gap handles spacing to avoid double gaps
    width: '100%',
    ...Platform.select({
      web: { cursor: 'pointer', transitionDuration: '180ms', transitionProperty: 'transform, box-shadow' },
    }),
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  issueHeaderCopy: { flex: 1, minWidth: 0, gap: 3 },
  issueTitle: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  issueMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  issueDate: { fontSize: 11, fontWeight: '500' },
  issueDescription: { fontSize: 12, lineHeight: 18, marginTop: 6 },

  // ── Panel Card ─────────────────────────────────
  panelCard: {
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    height: 'auto',
    padding: CARD_PADDING,
    width: '100%',
    flexDirection: 'column',
  },
  activityFeedCardDesktop: {
    height: 'auto',
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  activityFeedCardStack: {
    height: 'auto',
    flexGrow: 0,
    flexShrink: 0,
  },
  activityFeedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  panelHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveIndicator: {
    width: 8, height: 8, borderRadius: 999,
    backgroundColor: '#22c55e',
    ...Platform.select({
      web: {
        boxShadow: '0 0 0 3px rgba(34,197,94,0.22)',
        animationDuration: '1.5s',
        animationIterationCount: 'infinite',
        animationKeyframes: {
          '0%': { transform: [{ scale: 0.96 }], opacity: 0.85 },
          '50%': { transform: [{ scale: 1.08 }], opacity: 1 },
          '100%': { transform: [{ scale: 0.96 }], opacity: 0.85 },
        },
        animationTimingFunction: 'ease-in-out',
      },
    }),
  },
  panelTitle: { fontSize: 15, fontWeight: '800', lineHeight: 21 },
  panelSubtitle: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  activityFeedList: {
    flexDirection: 'column',
    height: 'auto',
    gap: 0,
  },

  // ── Poll Card ──────────────────────────────────
  pollCard: {
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    height: 'auto',
    padding: CARD_PADDING,
    width: '100%',
    gap: 10,
    ...Platform.select({
      web: { cursor: 'pointer', transitionDuration: '200ms', transitionProperty: 'transform, box-shadow' },
    }),
  },
  pollCardHeader: { flexDirection: 'row', alignItems: 'center' },
  pollBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  pollBadgeText: { fontSize: 11, fontWeight: '800', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 0.4 },
  pollQuestion: { fontSize: 15, lineHeight: 21, fontWeight: '800' },
  pollCTA: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 999, backgroundColor: '#7c3aed',
    alignSelf: 'flex-start',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  pollCTAText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  staticSideCard: {
    flexShrink: 0,
  },

  // ── Emergency Card (compact) ────────────────────
  emergencyWrap: { width: '100%', height: 'auto' },
  emergencyCard: {
    borderRadius: CARD_RADIUS,
    height: 'auto',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#dc2626',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    ...Platform.select({
      web: { backgroundImage: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', cursor: 'pointer' },
    }),
  },
  emergencyGlow1: {
    position: 'absolute', width: 100, height: 100, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)', top: -30, right: -20,
  },
  emergencyGlow2: {
    position: 'absolute', width: 70, height: 70, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)', bottom: -20, left: -15,
  },
  emergencyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  emergencyIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  emergencyText: { flex: 1, minWidth: 0 },
  emergencyTitle: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  emergencySubtitle: { color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: '500', marginTop: 2 },
  emergencyArrow: {
    width: 32, height: 32, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Empty / Misc ────────────────────────────────
  emptyCard: {
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    height: 'auto',
    padding: CARD_PADDING,
    alignItems: 'center',
    width: '100%',
  },
  emptyText: { textAlign: 'center', fontSize: 13, lineHeight: 19 },
});

export default ResidentHomeScreen;
