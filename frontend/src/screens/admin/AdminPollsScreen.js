import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity
} from "react-native";
import AppCard from '../../components/ui/AppCard';
import AppButton from '../../components/ui/AppButton';
import SectionHeader from '../../components/ui/SectionHeader';
import EmptyState from '../../components/ui/EmptyState';
import { FiBarChart2, FiLock } from 'react-icons/fi';

const AdminPollsScreen = ({ polls, handleClosePoll, onNavigate }) => {
  return (
    <View style={styles.container}>
      <SectionHeader 
        title="Polls & Voting" 
        subtitle="Gather society feedback" 
        rightComponent={
          <AppButton 
            title="Add Poll" 
            onPress={() => onNavigate('CreatePoll')} 
            type="primary"
            style={styles.createBtn}
          />
        }
      />
      <FlatList
        data={polls}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <AppCard style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.question}>{item.question}</Text>
              {item.isClosed && <FiLock size={16} color="#ef4444" />}
            </View>
            
            <View style={styles.optionsList}>
              {item.options.map((opt, idx) => {
                const votesCount = Object.values(item.votes || {}).filter(v => v === opt).length;
                return (
                  <View key={idx} style={styles.optionRow}>
                    <Text style={styles.optionText}>{opt}</Text>
                    <Text style={styles.voteCount}>{votesCount} votes</Text>
                  </View>
                );
              })}
            </View>

            {!item.isClosed && (
              <AppButton 
                title="Close Poll" 
                onNavigate
                onPress={() => handleClosePoll(item.id)} 
                type="danger"
                style={styles.closeBtn}
                textStyle={styles.btnText}
              />
            )}
            <Text style={styles.date}>Created: {new Date(item.createdAt).toLocaleDateString()}</Text>
          </AppCard>
        )}
        ListEmptyComponent={<EmptyState message="No polls created." icon={FiBarChart2} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { marginBottom: 12 },
  createBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  question: { fontSize: 16, fontWeight: '700', color: '#1e293b', flex: 1 },
  optionsList: { gap: 8, marginBottom: 16 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 10, borderRadius: 8 },
  optionText: { fontSize: 14, color: '#334155', fontWeight: '500' },
  voteCount: { fontSize: 12, color: '#64748b' },
  closeBtn: { marginTop: 8, paddingVertical: 8 },
  btnText: { fontSize: 14 },
  date: { fontSize: 11, color: '#94a3b8', textAlign: 'right', marginTop: 12 }
});

export default AdminPollsScreen;
