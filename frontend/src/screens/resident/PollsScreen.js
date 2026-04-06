import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import SectionHeader from '../../components/ui/SectionHeader';
import EmptyState from '../../components/ui/EmptyState';
import { FiBarChart2 } from 'react-icons/fi';
import PollCard from '../../components/polls/PollCard';
import PollDetailModal from '../../components/polls/PollDetailModal';
import PollMasonryList from '../../components/polls/PollMasonryList';

const getColumns = (width) => {
  if (width >= 768) return 2;
  return 1;
};

const PollsScreen = ({ polls, user, handleVote }) => {
  const { width } = useWindowDimensions();
  const [now, setNow] = useState(Date.now());
  const [selectedPoll, setSelectedPoll] = useState(null);
  const columns = getColumns(width);

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
        userId={user?.uid}
        onVote={handleVote}
        showVoteActions
        onOpenDetail={handleOpenDetail}
      />
    ),
    [handleOpenDetail, handleVote, now, user?.uid]
  );

  return (
    <View style={styles.container}>
      <SectionHeader title="Active Polls" subtitle="Vote once, track live participation, and watch deadlines in real time" />
      <PollMasonryList
        items={polls}
        columns={columns}
        contentContainerStyle={styles.list}
        renderCard={renderCard}
        emptyState={<EmptyState message="No active polls available." icon={FiBarChart2} />}
      />
      <PollDetailModal
        visible={!!selectedPoll}
        poll={selectedPoll}
        now={now}
        userId={user?.uid}
        onVote={handleVote}
        onClose={handleCloseDetail}
        showVoteActions
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
});

export default PollsScreen;
