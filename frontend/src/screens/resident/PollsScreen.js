import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { FiBarChart2 } from '../../utils/iconCompat';
import EmptyState from '../../components/ui/EmptyState';
import PollCard from '../../components/polls/PollCard';
import PollDetailModal from '../../components/polls/PollDetailModal';
import PollMasonryList from '../../components/polls/PollMasonryList';
import colors from '../../design/colors';
import spacing from '../../design/spacing';
import { getPollDisplayStatus } from '../../components/polls/pollUtils';

const FILTERS = [
  { key: 'active', label: 'Active' },
  { key: 'closed', label: 'Closed' },
];

const getColumns = (width) => {
  if (width >= 768) return 2;
  return 1;
};

const PollsScreen = ({ polls, user, handleVote }) => {
  const { width } = useWindowDimensions();
  const [now, setNow] = useState(Date.now());
  const [filter, setFilter] = useState('active');
  const [selectedPollId, setSelectedPollId] = useState(null);
  const [pendingVotes, setPendingVotes] = useState({});
  const columns = getColumns(width);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    setPendingVotes((current) => {
      const next = {};

      Object.entries(current).forEach(([pollId, option]) => {
        const poll = (polls || []).find((item) => item.id === pollId);

        if (!poll) {
          return;
        }

        if (poll?.votes?.[user.uid]) {
          return;
        }

        next[pollId] = option;
      });

      const currentKeys = Object.keys(current);
      const nextKeys = Object.keys(next);
      const unchanged = currentKeys.length === nextKeys.length && nextKeys.every((key) => next[key] === current[key]);

      return unchanged ? current : next;
    });
  }, [polls, user?.uid]);

  const mergedPolls = useMemo(
    () =>
      (polls || []).map((poll) => {
        const pendingOption = pendingVotes[poll.id];

        if (!user?.uid || !pendingOption || poll?.votes?.[user.uid]) {
          return poll;
        }

        return {
          ...poll,
          votes: {
            ...(poll?.votes || {}),
            [user.uid]: pendingOption,
          },
        };
      }),
    [pendingVotes, polls, user?.uid]
  );

  const filteredPolls = useMemo(
    () => mergedPolls.filter((poll) => getPollDisplayStatus(poll, now) === filter),
    [filter, mergedPolls, now]
  );

  const selectedPoll = useMemo(
    () => mergedPolls.find((poll) => poll.id === selectedPollId) || null,
    [mergedPolls, selectedPollId]
  );

  const handleOpenDetail = useCallback((poll) => {
    setSelectedPollId(poll?.id || null);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedPollId(null);
  }, []);

  const handleOptimisticVote = useCallback(
    async (poll, selectedOption) => {
      if (!poll?.id || !user?.uid || poll?.votes?.[user.uid] || pendingVotes[poll.id]) {
        return;
      }

      setPendingVotes((current) => ({
        ...current,
        [poll.id]: selectedOption,
      }));

      try {
        const result = await handleVote?.(poll, selectedOption);

        if (result === false) {
          setPendingVotes((current) => {
            const next = { ...current };
            delete next[poll.id];
            return next;
          });
        }
      } catch (error) {
        setPendingVotes((current) => {
          const next = { ...current };
          delete next[poll.id];
          return next;
        });
      }
    },
    [handleVote, pendingVotes, user?.uid]
  );

  const renderCard = useCallback(
    (item) => <PollCard poll={item} now={now} onOpenDetail={handleOpenDetail} />,
    [handleOpenDetail, now]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!selectedPoll}
      >
        <View style={styles.backgroundOrbs}>
          <View style={[styles.orb, styles.orbPrimary]} />
          <View style={[styles.orb, styles.orbSecondary]} />
        </View>

        <View style={styles.shell}>
          <View style={styles.header}>
            <Text style={styles.title}>Polls</Text>
            <Text style={styles.subtitle}>
              Explore active community polls in a cleaner layout, then open a focused modal to vote or review results.
            </Text>
          </View>

          <View style={styles.toolbar}>
            <View style={styles.toggleGroup}>
              {FILTERS.map((option) => {
                const active = filter === option.key;

                return (
                  <Pressable
                    key={option.key}
                    style={[styles.toggleButton, active && styles.toggleButtonActive]}
                    onPress={() => setFilter(option.key)}
                  >
                    <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Text style={styles.filterCopy}>
            {filter === 'active'
              ? 'Open any card to view options, live percentages, and your voting state in one place.'
              : 'Review closed poll outcomes without the main list feeling crowded.'}
          </Text>

          <PollMasonryList
            items={filteredPolls}
            columns={columns}
            contentContainerStyle={styles.list}
            renderCard={renderCard}
            emptyState={
              <EmptyState
                message={filter === 'active' ? 'No active polls available.' : 'No closed polls yet.'}
                icon={FiBarChart2}
              />
            }
          />
        </View>
      </ScrollView>

      <PollDetailModal
        visible={!!selectedPoll}
        poll={selectedPoll}
        now={now}
        userId={user?.uid}
        onVote={handleOptimisticVote}
        onClose={handleCloseDetail}
        showVoteActions
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#f3f7fb',
  },
  scrollView: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: spacing.lg,
  },
  backgroundOrbs: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbPrimary: {
    width: 280,
    height: 280,
    left: -78,
    top: 120,
    backgroundColor: 'rgba(204, 251, 241, 0.55)',
  },
  orbSecondary: {
    width: 260,
    height: 260,
    right: -90,
    top: -30,
    backgroundColor: 'rgba(191, 219, 254, 0.48)',
  },
  shell: {
    width: '100%',
    maxWidth: 1320,
    alignSelf: 'center',
  },
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -0.4,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 6,
    maxWidth: 720,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  toolbar: {
    paddingTop: 4,
  },
  toggleGroup: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    padding: 4,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    borderWidth: 1,
    borderColor: '#dbe2ea',
    gap: 4,
  },
  toggleButton: {
    minHeight: 40,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#ffffff',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  toggleTextActive: {
    color: colors.textPrimary,
  },
  filterCopy: {
    marginTop: 12,
    marginBottom: 16,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    color: '#64748b',
  },
  list: {
    paddingBottom: spacing.md,
  },
});

export default PollsScreen;
