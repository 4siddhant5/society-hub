import React, { useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AppCard from '../../components/ui/AppCard';
import SectionHeader from '../../components/ui/SectionHeader';
import EmptyState from '../../components/ui/EmptyState';
import {
  IoPeople,
  IoAlertCircle,
  IoCheckmarkCircle,
  IoStatsChart,
  IoCopy,
  IoFlash,
  IoMegaphone,
  IoChevronForward,
  IoChatbubbles,
  IoCalendar,
  IoDocumentText,
  IoShieldHalf,
} from 'react-icons/io5';
import { FiActivity, FiInbox } from 'react-icons/fi';

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
    key: 'chat',
    title: 'Community Chat',
    subtitle: 'Open resident chat',
    screen: 'ChatScreen',
    accent: '#0f766e',
    tint: '#ecfeff',
    icon: IoChatbubbles,
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
    key: 'sos',
    title: 'Emergency Feed',
    subtitle: 'Track SOS alerts',
    screen: 'SOSAlertsScreen',
    accent: '#dc2626',
    tint: '#fef2f2',
    icon: IoShieldHalf,
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
];

const StatCard = ({ icon: Icon, value, label, color, bgColor, isDark }) => (
  <View style={[styles.statCard, { backgroundColor: isDark ? '#1e1e1e' : bgColor, borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
    <View style={[styles.statIconWrapper, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
      <Icon size={20} color={color} />
    </View>
    <Text style={[styles.statValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: isDark ? '#cbd5e1' : '#64748b' }]}>{label}</Text>
  </View>
);

const AlertCard = ({ item, isDark, onPress }) => (
  <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
    <AppCard style={[styles.alertCard, { backgroundColor: isDark ? '#2a1215' : '#fff1f2', borderColor: isDark ? '#7f1d1d' : '#fecdd3' }]}>
      <View style={styles.alertHeaderRow}>
        <View style={[styles.alertPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff' }]}>
          <IoFlash size={14} color="#dc2626" />
          <Text style={styles.alertPillText}>High Priority</Text>
        </View>
        <IoChevronForward size={16} color={isDark ? '#fda4af' : '#e11d48'} />
      </View>
      <Text style={[styles.alertTitle, { color: isDark ? '#ffffff' : '#881337' }]}>{item.userName || item.senderName || 'Resident SOS Alert'}</Text>
      <Text style={[styles.alertText, { color: isDark ? '#fecdd3' : '#9f1239' }]}>
        Immediate assistance requested
        {item.location ? ` - ${item.location}` : item.flat ? ` - Flat ${item.flat}` : ''}
      </Text>
    </AppCard>
  </TouchableOpacity>
);

const ActivityItem = ({ item, isDark, tone }) => (
  <View style={[styles.activityItem, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
    <View style={[styles.activityMarker, { backgroundColor: tone }]} />
    <View style={styles.activityContent}>
      <Text style={[styles.activityTitle, { color: isDark ? '#ffffff' : '#0f172a' }]} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={[styles.activitySubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]} numberOfLines={2}>
        {item.subtitle}
      </Text>
    </View>
    <Text style={[styles.activityTime, { color: isDark ? '#94a3b8' : '#94a3b8' }]}>{item.time}</Text>
  </View>
);

const formatTime = (ts) => {
  if (!ts) return '';
  try {
    const date = new Date(ts?.toDate ? ts.toDate() : ts);
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

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

  const handleCopyCode = () => {
    Alert.alert('Access Code', societyCode ? `Society code: ${societyCode}` : 'No society access code available.');
  };

  const recentActivityItems = useMemo(() => {
    const issueItems = issues.slice(0, 3).map((item) => ({
      id: `issue-${item.id}`,
      title: item.title || 'Issue reported',
      subtitle: `${item.category || 'General'}${item.status ? ` - ${item.status}` : ''}`,
      time: formatTime(item.createdAt),
      tone: '#f59e0b',
      sortValue: item.createdAt?.toDate ? item.createdAt.toDate().getTime() : Number(item.createdAt || 0),
    }));

    const broadcastItems = broadcasts.slice(0, 3).map((item) => ({
      id: `broadcast-${item.id}`,
      title: item.title || 'Broadcast sent',
      subtitle: item.message || 'Society-wide update shared',
      time: formatTime(item.timestamp),
      tone: '#2563eb',
      sortValue: item.timestamp?.toDate ? item.timestamp.toDate().getTime() : Number(item.timestamp || 0),
    }));

    return [...issueItems, ...broadcastItems]
      .sort((a, b) => b.sortValue - a.sortValue)
      .slice(0, 6);
  }, [broadcasts, issues]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f8fafc' }]} contentContainerStyle={styles.content}>
      <View style={styles.heroSection}>
        <View style={[styles.heroHeader, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
          <View style={styles.heroTextWrap}>
            <Text style={[styles.heroTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>Society overview</Text>
            <Text style={[styles.heroSubtitle, { color: isDark ? '#cbd5e1' : '#64748b' }]}>A cleaner command center for daily operations.</Text>
          </View>
          <TouchableOpacity onPress={() => onNavigate('BroadcastScreen')} activeOpacity={0.85} style={[styles.heroAction, { backgroundColor: isDark ? '#2563eb' : '#0f172a' }]}>
            <IoMegaphone size={16} color="#ffffff" />
            <Text style={styles.heroActionText}>Send Broadcast</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard icon={IoPeople} value={stats.residents} label="Residents" color="#2563eb" bgColor="#eff6ff" isDark={isDark} />
        <StatCard icon={IoAlertCircle} value={stats.openIssues} label="Open Issues" color="#f59e0b" bgColor="#fffbeb" isDark={isDark} />
        <StatCard icon={IoCheckmarkCircle} value={stats.resolvedIssues} label="Resolved" color="#16a34a" bgColor="#f0fdf4" isDark={isDark} />
        <StatCard icon={IoStatsChart} value={stats.activePolls} label="Active Polls" color="#7c3aed" bgColor="#f5f3ff" isDark={isDark} />
      </View>

      <AppCard style={[styles.codeCard, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff', borderColor: isDark ? '#334155' : '#dbeafe' }]}>
        <View style={styles.codeTextWrap}>
          <Text style={[styles.codeLabel, { color: isDark ? '#60a5fa' : '#2563eb' }]}>Society Access Code</Text>
          <Text style={[styles.codeValue, { color: isDark ? '#ffffff' : '#1d4ed8' }]}>{societyCode || '------'}</Text>
          <Text style={[styles.codeHint, { color: isDark ? '#94a3b8' : '#64748b' }]}>Share this with residents during onboarding.</Text>
        </View>
        <TouchableOpacity activeOpacity={0.85} onPress={handleCopyCode} style={[styles.copyButton, { backgroundColor: isDark ? '#0f172a' : '#eff6ff' }]}>
          <IoCopy size={18} color={isDark ? '#ffffff' : '#2563eb'} />
        </TouchableOpacity>
      </AppCard>

      <SectionHeader title="Quick Actions" subtitle="Management center shortcuts for core admin workflows" />
      <View style={styles.sectionBody}>
        <View style={styles.managementGrid}>
          {MANAGEMENT_ACTIONS.map((action) => {
            const Icon = action.icon;

            return (
              <TouchableOpacity
                key={action.key}
                activeOpacity={0.86}
                onPress={() => onNavigate(action.screen)}
                style={[
                  styles.managementCard,
                  {
                    backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                  },
                ]}
              >
                <View style={[styles.managementIconWrap, { backgroundColor: isDark ? '#0f172a' : action.tint }]}>
                  <Icon size={18} color={action.accent} />
                </View>
                <Text style={[styles.managementTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>{action.title}</Text>
                <Text style={[styles.managementSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>{action.subtitle}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <SectionHeader title="Recent Activity" subtitle="A quick read on what changed across the society" />
      <View style={styles.sectionBody}>
        <AppCard style={[styles.activityPanel, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }]}>
          <View style={styles.panelHeader}>
            <View style={styles.panelTitleRow}>
              <FiActivity size={16} color={isDark ? '#fbbf24' : '#d97706'} />
              <Text style={[styles.panelTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>Issues + Broadcasts</Text>
            </View>
            <TouchableOpacity onPress={() => onNavigate('BroadcastHistory')}>
              <Text style={styles.panelLink}>Open history</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color="#2563eb" />
            </View>
          ) : recentActivityItems.length ? (
            recentActivityItems.map((item) => <ActivityItem key={item.id} item={item} isDark={isDark} tone={item.tone} />)
          ) : (
            <EmptyState message="No recent activity available." icon={FiInbox} />
          )}
        </AppCard>
      </View>

      <SectionHeader title="SOS Alerts Preview" subtitle="Active emergency notices that may need a response" />
      <View style={styles.sectionBody}>
        {activeSOS.length ? (
          activeSOS.map((item) => <AlertCard key={item.id} item={item} isDark={isDark} onPress={() => onNavigate('SOSAlertsScreen')} />)
        ) : (
          <AppCard style={[styles.emptyCard, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }]}>
            <EmptyState message="No active SOS alerts right now." icon={FiInbox} />
          </AppCard>
        )}
      </View>

      <SectionHeader title="Quick Snapshot" subtitle="A compact view of approval and issue pressure" />
      <View style={styles.sectionBody}>
        <View style={styles.snapshotRow}>
          <AppCard style={[styles.snapshotCard, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }]}>
            <Text style={[styles.snapshotValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>{pendingResidentsCount}</Text>
            <Text style={[styles.snapshotLabel, { color: isDark ? '#cbd5e1' : '#64748b' }]}>Pending approvals</Text>
            <TouchableOpacity onPress={() => onNavigate('ResidentApproval')}>
              <Text style={styles.panelLink}>Review residents</Text>
            </TouchableOpacity>
          </AppCard>
          <AppCard style={[styles.snapshotCard, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }]}>
            <Text style={[styles.snapshotValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>{stats.openIssues}</Text>
            <Text style={[styles.snapshotLabel, { color: isDark ? '#cbd5e1' : '#64748b' }]}>Issues awaiting closure</Text>
            <TouchableOpacity onPress={() => onNavigate('IssueManagement')}>
              <Text style={styles.panelLink}>Open tracker</Text>
            </TouchableOpacity>
          </AppCard>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 32 },
  heroSection: { paddingHorizontal: 16, paddingTop: 20 },
  heroHeader: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  heroTextWrap: { flex: 1 },
  heroTitle: { fontSize: 24, fontWeight: '800' },
  heroSubtitle: { marginTop: 6, fontSize: 14, lineHeight: 20 },
  heroAction: {
    minHeight: 42,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0px 10px 18px rgba(15, 23, 42, 0.18)',
  },
  heroActionText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  statCard: {
    width: '48%',
    minHeight: 124,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  statIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: 26, fontWeight: '800', marginTop: 16 },
  statLabel: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  codeCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeTextWrap: { flex: 1, marginRight: 12 },
  codeLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  codeValue: { fontSize: 24, fontWeight: '900', letterSpacing: 4, marginTop: 6 },
  codeHint: { fontSize: 13, marginTop: 6 },
  copyButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBody: { paddingHorizontal: 16 },
  managementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  managementCard: {
    width: '48%',
    minHeight: 138,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 2,
    boxShadow: '0px 10px 22px rgba(15, 23, 42, 0.08)',
  },
  managementIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  managementTitle: { fontSize: 15, fontWeight: '800', lineHeight: 20 },
  managementSubtitle: { fontSize: 12, lineHeight: 18, marginTop: 8 },
  alertCard: { marginBottom: 12, borderWidth: 1 },
  alertHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  alertPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  alertPillText: { color: '#dc2626', fontSize: 12, fontWeight: '800' },
  alertTitle: { fontSize: 16, fontWeight: '800', marginTop: 14 },
  alertText: { fontSize: 13, lineHeight: 19, marginTop: 6 },
  emptyCard: { paddingVertical: 8 },
  activityPanel: { borderRadius: 20, marginBottom: 14 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  panelTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  panelTitle: { fontSize: 16, fontWeight: '800' },
  panelLink: { color: '#2563eb', fontSize: 13, fontWeight: '700' },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  activityMarker: { width: 10, height: 10, borderRadius: 999, marginRight: 12 },
  activityContent: { flex: 1, marginRight: 12 },
  activityTitle: { fontSize: 14, fontWeight: '700' },
  activitySubtitle: { fontSize: 12, marginTop: 4, lineHeight: 18 },
  activityTime: { fontSize: 11, fontWeight: '600' },
  loadingWrap: { paddingVertical: 28, alignItems: 'center', justifyContent: 'center' },
  snapshotRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  snapshotCard: { flex: 1, borderRadius: 20, marginBottom: 0 },
  snapshotValue: { fontSize: 28, fontWeight: '900' },
  snapshotLabel: { fontSize: 13, marginTop: 8, marginBottom: 14, lineHeight: 18 },
});

export default AdminHomeScreen;
