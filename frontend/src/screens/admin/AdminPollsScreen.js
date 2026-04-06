import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
  Platform,
} from "react-native";
import AppButton from '../../components/ui/AppButton';
import SectionHeader from '../../components/ui/SectionHeader';
import EmptyState from '../../components/ui/EmptyState';
import { FiBarChart2 } from 'react-icons/fi';
import PollAnalyticsHeader from '../../components/polls/PollAnalyticsHeader';
import PollCard from '../../components/polls/PollCard';
import PollDetailModal from '../../components/polls/PollDetailModal';
import PollMasonryList from '../../components/polls/PollMasonryList';
import { getPollAnalytics } from '../../components/polls/pollUtils';

const getColumns = (width) => {
  if (width >= 768) return 2;
  return 1;
};

const AdminPollsScreen = ({ polls, handleClosePoll, onNavigate, totalUsers = 0 }) => {
  const { width } = useWindowDimensions();
  const [now, setNow] = useState(Date.now());
  const [selectedPoll, setSelectedPoll] = useState(null);
  const columns = getColumns(width);
  const analytics = useMemo(() => getPollAnalytics(polls, totalUsers, now), [now, polls, totalUsers]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenDetail = useCallback((poll) => {
    setSelectedPoll(poll);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedPoll(null);
  }, []);

  const renderCard = useCallback(
    (item) => (
      <PollCard
        poll={item}
        now={now}
        onClosePoll={handleClosePoll}
        showAdminActions
        onOpenDetail={handleOpenDetail}
      />
    ),
    [handleClosePoll, handleOpenDetail, now]
  );

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Polls & Voting"
        subtitle="Gather society feedback with live participation insights"
        rightComponent={
          <AppButton
            title="Add Poll"
            onPress={() => onNavigate('CreatePoll')}
            type="primary"
            style={styles.createBtn}
          />
        }
      />
      <View style={styles.scrollArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <PollAnalyticsHeader analytics={analytics} isCompact={columns === 1} />
          <PollMasonryList
            items={polls}
            columns={columns}
            contentContainerStyle={styles.list}
            renderCard={renderCard}
            emptyState={<EmptyState message="No polls created." icon={FiBarChart2} />}
          />
        </ScrollView>
      </View>
      <PollDetailModal
        visible={!!selectedPoll}
        poll={selectedPoll}
        now={now}
        onClose={handleCloseDetail}
        onClosePoll={handleClosePoll}
        showAdminActions
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0, overflow: 'hidden' },
  scrollArea: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
    height: 'auto',
    ...Platform.select({
      web: {
        overscrollBehavior: 'contain',
      },
      default: {},
    }),
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  list: { paddingBottom: 24 },
  createBtn: { paddingVertical: 8, paddingHorizontal: 12 },
});

export default AdminPollsScreen;
