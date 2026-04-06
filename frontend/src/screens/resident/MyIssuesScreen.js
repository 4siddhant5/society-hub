import React, { memo, useCallback, useMemo, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { FiAlertTriangle, FiCalendar, FiFlag, FiImage, FiPlus, FiX } from 'react-icons/fi';
import AppCard from '../../components/ui/AppCard';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import PrimaryButton from '../../components/ui/PrimaryButton';
import SearchBar from '../../components/ui/SearchBar';
import colors from '../../design/colors';
import spacing from '../../design/spacing';

const IMAGE_HEIGHT = 132;
const WEB_TRANSITION = Platform.OS === 'web' ? { transitionDuration: '180ms' } : null;

const getStatusTone = (status) => {
  const value = `${status || 'Pending'}`.trim().toLowerCase();

  if (value === 'resolved') {
    return { bg: '#dcfce7', text: '#166534' };
  }

  if (value === 'in progress') {
    return { bg: '#dbeafe', text: '#1d4ed8' };
  }

  return { bg: '#fef3c7', text: '#a16207' };
};

const getPriorityTone = (priority) => {
  const value = `${priority || 'N/A'}`.trim().toLowerCase();

  if (value === 'high') {
    return { bg: '#fee2e2', text: '#b91c1c' };
  }

  if (value === 'medium') {
    return { bg: '#ffedd5', text: '#c2410c' };
  }

  if (value === 'low') {
    return { bg: '#ecfccb', text: '#3f6212' };
  }

  return { bg: '#e2e8f0', text: '#475569' };
};

const formatIssueDate = (value) => {
  if (!value) return 'Date unavailable';

  if (typeof value?.toDate === 'function') {
    return value.toDate().toLocaleDateString();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleDateString();
};

const getBeforeImage = (item) => item?.beforeImage || item?.beforeImageUrl || item?.imageUrl || '';
const getAfterImage = (item) => item?.afterImage || item?.afterImageUrl || '';

const ImageSlot = memo(function ImageSlot({ label, uri, isDark, onPreview }) {
  const [hasError, setHasError] = useState(false);
  const resolvedUri = hasError ? '' : uri;

  return (
    <View style={styles.timelineItem}>
      <Text style={[styles.timelineLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{label}</Text>
      {resolvedUri ? (
        <Pressable
          onPress={(event) => {
            event.stopPropagation?.();
            onPreview?.(resolvedUri, label);
          }}
          style={({ pressed }) => [styles.imageFrame, pressed && styles.imageFramePressed]}
        >
          <Image
            source={{ uri: resolvedUri }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setHasError(true)}
          />
          <View style={styles.imageOverlay}>
            <Text style={styles.imageOverlayText}>Tap to view full image</Text>
          </View>
        </Pressable>
      ) : (
        <View
          style={[
            styles.imageFrame,
            styles.placeholderFrame,
            { backgroundColor: isDark ? 'rgba(51, 65, 85, 0.78)' : '#e5e7eb' },
          ]}
        >
          <FiImage size={22} color={isDark ? '#cbd5e1' : '#64748b'} />
          <Text style={[styles.placeholderText, { color: isDark ? '#e2e8f0' : '#475569' }]}>
            No Image Available
          </Text>
        </View>
      )}
    </View>
  );
});

const IssueCard = memo(function IssueCard({
  item,
  isDark,
  isCompact,
  onOpenDetail,
  onOpenImage,
}) {
  const [hovered, setHovered] = useState(false);
  const statusTone = useMemo(() => getStatusTone(item.status), [item.status]);
  const priorityTone = useMemo(() => getPriorityTone(item.priority), [item.priority]);
  const beforeImage = useMemo(() => getBeforeImage(item), [item]);
  const afterImage = useMemo(() => getAfterImage(item), [item]);
  const cardBg = isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.98)';
  const borderColor = isDark ? 'rgba(148, 163, 184, 0.16)' : '#e2e8f0';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const bodyColor = isDark ? '#cbd5e1' : '#475569';
  const subtleColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <Pressable
      onPress={() => onOpenDetail(item)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.cardPressable,
        WEB_TRANSITION,
        hovered && styles.cardHovered,
        pressed && styles.cardPressed,
      ]}
    >
      <AppCard style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerTextWrap}>
            <Text numberOfLines={2} style={[styles.title, { color: titleColor }]}>
              {item.title || 'Untitled issue'}
            </Text>
            <Text style={[styles.date, { color: subtleColor }]}>
              {formatIssueDate(item.createdAt)}
            </Text>
          </View>
          <View style={styles.badgeStack}>
            <View style={[styles.pillBadge, { backgroundColor: priorityTone.bg }]}>
              <Text style={[styles.pillBadgeText, { color: priorityTone.text }]}>
                {item.priority || 'N/A'}
              </Text>
            </View>
            <View style={[styles.pillBadge, { backgroundColor: statusTone.bg }]}>
              <Text style={[styles.pillBadgeText, { color: statusTone.text }]}>{item.status || 'Pending'}</Text>
            </View>
          </View>
        </View>

        <Text numberOfLines={3} style={[styles.description, { color: bodyColor }]}>
          {item.description || 'No description provided.'}
        </Text>

        <View style={[styles.timelineWrap, !isCompact && styles.timelineWrapDesktop]}>
          <ImageSlot label="Before" uri={beforeImage} isDark={isDark} onPreview={onOpenImage} />
          <ImageSlot label="After" uri={afterImage} isDark={isDark} onPreview={onOpenImage} />
        </View>

        <View style={styles.metaRow}>
          <View style={[styles.metaPill, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
            <FiFlag size={13} color={subtleColor} />
            <Text numberOfLines={1} style={[styles.metaText, { color: subtleColor }]}>
              {item.category || 'General'}
            </Text>
          </View>
          <View style={[styles.metaPill, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
            <FiCalendar size={13} color={subtleColor} />
            <Text numberOfLines={1} style={[styles.metaText, { color: subtleColor }]}>
              {formatIssueDate(item.createdAt)}
            </Text>
          </View>
        </View>
      </AppCard>
    </Pressable>
  );
});

const ImagePreviewModal = memo(function ImagePreviewModal({ preview, onClose }) {
  return (
    <Modal transparent animationType="fade" visible={!!preview} onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation?.()}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose} activeOpacity={0.9}>
            <FiX size={18} color="#e2e8f0" />
          </TouchableOpacity>
          <Text style={styles.modalLabel}>{preview?.label || 'Issue Image'}</Text>
          {preview?.uri ? (
            <Image source={{ uri: preview.uri }} style={styles.modalImage} resizeMode="contain" />
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
});

const MyIssuesScreen = ({ issues, onNavigate }) => {
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [preview, setPreview] = useState(null);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1180;
  const numColumns = isTablet ? 2 : width >= 1180 ? 3 : 1;

  const filtered = useMemo(
    () =>
      issues?.filter(
        (issue) =>
          ((issue.title || '').toLowerCase().includes(search.toLowerCase()) ||
            (issue.description || '').toLowerCase().includes(search.toLowerCase()) ||
            (issue.category || '').toLowerCase().includes(search.toLowerCase())) &&
          (filter === 'all' || issue.status === filter)
      ) || [],
    [filter, issues, search]
  );

  const handleOpenDetail = useCallback(
    (item) => {
      onNavigate && onNavigate('IssueDetail', { issue: item });
    },
    [onNavigate]
  );

  const handleOpenPreview = useCallback((uri, label) => {
    setPreview(uri ? { uri, label } : null);
  }, []);

  const handleClosePreview = useCallback(() => setPreview(null), []);

  const handleCreateIssue = useCallback(() => {
    onNavigate && onNavigate('CreateIssue');
  }, [onNavigate]);

  const renderIssue = useCallback(
    ({ item }) => (
      <View
        style={[
          styles.cardColumn,
          numColumns > 1 && styles.cardColumnMulti,
          numColumns === 3 && styles.cardColumnWide,
        ]}
      >
        <IssueCard
          item={item}
          isDark={isDark}
          isCompact={isMobile}
          onOpenDetail={handleOpenDetail}
          onOpenImage={handleOpenPreview}
        />
      </View>
    ),
    [handleOpenDetail, handleOpenPreview, isDark, isMobile, numColumns]
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#020617' : colors.background }]}>
      <FlatList
        key={`issues-${numColumns}`}
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderIssue}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : null}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerArea}>
            <AppCard
              style={[
                styles.heroCard,
                {
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.96)' : '#ffffff',
                  borderColor: isDark ? 'rgba(148, 163, 184, 0.14)' : '#e2e8f0',
                },
              ]}
            >
              <View style={[styles.heroTopRow, isMobile && styles.heroTopRowStack]}>
                <PageHeader
                  eyebrow="Resident Dashboard"
                  title="My Reported Issues"
                  subtitle="Track every request with a cleaner timeline, clearer status updates, and quick image review."
                  contained={false}
                  style={styles.heroHeaderCard}
                />

                {!isMobile ? (
                  <PrimaryButton title="Report New Issue" onPress={handleCreateIssue} icon={FiPlus} style={styles.primaryButton} />
                ) : null}
              </View>

              <View style={[styles.controlsRow, isMobile && styles.controlsRowStack]}>
                <SearchBar
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search by title, description, or category"
                  style={[
                    styles.searchWrap,
                    {
                      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                      borderColor: isDark ? 'rgba(148, 163, 184, 0.14)' : '#dbe4f0',
                    },
                  ]}
                  inputStyle={{ color: isDark ? '#f8fafc' : '#0f172a' }}
                />

                <View style={styles.filterRow}>
                  {['all', 'Pending', 'In Progress', 'Resolved'].map((status) => {
                    const active = filter === status;
                    return (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.filterChip,
                          {
                            backgroundColor: active ? '#2563eb' : isDark ? '#0f172a' : '#ffffff',
                            borderColor: active ? '#2563eb' : isDark ? 'rgba(148, 163, 184, 0.14)' : '#dbe4f0',
                          },
                        ]}
                        onPress={() => setFilter(status)}
                        activeOpacity={0.9}
                      >
                        <Text style={[styles.filterChipText, { color: active ? '#ffffff' : isDark ? '#cbd5e1' : '#475569' }]}>
                          {status}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </AppCard>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <EmptyState message="No issues reported yet." icon={FiAlertTriangle} />
          </View>
        }
      />

      {isMobile ? (
        <TouchableOpacity style={styles.fab} onPress={handleCreateIssue} activeOpacity={0.92}>
          <FiPlus size={24} color="#ffffff" />
        </TouchableOpacity>
      ) : null}

      <ImagePreviewModal preview={preview} onClose={handleClosePreview} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: 18,
    paddingBottom: 108,
  },
  headerArea: {
    marginBottom: 20,
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 0,
  },
  heroHeaderCard: {
    flex: 1,
    padding: 0,
    marginBottom: 0,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  heroTopRowStack: {
    flexDirection: 'column',
  },
  primaryButton: {
    minWidth: 176,
  },
  controlsRow: {
    marginTop: 18,
    gap: 14,
  },
  controlsRowStack: {
    gap: 12,
  },
  searchWrap: {
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  columnWrapper: {
    gap: 16,
    marginBottom: 16,
  },
  cardColumn: {
    marginBottom: 16,
  },
  cardColumnMulti: {
    flex: 1,
  },
  cardColumnWide: {
    maxWidth: '33.333%',
  },
  cardPressable: {
    flex: 1,
  },
  cardHovered: {
    transform: [{ translateY: -4 }],
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
  },
  card: {
    minHeight: 100,
    height: '100%',
    borderWidth: 1,
    padding: 18,
    marginBottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  badgeStack: {
    alignItems: 'flex-end',
    gap: 8,
  },
  pillBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  date: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  timelineWrap: {
    gap: 12,
    marginBottom: 16,
  },
  timelineWrapDesktop: {
    flexDirection: 'row',
  },
  timelineItem: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  imageFrame: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
    height: IMAGE_HEIGHT,
    backgroundColor: '#e2e8f0',
  },
  imageFramePressed: {
    opacity: 0.94,
  },
  placeholderFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e2e8f0',
  },
  imageOverlay: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.74)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  imageOverlayText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  placeholderText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 180,
  },
  emptyWrap: {
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 20px 32px rgba(37, 99, 235, 0.28)',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 960,
    borderRadius: 24,
    backgroundColor: '#0f172a',
    padding: 18,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLabel: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
  },
  modalImage: {
    width: '100%',
    height: 520,
    borderRadius: 18,
    backgroundColor: '#020617',
  },
});

export default MyIssuesScreen;
