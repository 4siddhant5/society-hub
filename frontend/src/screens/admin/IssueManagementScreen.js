import React, { useMemo, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';

import AppCard from '../../components/ui/AppCard';
import SectionHeader from '../../components/ui/SectionHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { FiAlertTriangle, FiSearch, FiX } from 'react-icons/fi';

import { db } from '../../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

const screen = Dimensions.get('window');

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
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [viewerImage, setViewerImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

  const filtered = useMemo(
    () =>
      issues?.filter(
        (issue) =>
          (`${issue.title || ''} ${issue.description || ''} ${issue.category || ''}`.toLowerCase().includes(search.toLowerCase()) &&
            (filter === 'all' || issue.status === filter))
      ) || [],
    [issues, filter, search]
  );

  const textColor = isDark ? '#ffffff' : '#0f172a';
  const descColor = isDark ? '#cbd5e1' : '#475569';
  const inputBg = isDark ? '#1e293b' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  const renderImagePreview = (uri, label) => {
    if (!uri) return null;

    return (
      <View style={styles.imageBox}>
        <Text style={styles.imageLabel}>{label}</Text>
        <TouchableOpacity activeOpacity={0.92} onPress={(event) => {
          event.stopPropagation?.();
          setViewerImage({ uri, label });
        }}>
          <Image source={{ uri }} style={styles.image} resizeMode="cover" />
          <View style={styles.imageHintOverlay}>
            <Text style={styles.imageHintText}>Tap to view full image</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f8fafc' }]}>
      <SectionHeader title="Issue Management" subtitle="Track, review, and resolve issues with better visibility" />

      <View style={styles.filterContainer}>
        <View style={[styles.searchWrap, { backgroundColor: inputBg, borderColor }]}>
          <FiSearch size={16} color={isDark ? '#94a3b8' : '#64748b'} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search by issue title, description, or category"
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <View style={styles.filterRow}>
          {['all', 'Pending', 'In Progress', 'Resolved'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' },
                filter === status && styles.filterChipActive,
              ]}
              onPress={() => setFilter(status)}
            >
              <Text style={[styles.filterChipText, { color: isDark ? '#cbd5e1' : '#475569' }, filter === status && styles.filterChipTextActive]}>{status}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {listLoading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={[styles.loaderText, { color: descColor }]}>Loading issues...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.95} onPress={() => onNavigate && onNavigate('IssueDetail', { issue: item })}>
              <AppCard style={[styles.card, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }]}>
                <View style={styles.header}>
                  <View style={styles.titleArea}>
                    <Text style={[styles.title, { color: textColor }]}>{item.title}</Text>
                    <Text style={styles.priority}>Priority: {item.priority || 'Normal'}</Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>

                <Text style={[styles.desc, { color: descColor }]}>{item.description || 'No description added.'}</Text>

                {item.status !== 'Resolved' && (
                  <View style={styles.actionRow}>
                    {item.status !== 'In Progress' && (
                      <TouchableOpacity
                        style={styles.statusLink}
                        onPress={(event) => {
                          event.stopPropagation?.();
                          handleStatusChange(item.id, 'In Progress');
                          notifyIssueOwner(item, 'In Progress');
                        }}
                      >
                        <Text style={styles.statusLinkText}>Mark In Progress</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.resolveBtn}
                      onPress={(event) => {
                        event.stopPropagation?.();
                        pickAndUploadImage(item.id);
                      }}
                      disabled={loading}
                    >
                      <Text style={styles.resolveBtnText}>
                        {loading && loadingIssueId === item.id ? 'Uploading...' : 'Mark Resolved (+Proof)'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {renderImagePreview(item.beforeImage || item.beforeImageUrl || item.imageUrl, 'Before Image')}
                {renderImagePreview(item.afterImage || item.afterImageUrl, 'After Image (Proof)')}

                <Text style={styles.date}>Created: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</Text>
              </AppCard>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<EmptyState message="No issues found for this filter." icon={FiAlertTriangle} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={!!viewerImage} transparent animationType="fade" onRequestClose={() => setViewerImage(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setViewerImage(null)}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation?.()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{viewerImage?.label || 'Issue Image'}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setViewerImage(null)}>
                <FiX size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.zoomWrap}
              contentContainerStyle={styles.zoomContent}
              maximumZoomScale={4}
              minimumZoomScale={1}
              centerContent
              bouncesZoom
            >
              {viewerImage?.uri ? (
                <>
                  {imageLoading ? (
                    <View style={styles.modalLoader}>
                      <ActivityIndicator size="large" color="#ffffff" />
                    </View>
                  ) : null}
                  <Image
                    source={{ uri: viewerImage.uri }}
                    style={styles.fullImage}
                    resizeMode="contain"
                    onLoadStart={() => setImageLoading(true)}
                    onLoadEnd={() => setImageLoading(false)}
                  />
                </>
              ) : null}
            </ScrollView>
            <Text style={styles.modalHint}>Tap outside or use the close button to exit.</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 28 },
  filterContainer: { paddingHorizontal: 16, marginBottom: 12 },
  searchWrap: {
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, paddingVertical: 0 },
  filterRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  filterChipActive: { backgroundColor: '#2563eb' },
  filterChipText: { fontSize: 13, color: '#475569', fontWeight: '700' },
  filterChipTextActive: { color: '#ffffff' },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  loaderText: { marginTop: 12, fontSize: 14, fontWeight: '600' },
  card: { marginBottom: 16, borderRadius: 22 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  titleArea: { flex: 1, marginRight: 8 },
  title: { fontSize: 16, fontWeight: '800' },
  priority: { fontSize: 12, color: '#ef4444', fontWeight: '700', marginTop: 4, textTransform: 'uppercase' },
  desc: { fontSize: 14, lineHeight: 21, marginBottom: 16 },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginBottom: 16 },
  statusLink: { paddingHorizontal: 4, paddingVertical: 6 },
  statusLinkText: { fontSize: 14, color: '#2563eb', fontWeight: '700' },
  resolveBtn: { backgroundColor: '#16a34a', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  resolveBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  imageBox: { marginTop: 6, marginBottom: 10 },
  imageLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 },
  image: { width: '100%', height: 180, borderRadius: 16, backgroundColor: '#e2e8f0' },
  imageHintOverlay: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  imageHintText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  date: { fontSize: 12, color: '#94a3b8', textAlign: 'right', marginTop: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.94)',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 28,
  },
  modalCard: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: '#020617',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
  },
  modalTitle: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(148, 163, 184, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomWrap: { flex: 1 },
  zoomContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  fullImage: { width: screen.width - 48, height: screen.height * 0.7 },
  modalLoader: { position: 'absolute', top: '50%', alignSelf: 'center', zIndex: 2 },
  modalHint: {
    color: '#cbd5e1',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
});

export default IssueManagementScreen;
