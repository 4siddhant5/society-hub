import React, { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FiActivity, FiBarChart2, FiPlus, FiUsers } from '../../utils/iconCompat';
import EmptyState from '../../components/ui/EmptyState';
import AppButton from '../../components/ui/AppButton';
import AdminExpandablePollCard from '../../components/polls/AdminExpandablePollCard';
import AdminPollDetailModal from '../../components/polls/AdminPollDetailModal';
import AdminPollStatCard from '../../components/polls/AdminPollStatCard';
import { useTheme } from '../../context/ThemeContext';
import spacing from '../../design/spacing';
import { getPollAnalytics, getPollDisplayStatus } from '../../components/polls/pollUtils';

const FILTERS = [
  { key: 'active', label: 'Active Polls' },
  { key: 'closed', label: 'Closed Polls' },
];

const compactValue = (value) =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(
    Number.isFinite(value) ? value : 0
  );

const AdminPollsScreen = ({ polls, handleClosePoll, onNavigate, totalUsers = 0 }) => {
  const { isDark } = useTheme();
  const [now, setNow] = useState(Date.now());
  const [filter, setFilter] = useState('active');
  const [selectedPollId, setSelectedPollId] = useState(null);
  const [contentWidth, setContentWidth] = useState(0);
  const deferredPolls = useDeferredValue(polls || []);
  const analytics = useMemo(
    () => getPollAnalytics(deferredPolls, totalUsers, now),
    [deferredPolls, now, totalUsers]
  );

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedPollId && !deferredPolls.some((item) => item.id === selectedPollId)) {
      setSelectedPollId(null);
    }
  }, [deferredPolls, selectedPollId]);

  const isCompact = contentWidth > 0 ? contentWidth < 920 : true;
  const averageVotes = deferredPolls.length ? Math.round(analytics.totalVotes / deferredPolls.length) : 0;
  const selectedPoll = useMemo(
    () => deferredPolls.find((item) => item.id === selectedPollId) || null,
    [deferredPolls, selectedPollId]
  );
  const filteredPolls = useMemo(
    () => deferredPolls.filter((poll) => getPollDisplayStatus(poll, now) === filter),
    [deferredPolls, filter, now]
  );
  const headerStats = [
    {
      key: 'activePolls',
      label: 'Active Polls',
      value: compactValue(analytics.activePolls),
      meta: `${Math.max(deferredPolls.length - analytics.activePolls, 0)} closed currently`,
      icon: FiBarChart2,
      accent: '#38bdf8',
    },
    {
      key: 'totalVotes',
      label: 'Total Votes',
      value: compactValue(analytics.totalVotes),
      meta: deferredPolls.length ? `${averageVotes} average votes per poll` : 'No vote activity yet',
      icon: FiUsers,
      accent: '#34d399',
    },
    {
      key: 'engagementRate',
      label: 'Engagement Rate',
      value: `${analytics.engagementRate}%`,
      meta: totalUsers ? `Based on ${totalUsers} residents` : 'Resident count unavailable',
      icon: FiActivity,
      accent: '#f59e0b',
    },
  ];

  const confirmClosePoll = (poll) => {
    if (!poll?.id) {
      return;
    }

    const runClose = () => handleClosePoll?.(poll.id);

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm('Close this poll? Residents will no longer be able to vote.')) {
        runClose();
      }
      return;
    }

    Alert.alert('Close Poll', 'Residents will no longer be able to vote in this poll.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Close Poll', style: 'destructive', onPress: runClose },
    ]);
  };

  const openPollDetail = (poll) => {
    startTransition(() => {
      setSelectedPollId(poll?.id || null);
    });
  };

  const closePollDetail = () => {
    startTransition(() => {
      setSelectedPollId(null);
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#07111f' : '#f3f7fb' }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!selectedPoll}
      >
        <View style={styles.backgroundOrbs}>
          <View style={[styles.orb, styles.orbPrimary, { opacity: isDark ? 0.22 : 0.45 }]} />
          <View style={[styles.orb, styles.orbSecondary, { opacity: isDark ? 0.18 : 0.34 }]} />
        </View>

        <View style={styles.shell} onLayout={(event) => setContentWidth(event.nativeEvent.layout.width)}>
          <View style={[styles.statsGrid, isCompact && styles.statsGridCompact]}>
            {headerStats.map((item) => (
              <AdminPollStatCard
                key={item.key}
                icon={item.icon}
                label={item.label}
                value={item.value}
                meta={item.meta}
                accent={item.accent}
              />
            ))}
          </View>

          <View style={[styles.toolbar, isCompact && styles.toolbarCompact]}>
            <View
              style={[
                styles.toggleGroup,
                {
                  backgroundColor: isDark ? 'rgba(15,23,42,0.82)' : '#e2e8f0',
                  borderColor: isDark ? 'rgba(148,163,184,0.12)' : '#dbe2ea',
                },
              ]}
            >
              {FILTERS.map((option) => {
                const active = filter === option.key;

                return (
                  <Pressable
                    key={option.key}
                    onPress={() => setFilter(option.key)}
                    style={[
                      styles.toggleButton,
                      active && {
                        backgroundColor: isDark ? 'rgba(30,41,59,0.96)' : '#ffffff',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        { color: isDark ? '#94a3b8' : '#475569' },
                        active && { color: isDark ? '#f8fafc' : '#0f172a' },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <AppButton
              title="Add Poll"
              onPress={() => onNavigate('CreatePoll')}
              icon={FiPlus}
              style={[styles.addPollButton, isCompact && styles.addPollButtonCompact]}
            />
          </View>

          <Text style={[styles.listSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            {filter === 'active'
              ? 'Open a poll to review voting progress and admin actions in a focused overlay.'
              : 'Review closed results in a dedicated modal without disrupting the list layout.'}
          </Text>

          {!filteredPolls.length ? (
            <View style={styles.emptyWrap}>
              <EmptyState
                message={filter === 'active' ? 'No active polls created.' : 'No closed polls available.'}
                icon={FiBarChart2}
              />
            </View>
          ) : (
            <View style={[styles.pollGrid, isCompact && styles.pollGridCompact]}>
              {filteredPolls.map((poll) => (
                <View key={poll.id} style={[styles.pollGridItem, isCompact && styles.pollGridItemCompact]}>
                  <AdminExpandablePollCard
                    poll={poll}
                    now={now}
                    onOpenDetail={openPollDetail}
                    isDark={isDark}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <AdminPollDetailModal
        visible={!!selectedPoll}
        poll={selectedPoll}
        now={now}
        onClose={closePollDetail}
        onConfirmClose={confirmClosePoll}
        totalUsers={totalUsers}
        isDark={isDark}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 28 },
  backgroundOrbs: { ...StyleSheet.absoluteFillObject, pointerEvents: 'none' },
  orb: { position: 'absolute', borderRadius: 999 },
  orbPrimary: { width: 340, height: 340, right: -110, top: -70, backgroundColor: '#bfdbfe' },
  orbSecondary: { width: 280, height: 280, left: -80, top: 220, backgroundColor: '#ccfbf1' },
  shell: { width: '100%', maxWidth: 1440, alignSelf: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg, marginTop: 4 },
  statsGridCompact: { flexDirection: 'column' },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toolbarCompact: {
    alignItems: 'stretch',
  },
  toggleGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'flex-start',
    padding: 4,
    borderRadius: 999,
    borderWidth: 1,
    gap: 4,
  },
  toggleButton: {
    minHeight: 40,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '800',
  },
  addPollButton: {
    minWidth: 150,
    paddingHorizontal: 18,
    marginLeft: 'auto',
  },
  addPollButtonCompact: {
    width: '100%',
    marginLeft: 0,
  },
  listSubtitle: {
    marginTop: 12,
    marginBottom: 16,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  emptyWrap: { marginTop: 10 },
  pollGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, alignItems: 'flex-start' },
  pollGridCompact: { flexDirection: 'column' },
  pollGridItem: { width: '48.7%' },
  pollGridItemCompact: { width: '100%' },
});

export default AdminPollsScreen;
