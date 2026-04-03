import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  TextInput
} from "react-native";
import { useState } from 'react';
import AppCard from '../../components/ui/AppCard';
import SectionHeader from '../../components/ui/SectionHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { FiAlertTriangle } from 'react-icons/fi';

const MyIssuesScreen = ({ issues, onNavigate }) => {
  const { isDark } = useTheme();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = issues?.filter(issue =>
    (
      (issue.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (issue.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (issue.category || "").toLowerCase().includes(search.toLowerCase())
    ) &&
    (filter === "all" || issue.status === filter)
  ) || [];

  const textColor = isDark ? "#ffffff" : "#1e293b";
  const descColor = isDark ? "#aaaaaa" : "#475569";

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f8fafc' }]}>
      <SectionHeader title="My Reported Issues" />
      
      <View style={styles.filterContainer}>
        <TextInput 
          style={styles.searchInput} 
          placeholder="Search my issues..." 
          value={search} 
          onChangeText={setSearch} 
        />
        <View style={styles.filterRow}>
          {['all', 'Pending', 'In Progress', 'Resolved'].map(status => (
            <TouchableOpacity 
              key={status} 
              style={[styles.filterChip, filter === status && styles.filterChipActive]}
              onPress={() => setFilter(status)}
            >
              <Text style={[styles.filterChipText, filter === status && styles.filterChipTextActive]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => onNavigate && onNavigate('IssueDetail', { issue: item })}>
            <AppCard style={styles.card}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: textColor }]}>{item.title}</Text>
                <StatusBadge status={item.status} />
              </View>
              <Text style={[styles.desc, { color: descColor }]}>{item.description}</Text>
              {!!item.beforeImage && (
                <View style={styles.imageBox}>
                  <Text style={styles.imageLabel}>Before</Text>
                  <Image source={{ uri: item.beforeImage }} style={styles.image} resizeMode="cover" />
                </View>
              )}
              {!!item.afterImage && (
                <View style={styles.imageBox}>
                  <Text style={styles.imageLabel}>After</Text>
                  <Image source={{ uri: item.afterImage }} style={styles.image} resizeMode="cover" />
                </View>
              )}
              <View style={styles.meta}>
                <Text style={styles.metaLabel}>Priority: <Text style={styles.metaValue}>{item.priority || 'N/A'}</Text></Text>
                <Text style={styles.metaLabel}>Category: <Text style={styles.metaValue}>{item.category || 'N/A'}</Text></Text>
              </View>
              <Text style={styles.date}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</Text>
            </AppCard>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<EmptyState message="No issues reported yet." icon={FiAlertTriangle} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  filterContainer: { paddingHorizontal: 16, marginBottom: 12 },
  searchInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, marginBottom: 10 },
  filterRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#e2e8f0' },
  filterChipActive: { backgroundColor: '#2563eb' },
  filterChipText: { fontSize: 13, color: '#475569', fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },
  card: { marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '700', color: '#1e293b', flex: 1, marginRight: 8 },
  desc: { fontSize: 14, color: '#64748b', lineHeight: 20, marginBottom: 12 },
  imageBox: { marginBottom: 10 },
  imageLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
  image: { width: '100%', height: 150, borderRadius: 10, backgroundColor: '#f1f5f9' },
  meta: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  metaLabel: { fontSize: 12, color: '#94a3b8' },
  metaValue: { color: '#475569', fontWeight: '600' },
  date: { fontSize: 12, color: '#94a3b8', textAlign: 'right' }
});

export default MyIssuesScreen;
