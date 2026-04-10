import React, { useMemo, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';

import AppCard from '../../components/ui/AppCard';
import PageHeader from '../../components/ui/PageHeader';
import SearchBar from '../../components/ui/SearchBar';
import IssueGrid from './components/IssueGrid';
import ImageModal from './components/ImageModal';
import colors from '../../design/colors';
import spacing from '../../design/spacing';

import { db } from '../../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

const notifyIssueOwner = async (item, newStatus) => {
  try {
    const ownerId = item.createdBy || item.userId;
    if (!ownerId || !item.societyId) return;
    await addDoc(collection(db, 'notifications'), {
      type: 'ISSUE_UPDATED',
      title: 'Issue Update',
      message: `Your issue "${item.title}" is now ${newStatus}`,
      societyId: item.societyId,
      targetRole: 'resident',
      userId: ownerId,
      timestamp: Date.now(),
      read: false,
    });
  } catch (error) {
    console.warn('[IssueManagementScreen] notifyIssueOwner error:', error);
  }
};

const IssueManagementScreen = ({
  issues,
  handleStatusChange,
  pickAndUploadImage,
  loading,
  loadingIssueId,
  listLoading,
  onNavigate,
}) => {
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [viewerImage, setViewerImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

  const filtered = useMemo(
    () =>
      issues?.filter(
        (issue) =>
          `${issue.title || ''} ${issue.description || ''} ${issue.category || ''}`
            .toLowerCase()
            .includes(search.toLowerCase()) && (filter === 'all' || issue.status === filter)
      ) || [],
    [issues, filter, search]
  );

  const columns = width >= 1180 ? 3 : width >= 760 ? 2 : 1;
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const descColor = isDark ? '#cbd5e1' : '#475569';
  const inputBg = isDark ? '#1e293b' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#e2e8f0';
  const activeTabBg = isDark ? '#2563eb' : '#1d4ed8';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : colors.background }]}>
      <View style={styles.pagePadding}>
        <PageHeader
          eyebrow="Admin Workspace"
          title="Issue Management"
          subtitle="Track, manage, and resolve resident issues with the same review flow used across the admin experience."
        />
      </View>

      <View style={styles.topSection}>
        <AppCard style={[styles.controlsCard, { backgroundColor: inputBg, borderColor }]}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search issues by title, description, or category"
            style={[styles.searchWrap, { backgroundColor: inputBg, borderColor }]}
            inputStyle={{ color: textColor }}
          />
        <View style={styles.filterRow}>
          {[
            { value: 'all', label: 'All' },
            { value: 'Pending', label: 'Pending' },
            { value: 'In Progress', label: 'In Progress' },
            { value: 'Resolved', label: 'Resolved' },
          ].map((status) => (
            <TouchableOpacity
              key={status.value}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === status.value ? activeTabBg : 'transparent',
                  borderColor: filter === status.value ? activeTabBg : borderColor,
                },
              ]}
              onPress={() => setFilter(status.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: filter === status.value ? '#ffffff' : isDark ? '#cbd5e1' : '#475569' },
                ]}
              >
                {status.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        </AppCard>
      </View>

      {listLoading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={[styles.loaderText, { color: descColor }]}>Loading issues...</Text>
        </View>
      ) : (
        <IssueGrid
          issues={filtered}
          columns={columns}
          isDark={isDark}
          loading={loading}
          loadingIssueId={loadingIssueId}
          onOpenDetail={(item) => onNavigate && onNavigate('IssueDetail', { issue: item })}
          onOpenImage={(uri, label) => setViewerImage({ uri, label })}
          onAssignWorker={(item) => {
            handleStatusChange(item.id, 'In Progress');
            notifyIssueOwner(item, 'In Progress');
          }}
          onResolve={(item) => pickAndUploadImage(item.id)}
          onChat={() => onNavigate && onNavigate('ChatScreen')}
        />
      )}

      <ImageModal
        viewerImage={viewerImage}
        imageLoading={imageLoading}
        onLoadStart={() => setImageLoading(true)}
        onLoadEnd={() => setImageLoading(false)}
        onClose={() => setViewerImage(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  pagePadding: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  topSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  controlsCard: {
    borderRadius: 24,
    padding: spacing.md,
    marginBottom: 0,
  },
  searchWrap: {
    marginBottom: spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default IssueManagementScreen;
