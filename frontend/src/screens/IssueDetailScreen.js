import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView
} from "react-native";
import StatusBadge from '../components/ui/StatusBadge';

export default function IssueDetailScreen({ issue, goBack }) {
  if (!issue) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Issue Detail</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{issue.title}</Text>
          <StatusBadge status={issue.status} />
        </View>

        <View style={styles.metaRow}>
          {!!issue.category && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{issue.category}</Text>
            </View>
          )}
          {!!issue.priority && (
            <View style={[styles.pill, styles.pillRed]}>
              <Text style={[styles.pillText, { color: '#dc2626' }]}>{issue.priority}</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionLabel}>Description</Text>
        <Text style={styles.description}>{issue.description}</Text>

        {(!!issue.beforeImage || !!issue.beforeImageUrl || !!issue.imageUrl) && (
          <View style={styles.imageSection}>
            <Text style={styles.sectionLabel}>Before Image</Text>
            <Image
              source={{ uri: issue.beforeImage || issue.beforeImageUrl || issue.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
        )}

        {(!!issue.afterImage || !!issue.afterImageUrl) && (
          <View style={styles.imageSection}>
            <Text style={styles.sectionLabel}>After Image (Proof of Resolution)</Text>
            <Image
              source={{ uri: issue.afterImage || issue.afterImageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
        )}

        {!!issue.createdAt && (
          <Text style={styles.date}>
            Reported on: {new Date(issue.createdAt).toLocaleDateString()}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backBtn: { marginRight: 16 },
  backBtnText: { fontSize: 16, color: '#2563eb', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  content: { padding: 20, paddingBottom: 40 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '800', color: '#1e293b', flex: 1, marginRight: 12 },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  pill: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pillRed: { backgroundColor: '#fef2f2' },
  pillText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  description: { fontSize: 15, color: '#334155', lineHeight: 24, marginBottom: 24 },
  imageSection: { marginBottom: 24 },
  image: { width: '100%', height: 220, borderRadius: 16, backgroundColor: '#e2e8f0' },
  date: { fontSize: 12, color: '#94a3b8', textAlign: 'right', marginTop: 8 },
});
