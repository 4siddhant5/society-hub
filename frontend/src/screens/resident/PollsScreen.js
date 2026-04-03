import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text
} from "react-native";
import AppCard from '../../components/ui/AppCard';
import SectionHeader from '../../components/ui/SectionHeader';
import AppButton from '../../components/ui/AppButton';
import EmptyState from '../../components/ui/EmptyState';
import { FiBarChart2 } from 'react-icons/fi';

const PollsScreen = ({ polls, user, handleVote }) => {
  return (
    <View style={styles.container}>
      <SectionHeader title="Active Polls" />
      <FlatList
        data={polls}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const hasVoted = item.votes && item.votes[user.uid];
          return (
            <AppCard style={styles.card}>
              <Text style={styles.question}>{item.question}</Text>
              {item.isClosed && <Text style={styles.closed}>[CLOSED]</Text>}
              <View style={styles.optionsContainer}>
                {item.options.map((opt, idx) => {
                  const votesForOption = Object.values(item.votes || {}).filter(v => v === opt).length;
                  const isMyVote = hasVoted && item.votes[user.uid] === opt;
                  return (
                    <AppButton 
                      key={idx}
                      title={`${opt} (${votesForOption} votes)${isMyVote ? ' ✅' : ''}`}
                      onPress={() => handleVote(item, opt)}
                      type={isMyVote ? 'success' : 'primary'}
                      style={styles.pollButton}
                      disabled={!!hasVoted || item.isClosed}
                      textStyle={styles.buttonText}
                    />
                  );
                })}
              </View>
              <Text style={styles.date}>Created: {new Date(item.createdAt).toLocaleDateString()}</Text>
            </AppCard>
          );
        }}
        ListEmptyComponent={<EmptyState message="No active polls available." icon={FiBarChart2} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { marginBottom: 16 },
  question: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  closed: { color: '#ef4444', fontWeight: 'bold', marginBottom: 8 },
  optionsContainer: { gap: 10 },
  pollButton: { paddingVertical: 10 },
  buttonText: { fontSize: 15 },
  date: { fontSize: 12, color: '#94a3b8', textAlign: 'right', marginTop: 16 }
});

export default PollsScreen;
