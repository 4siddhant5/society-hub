import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import AppCard from '../../components/ui/AppCard';
import SectionHeader from '../../components/ui/SectionHeader';
import EmptyState from '../../components/ui/EmptyState';
import {
  IoPeople,
  IoAlertCircle,
  IoCheckmarkCircle,
  IoStatsChart,
  IoCopy,
  IoMegaphone,
  IoChatbubbles,
  IoCalendar,
  IoDocumentText,
  IoShieldHalf,
  IoArrowForward,
  IoSparkles,
  IoTimeOutline,
  IoCheckmarkDoneCircle,
  IoRadio,
} from 'react-icons/io5';
import { FiInbox } from 'react-icons/fi';

const MANAGEMENT_ACTIONS = [
  {
    key: 'resident-approval',
    title: 'Resident Approvals',
    subtitle: 'Review new residents',
    screen: 'ResidentApproval',
    accent: '#2563eb',
    tint: '#eff6ff',
    icon: IoPeople,
  },
  {
    key: 'issues',
    title: 'Issue Tracking',
    subtitle: 'Manage complaint flow',
    screen: 'IssueManagement',
    accent: '#f59e0b',
    tint: '#fffbeb',
    icon: IoAlertCircle,
  },
  {
    key: 'polls',
    title: 'Poll Center',
    subtitle: 'Monitor active polls',
    screen: 'Polls',
    accent: '#7c3aed',
    tint: '#f5f3ff',
    icon: IoStatsChart,
  },
  {
    key: 'bookings',
    title: 'Booking Center',
    subtitle: 'Approve amenities',
    screen: 'BookingManagement',
    accent: '#16a34a',
    tint: '#f0fdf4',
    icon: IoCalendar,
  },
  {
    key: 'chat',
    title: 'Community Chat',
    subtitle: 'Open resident chat',
    screen: 'ChatScreen',
    accent: '#0f766e',
    tint: '#ecfeff',
    icon: IoChatbubbles,
  },
  {
    key: 'broadcast-history',
    title: 'Broadcast History',
    subtitle: 'Review sent updates',
    screen: 'BroadcastHistory',
    accent: '#1d4ed8',
    tint: '#eff6ff',
    icon: IoDocumentText,
  },
  {
    key: 'sos',
    title: 'Emergency Feed',
    subtitle: 'Track SOS alerts',
    screen: 'SOSAlertsScreen',
    accent: '#dc2626',
    tint: '#fef2f2',
    icon: IoShieldHalf,
  },
];

const SHADOW = Platform.select({
  web: {
    boxShadow: '0px 18px 45px rgba(15, 23, 42, 0.08)',
  },
  default: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
});

const getResponsiveConfig = (width) => {
  const isMobile = width < 680;
  const isTablet = width >= 680 && width < 1100;

  return {
    isMobile,
    isTablet,
    statColumns: isMobile ? 2 : isTablet ? 2 : 4,
    actionColumns: isMobile ? 2 : isTablet ? 3 : 4,
    heroDirection: isMobile ? 'column' : 'row',
    snapshotDirection: isMobile ? 'column' : 'row',
  };
};

const formatTime = (ts) => {
  if (!ts) return '';
  try {
    const date = new Date(ts?.toDate ? ts.toDate() : ts);
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const formatTimeAgo = (ts) => {
  if (!ts) return 'Just now';
  try {
    const date = new Date(ts?.toDate ? ts.toDate() : ts);
    const now = new Date();
    const diffMs = now - date;
    const minutes = Math.max(1, Math.floor(diffMs / 60000));

    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return formatTime(ts);
  } catch {
    return '';
  }
};

const getIssueStatusTone = (status) => {
  if (status === 'Resolved') {
    return { label: 'Resolved', color: '#16a34a', bg: '#dcfce7' };
  }
  return { label: status || 'Pending', color: '#d97706', bg: '#fef3c7' };
};

const StatCard = ({ icon: Icon, value, label, color, accent, isDark, width }) => (
  <View
    style={[
      styles.statCard,
      SHADOW,
      {
        width,
        borderColor: isDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(255,255,255,0.55)',
        backgroundColor: isDark ? '#171f31' : '#ffffff',
      },
    ]}
  >
    <View style={[styles.statGlow, { backgroundColor: accent }]} />
    <View style={[styles.statIconWrapper, { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.72)' : accent }]}>
      <Icon size={20} color={color} />
    </View>
    <Text style={[styles.statValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: isDark ? '#cbd5e1' : '#475569' }]}>{label}</Text>
  </View>
);

const ActionCard = ({ action, onPress, isDark, width }) => {
  const Icon = action.icon;

  return (
    <Pressable
      onPress={onPress}
      style={({ hovered, pressed }) => [
        styles.actionCard,
        SHADOW,
        {
          width,
          borderColor: isDark ? 'rgba(148, 163, 184, 0.16)' : '#e2e8f0',
          backgroundColor: isDark ? '#151c2c' : '#ffffff',
          transform: [{ scale: pressed ? 0.985 : hovered ? 1.01 : 1 }],
        },
      ]}
    >
      <View style={[styles.actionIconWrap, { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.78)' : action.tint }]}>
        <Icon size={18} color={action.accent} />
      </View>
      <Text style={[styles.actionTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>{action.title}</Text>
      <Text style={[styles.actionSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>{action.subtitle}</Text>
      <View style={styles.actionFooter}>
        <Text style={[styles.actionLink, { color: action.accent }]}>Open</Text>
        <IoArrowForward size={14} color={action.accent} />
      </View>
    </Pressable>
  );
};

const ActivityItem = ({ item, isDark }) => (
  <View style={styles.activityItem}>
    <View style={styles.activityRail}>
      <View style={[styles.activityDot, { backgroundColor: item.tone }]} />
      <View style={[styles.activityLine, { backgroundColor: isDark ? '#243247' : '#e2e8f0' }]} />
    </View>
    <View
      style={[
        styles.activityBody,
        {
          borderColor: isDark ? 'rgba(148, 163, 184, 0.15)' : '#e2e8f0',
          backgroundColor: isDark ? '#101827' : '#ffffff',
        },
      ]}
    >
      <View style={styles.activityTopRow}>
        <Text style={[styles.activityTitle, { color: isDark ? '#ffffff' : '#0f172a' }]} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={[styles.activityStatus, { backgroundColor: item.statusBg }]}>
          <Text style={[styles.activityStatusText, { color: item.statusColor }]}>{item.statusLabel}</Text>
        </View>
      </View>
      <Text style={[styles.activitySubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]} numberOfLines={2}>
        {item.subtitle}
      </Text>
      <View style={styles.activityMeta}>
        <IoTimeOutline size={13} color={isDark ? '#94a3b8' : '#64748b'} />
        <Text style={[styles.activityTime, { color: isDark ? '#94a3b8' : '#64748b' }]}>{item.timeAgo}</Text>
      </View>
    </View>
  </View>
);

const SOSPreviewCard = ({ item, isDark, onPress }) => {
  const title = item.userName || item.senderName || 'Resident SOS Alert';
  const location = item.location || item.flatNumber || item.flat;

  return (
    <Pressable
      onPress={onPress}
      style={({ hovered, pressed }) => [
        styles.sosCard,
        SHADOW,
        {
          borderColor: isDark ? 'rgba(248, 113, 113, 0.28)' : '#fecaca',
          backgroundColor: isDark ? '#2a1115' : '#fff5f5',
          transform: [{ scale: pressed ? 0.99 : hovered ? 1.01 : 1 }],
        },
      ]}
    >
      <View style={styles.sosHeader}>
        <View style={[styles.sosBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff' }]}>
          <IoRadio size={14} color="#dc2626" />
          <Text style={styles.sosBadgeText}>Active alert</Text>
        </View>
        <Text style={[styles.sosTime, { color: isDark ? '#fca5a5' : '#b91c1c' }]}>{formatTimeAgo(item.timestamp)}</Text>
      </View>
      <Text style={[styles.sosTitle, { color: isDark ? '#ffffff' : '#7f1d1d' }]}>{title}</Text>
      <Text style={[styles.sosText, { color: isDark ? '#fecaca' : '#991b1b' }]}>
        {item.type ? `${item.type} emergency` : 'Emergency alert'}
        {location ? ` from ${location}` : ''}
      </Text>
    </Pressable>
  );
};

const SnapshotCard = ({ icon: Icon, label, value, actionLabel, onPress, accent, isDark }) => (
  <AppCard
    style={[
      styles.snapshotCard,
      SHADOW,
      {
        borderColor: isDark ? 'rgba(148, 163, 184, 0.16)' : '#e2e8f0',
        backgroundColor: isDark ? '#151c2c' : '#ffffff',
      },
    ]}
  >
    <View style={styles.snapshotTop}>
      <View style={[styles.snapshotIcon, { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.78)' : `${accent}18` }]}>
        <Icon size={18} color={accent} />
      </View>
      <Text style={[styles.snapshotValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>{value}</Text>
    </View>
    <Text style={[styles.snapshotLabel, { color: isDark ? '#cbd5e1' : '#475569' }]}>{label}</Text>
    <Pressable onPress={onPress} style={styles.snapshotLinkWrap}>
      <Text style={[styles.snapshotLink, { color: accent }]}>{actionLabel}</Text>
    </Pressable>
  </AppCard>
);

const AdminHomeScreen = ({
  stats,
  societyCode,
  broadcasts = [],
  issues = [],
  activeSOS = [],
  pendingResidentsCount = 0,
  loading = false,
  onNavigate,
}) => {
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const responsive = getResponsiveConfig(width);
  const horizontalPadding = responsive.isMobile ? 16 : responsive.isTablet ? 20 : 24;
  const gridGap = 14;
  const availableWidth = Math.max(width - (horizontalPadding * 2), 320);
  const statWidth = (availableWidth - (gridGap * (responsive.statColumns - 1))) / responsive.statColumns;
  const actionWidth = (availableWidth - (gridGap * (responsive.actionColumns - 1))) / responsive.actionColumns;

  const handleCopyCode = async () => {
    if (!societyCode) {
      Alert.alert('Access Code', 'No society access code available.');
      return;
    }

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(societyCode);
        Alert.alert('Copied', `Society code ${societyCode} copied.`);
        return;
      } catch {
      }
    }

    Alert.alert('Access Code', `Society code: ${societyCode}`);
  };

  const recentActivityItems = useMemo(() => {
    const issueItems = issues.slice(0, 4).map((item) => {
      const statusTone = getIssueStatusTone(item.status);
      return {
        id: `issue-${item.id}`,
        title: item.title || 'Issue reported',
        subtitle: `${item.category || 'General complaint'}${item.description ? ` - ${item.description}` : ''}`,
        timeAgo: formatTimeAgo(item.createdAt),
        tone: '#f59e0b',
        statusLabel: statusTone.label,
        statusColor: statusTone.color,
        statusBg: statusTone.bg,
        sortValue: item.createdAt?.toDate ? item.createdAt.toDate().getTime() : Number(item.createdAt || 0),
      };
    });

    const broadcastItems = broadcasts.slice(0, 4).map((item) => ({
      id: `broadcast-${item.id}`,
      title: item.title || 'Broadcast sent',
      subtitle: item.message || 'Society-wide update shared',
      timeAgo: formatTimeAgo(item.timestamp),
      tone: '#2563eb',
      statusLabel: 'Broadcast',
      statusColor: '#1d4ed8',
      statusBg: '#dbeafe',
      sortValue: item.timestamp?.toDate ? item.timestamp.toDate().getTime() : Number(item.timestamp || 0),
    }));

    return [...issueItems, ...broadcastItems]
      .sort((a, b) => b.sortValue - a.sortValue)
      .slice(0, 6);
  }, [broadcasts, issues]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#0b1220' : '#f8fafc' }]}
      contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.heroShell,
          SHADOW,
          {
            borderColor: isDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(191, 219, 254, 0.8)',
            backgroundColor: isDark ? '#101827' : '#ffffff',
            flexDirection: responsive.heroDirection,
            alignItems: responsive.isMobile ? 'flex-start' : 'center',
          },
        ]}
      >
        <View style={styles.heroBackdropOne} />
        <View style={styles.heroBackdropTwo} />
        <View style={styles.heroContent}>
          <View style={styles.heroPill}>
            <IoSparkles size={14} color="#2563eb" />
            <Text style={styles.heroPillText}>Admin dashboard</Text>
          </View>
          <Text style={[styles.heroTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>Society Overview</Text>
          <Text style={[styles.heroSubtitle, { color: isDark ? '#cbd5e1' : '#475569' }]}>
            A cleaner operations center for residents, issues, polls, SOS alerts, and society-wide updates.
          </Text>
        </View>
        <Pressable
          onPress={() => onNavigate('BroadcastScreen')}
          style={({ hovered, pressed }) => [
            styles.heroAction,
            {
              alignSelf: responsive.isMobile ? 'stretch' : 'auto',
              backgroundColor: isDark ? '#2563eb' : '#0f172a',
              opacity: pressed ? 0.92 : 1,
              transform: [{ scale: hovered ? 1.01 : 1 }],
            },
          ]}
        >
          <IoMegaphone size={16} color="#ffffff" />
          <Text style={styles.heroActionText}>Send Broadcast</Text>
        </Pressable>
      </View>

      <View style={[styles.statsGrid, { gap: gridGap }]}>
        <StatCard icon={IoPeople} value={stats.residents} label="Total Residents" color="#2563eb" accent="#dbeafe" isDark={isDark} width={statWidth} />
        <StatCard icon={IoAlertCircle} value={stats.openIssues} label="Open Issues" color="#d97706" accent="#fef3c7" isDark={isDark} width={statWidth} />
        <StatCard icon={IoCheckmarkCircle} value={stats.resolvedIssues} label="Resolved Issues" color="#16a34a" accent="#dcfce7" isDark={isDark} width={statWidth} />
        <StatCard icon={IoStatsChart} value={stats.activePolls} label="Active Polls" color="#7c3aed" accent="#ede9fe" isDark={isDark} width={statWidth} />
      </View>

      <AppCard
        style={[
          styles.codeCard,
          SHADOW,
          {
            borderColor: isDark ? 'rgba(96, 165, 250, 0.22)' : '#bfdbfe',
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255,255,255,0.82)',
            flexDirection: responsive.isMobile ? 'column' : 'row',
            alignItems: responsive.isMobile ? 'flex-start' : 'center',
          },
        ]}
      >
        <View style={styles.codeBlock}>
          <Text style={[styles.codeLabel, { color: isDark ? '#93c5fd' : '#2563eb' }]}>Society Access Code</Text>
          <Text style={[styles.codeValue, { color: isDark ? '#ffffff' : '#1d4ed8' }]}>{societyCode || '------'}</Text>
          <Text style={[styles.codeHint, { color: isDark ? '#94a3b8' : '#64748b' }]}>Share this with residents during onboarding</Text>
        </View>
        <Pressable
          onPress={handleCopyCode}
          style={({ hovered, pressed }) => [
            styles.copyButton,
            {
              marginTop: responsive.isMobile ? 16 : 0,
              backgroundColor: isDark ? 'rgba(37, 99, 235, 0.18)' : '#eff6ff',
              borderColor: isDark ? 'rgba(96, 165, 250, 0.18)' : '#bfdbfe',
              opacity: pressed ? 0.92 : 1,
              transform: [{ scale: hovered ? 1.02 : 1 }],
            },
          ]}
        >
          <IoCopy size={18} color={isDark ? '#bfdbfe' : '#2563eb'} />
          <Text style={[styles.copyLabel, { color: isDark ? '#dbeafe' : '#1d4ed8' }]}>Copy</Text>
        </Pressable>
      </AppCard>

      <SectionHeader
        title="Quick Actions"
        subtitle="Core admin workflows, all in one premium control grid"
        rightComponent={
          <Pressable onPress={() => onNavigate('ResidentApproval')}>
            <Text style={styles.sectionLink}>View queue</Text>
          </Pressable>
        }
      />
      <View style={[styles.actionsGrid, { gap: gridGap }]}>
        {MANAGEMENT_ACTIONS.map((action) => (
          <ActionCard key={action.key} action={action} onPress={() => onNavigate(action.screen)} isDark={isDark} width={actionWidth} />
        ))}
      </View>

      <SectionHeader
        title="Recent Activity"
        subtitle="Live updates from issues, broadcasts, and daily operations"
        rightComponent={
          <Pressable onPress={() => onNavigate('BroadcastHistory')}>
            <Text style={styles.sectionLink}>Open history</Text>
          </Pressable>
        }
      />
      <AppCard
        style={[
          styles.activityPanel,
          SHADOW,
          {
            borderColor: isDark ? 'rgba(148, 163, 184, 0.15)' : '#e2e8f0',
            backgroundColor: isDark ? '#111827' : '#ffffff',
          },
        ]}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={[styles.loadingText, { color: isDark ? '#94a3b8' : '#64748b' }]}>Refreshing society activity...</Text>
          </View>
        ) : recentActivityItems.length ? (
          recentActivityItems.map((item) => <ActivityItem key={item.id} item={item} isDark={isDark} />)
        ) : (
          <EmptyState message="No recent activity available." icon={FiInbox} />
        )}
      </AppCard>

      <SectionHeader
        title="SOS Alerts Preview"
        subtitle="Emergency feed with clear priority when active alerts need attention"
      />
      <View style={styles.sosSection}>
        {activeSOS.length ? (
          activeSOS.map((item) => (
            <SOSPreviewCard key={item.id} item={item} isDark={isDark} onPress={() => onNavigate('SOSAlertsScreen')} />
          ))
        ) : (
          <AppCard
            style={[
              styles.sosEmptyCard,
              SHADOW,
              {
                borderColor: isDark ? 'rgba(148, 163, 184, 0.15)' : '#e2e8f0',
                backgroundColor: isDark ? '#111827' : '#ffffff',
              },
            ]}
          >
            <EmptyState message="No active SOS alerts right now." icon={FiInbox} />
          </AppCard>
        )}
      </View>

      <SectionHeader title="Quick Snapshot" subtitle="Mini cards for the queues that usually need the fastest attention" />
      <View style={[styles.snapshotRow, { flexDirection: responsive.snapshotDirection }]}>
        <SnapshotCard
          icon={IoPeople}
          label="Pending approvals"
          value={pendingResidentsCount}
          actionLabel="Review residents"
          onPress={() => onNavigate('ResidentApproval')}
          accent="#2563eb"
          isDark={isDark}
        />
        <SnapshotCard
          icon={IoCheckmarkDoneCircle}
          label="Issues awaiting closure"
          value={stats.openIssues}
          actionLabel="Open tracker"
          onPress={() => onNavigate('IssueManagement')}
          accent="#d97706"
          isDark={isDark}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingTop: 20,
    paddingBottom: 36,
  },
  heroShell: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 28,
    padding: 24,
    gap: 18,
    marginBottom: 18,
  },
  heroBackdropOne: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(37, 99, 235, 0.10)',
    top: -40,
    right: -30,
  },
  heroBackdropTwo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    bottom: -24,
    right: 90,
  },
  heroContent: {
    flex: 1,
    minWidth: 0,
  },
  heroPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(219, 234, 254, 0.85)',
    marginBottom: 14,
  },
  heroPillText: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  heroSubtitle: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 720,
  },
  heroAction: {
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  heroActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 18,
  },
  statCard: {
    minHeight: 132,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 999,
    top: -28,
    right: -28,
    opacity: 0.55,
  },
  statIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    marginTop: 18,
    fontSize: 28,
    fontWeight: '900',
  },
  statLabel: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700',
  },
  codeCard: {
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(18px)',
      },
      default: {},
    }),
  },
  codeBlock: {
    flex: 1,
    minWidth: 0,
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  codeValue: {
    marginTop: 10,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 5,
  },
  codeHint: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
  },
  copyButton: {
    minWidth: 112,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  copyLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  sectionLink: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '700',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  actionCard: {
    minHeight: 158,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    marginBottom: 2,
  },
  actionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 21,
  },
  actionSubtitle: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
  },
  actionFooter: {
    marginTop: 'auto',
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionLink: {
    fontSize: 13,
    fontWeight: '800',
  },
  activityPanel: {
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 8,
  },
  loadingWrap: {
    paddingVertical: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 8,
  },
  activityRail: {
    width: 18,
    alignItems: 'center',
    marginRight: 10,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 8,
  },
  activityLine: {
    width: 2,
    flex: 1,
    marginTop: 6,
    borderRadius: 999,
  },
  activityBody: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  activityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  activityTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  activityStatus: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activityStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  activitySubtitle: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
  },
  activityMeta: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityTime: {
    fontSize: 12,
    fontWeight: '600',
  },
  sosSection: {
    marginBottom: 8,
  },
  sosCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
  },
  sosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sosBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  sosBadgeText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '800',
  },
  sosTime: {
    fontSize: 12,
    fontWeight: '700',
  },
  sosTitle: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: '800',
  },
  sosText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
  },
  sosEmptyCard: {
    borderRadius: 24,
    borderWidth: 1,
  },
  snapshotRow: {
    gap: 14,
  },
  snapshotCard: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 0,
  },
  snapshotTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  snapshotIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapshotValue: {
    fontSize: 30,
    fontWeight: '900',
  },
  snapshotLabel: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  snapshotLinkWrap: {
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  snapshotLink: {
    fontSize: 13,
    fontWeight: '800',
  },
});

export default AdminHomeScreen;
