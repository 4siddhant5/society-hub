import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { FiArrowRight, FiBell, FiCalendar, FiFileText, FiX } from '../../utils/iconCompat';
import { useTheme } from '../../context/ThemeContext';
import EmptyState from '../../components/ui/EmptyState';
import SearchBar from '../../components/ui/SearchBar';
import colors from '../../design/colors';
import shadows from '../../design/shadows';
import spacing from '../../design/spacing';

const WEB_CARD_TRANSITION = Platform.OS === 'web'
  ? { transitionDuration: '200ms', transitionProperty: 'transform, box-shadow, border-color' }
  : null;

const TABS = [
  { key: 'announcements', label: 'Announcements' },
  { key: 'broadcasts', label: 'Broadcasts' },
];

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  if (value?.seconds) return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatItemDate = (value) => {
  const millis = toMillis(value);
  if (!millis) return 'Recently';

  return new Date(millis).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getAnnouncementBody = (item) => item?.description || item?.message || item?.fullText || '';
const getBroadcastBody = (item) => item?.message || item?.description || item?.fullText || '';
const getBroadcastDateValue = (item) => item?.timestamp || item?.createdAt || 0;

const ActionChip = memo(function ActionChip({
  label,
  icon: Icon,
  onPress,
  isDark,
  variant = 'neutral',
  stopPropagation = false,
  style,
}) {
  const palette = variant === 'accent'
    ? {
        backgroundColor: isDark ? 'rgba(37, 99, 235, 0.18)' : '#eff6ff',
        borderColor: isDark ? 'rgba(96, 165, 250, 0.24)' : '#bfdbfe',
        textColor: isDark ? '#bfdbfe' : '#2563eb',
      }
    : {
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.42)' : '#ffffff',
        borderColor: isDark ? 'rgba(148, 163, 184, 0.14)' : '#dbe4f0',
        textColor: isDark ? '#e2e8f0' : '#334155',
      };

  return (
    <Pressable
      onPress={(event) => {
        if (stopPropagation) {
          event.stopPropagation?.();
        }
        onPress?.();
      }}
      style={({ hovered, pressed }) => [
        styles.actionChip,
        WEB_CARD_TRANSITION,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
        },
        hovered && styles.actionChipHovered,
        pressed && styles.actionChipPressed,
        style,
      ]}
    >
      {Icon ? <Icon size={14} color={palette.textColor} /> : null}
      <Text style={[styles.actionChipText, { color: palette.textColor }]}>{label}</Text>
    </Pressable>
  );
});

const AnnouncementCard = memo(function AnnouncementCard({ item, isDark, onOpen, onOpenPDF }) {
  const preview = useMemo(() => getAnnouncementBody(item), [item]);
  const postedDate = useMemo(() => formatItemDate(item?.createdAt), [item?.createdAt]);
  const backgroundColor = isDark ? '#0f172a' : '#ffffff';
  const borderColor = isDark ? 'rgba(148, 163, 184, 0.14)' : '#e2e8f0';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const metaSurface = isDark ? 'rgba(15, 23, 42, 0.4)' : '#f8fafc';

  return (
    <Pressable
      onPress={() => onOpen(item)}
      style={({ hovered, pressed }) => [
        styles.card,
        shadows.card,
        WEB_CARD_TRANSITION,
        {
          backgroundColor,
          borderColor,
        },
        hovered && styles.cardHovered,
        hovered && shadows.hover,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: titleColor }]} numberOfLines={2}>
          {item?.title || 'Untitled announcement'}
        </Text>

        <Text style={[styles.cardPreview, { color: mutedColor }]} numberOfLines={3}>
          {preview || 'No announcement details available.'}
        </Text>

        <View style={styles.cardMetaRow}>
          <View
            style={[
              styles.metaPill,
              {
                backgroundColor: metaSurface,
                borderColor,
              },
            ]}
          >
            <FiCalendar size={13} color={mutedColor} />
            <Text style={[styles.metaPillText, { color: mutedColor }]}>Posted {postedDate}</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <ActionChip
            label="Read more"
            icon={FiArrowRight}
            onPress={() => onOpen(item)}
            isDark={isDark}
            stopPropagation
          />

          {!!item?.pdfUrl ? (
            <ActionChip
              label="View PDF"
              icon={FiFileText}
              onPress={() => onOpenPDF(item.pdfUrl)}
              isDark={isDark}
              variant="accent"
              stopPropagation
            />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});

const BroadcastCard = memo(function BroadcastCard({ item, isDark }) {
  const preview = useMemo(() => getBroadcastBody(item), [item]);
  const postedDate = useMemo(() => formatItemDate(getBroadcastDateValue(item)), [item]);
  const backgroundColor = isDark ? '#0f172a' : '#ffffff';
  const borderColor = isDark ? 'rgba(148, 163, 184, 0.14)' : '#e2e8f0';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const metaSurface = isDark ? 'rgba(15, 23, 42, 0.4)' : '#f8fafc';

  return (
    <View
      style={[
        styles.card,
        styles.broadcastCard,
        shadows.card,
        {
          backgroundColor,
          borderColor,
        },
      ]}
    >
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, styles.broadcastTitle, { color: titleColor }]} numberOfLines={2}>
          {item?.title || 'Broadcast'}
        </Text>

        <Text style={[styles.cardPreview, styles.broadcastPreview, { color: mutedColor }]} numberOfLines={3}>
          {preview || 'No announcement details available.'}
        </Text>

        <View style={styles.cardMetaRow}>
          <View
            style={[
              styles.metaPill,
              {
                backgroundColor: metaSurface,
                borderColor,
              },
            ]}
          >
            <FiCalendar size={13} color={mutedColor} />
            <Text style={[styles.metaPillText, { color: mutedColor }]}>Posted {postedDate}</Text>
          </View>
        </View>
      </View>
    </View>
  );
});

const AnnouncementsScreen = ({ announcements = [], broadcasts = [], openPDF }) => {
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState('announcements');
  const [search, setSearch] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const isLargeWeb = Platform.OS === 'web' && width >= 1100;
  const searchValue = search.trim().toLowerCase();

  const sortedAnnouncements = useMemo(
    () => [...announcements].sort((a, b) => toMillis(b?.createdAt) - toMillis(a?.createdAt)),
    [announcements]
  );

  const sortedBroadcasts = useMemo(
    () => [...broadcasts].sort((a, b) => toMillis(getBroadcastDateValue(b)) - toMillis(getBroadcastDateValue(a))),
    [broadcasts]
  );

  const filteredAnnouncements = useMemo(
    () => sortedAnnouncements.filter((item) => {
      if (!searchValue) return true;

      const haystack = `${item?.title || ''} ${getAnnouncementBody(item)}`.toLowerCase();
      return haystack.includes(searchValue);
    }),
    [searchValue, sortedAnnouncements]
  );

  const filteredBroadcasts = useMemo(
    () => sortedBroadcasts.filter((item) => {
      if (!searchValue) return true;

      const haystack = `${item?.title || ''} ${getBroadcastBody(item)}`.toLowerCase();
      return haystack.includes(searchValue);
    }),
    [searchValue, sortedBroadcasts]
  );

  const visibleItems = activeTab === 'broadcasts' ? filteredBroadcasts : filteredAnnouncements;

  const selectedDate = useMemo(
    () => formatItemDate(selectedAnnouncement?.createdAt),
    [selectedAnnouncement?.createdAt]
  );

  const selectedBody = useMemo(
    () => selectedAnnouncement?.fullText || selectedAnnouncement?.description || selectedAnnouncement?.message || '',
    [selectedAnnouncement]
  );

  const handleOpenAnnouncement = useCallback((item) => {
    setSelectedAnnouncement(item);
  }, []);

  const handleCloseAnnouncement = useCallback(() => {
    setSelectedAnnouncement(null);
  }, []);

  const handleOpenPDF = useCallback((url) => {
    openPDF(url);
  }, [openPDF]);

  const handleOpenPDFFromModal = useCallback(() => {
    if (!selectedAnnouncement?.pdfUrl) return;
    openPDF(selectedAnnouncement.pdfUrl);
    setSelectedAnnouncement(null);
  }, [openPDF, selectedAnnouncement]);

  const renderItem = useCallback(
    ({ item }) => (
      <View style={[styles.cardItem, isLargeWeb && styles.cardItemGrid]}>
        {activeTab === 'broadcasts' ? (
          <BroadcastCard item={item} isDark={isDark} />
        ) : (
          <AnnouncementCard
            item={item}
            isDark={isDark}
            onOpen={handleOpenAnnouncement}
            onOpenPDF={handleOpenPDF}
          />
        )}
      </View>
    ),
    [activeTab, handleOpenAnnouncement, handleOpenPDF, isDark, isLargeWeb]
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#020617' : colors.background }]}>
      <View
        style={[
          styles.toolbar,
          {
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderBottomColor: isDark ? 'rgba(148, 163, 184, 0.14)' : '#e2e8f0',
          },
        ]}
      >
        <View
          style={[
            styles.toggle,
            {
              backgroundColor: isDark ? '#020617' : '#f8fafc',
              borderColor: isDark ? 'rgba(148, 163, 184, 0.14)' : '#dbe4f0',
            },
          ]}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.key;

            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.toggleButton,
                  active && styles.toggleButtonActive,
                  { backgroundColor: active ? '#2563eb' : 'transparent' },
                ]}
              >
                <Text style={[styles.toggleButtonText, { color: active ? '#ffffff' : isDark ? '#cbd5e1' : '#475569' }]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search by title or content"
          style={[
            styles.searchWrap,
            {
              backgroundColor: isDark ? '#020617' : '#f8fafc',
              borderColor: isDark ? 'rgba(148, 163, 184, 0.14)' : '#dbe4f0',
            },
          ]}
          inputStyle={{ color: isDark ? '#f8fafc' : '#0f172a' }}
        />
      </View>

      <FlatList
        key={`announcement-feed-${activeTab}-${isLargeWeb ? 'grid' : 'list'}`}
        data={visibleItems}
        keyExtractor={(item) => `${activeTab}-${item.id}`}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, isLargeWeb && styles.listGrid]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View
            style={[
              styles.emptyWrap,
              {
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                borderColor: isDark ? 'rgba(148, 163, 184, 0.14)' : '#e2e8f0',
              },
            ]}
          >
            <EmptyState message="No announcements available" icon={FiBell} />
          </View>
        }
      />

      <Modal
        visible={!!selectedAnnouncement}
        transparent
        animationType={Platform.OS === 'web' ? 'fade' : 'slide'}
        onRequestClose={handleCloseAnnouncement}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseAnnouncement} />

          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                borderColor: isDark ? 'rgba(148, 163, 184, 0.14)' : '#e2e8f0',
              },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: isDark ? 'rgba(148, 163, 184, 0.14)' : '#f1f5f9' },
              ]}
            >
              <View style={styles.modalHeaderCopy}>
                <Text style={[styles.modalTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]} numberOfLines={3}>
                  {selectedAnnouncement?.title || 'Announcement'}
                </Text>
              </View>

              <Pressable
                onPress={handleCloseAnnouncement}
                style={({ hovered, pressed }) => [
                  styles.closeBtn,
                  { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.92)' : '#f8fafc' },
                  hovered && styles.closeBtnHovered,
                  pressed && styles.closeBtnPressed,
                ]}
              >
                <FiX size={18} color={isDark ? '#cbd5e1' : '#475569'} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.modalText, { color: isDark ? '#e2e8f0' : '#334155' }]}>
                {selectedBody || 'No announcement details available.'}
              </Text>

              <View
                style={[
                  styles.modalMetaRow,
                  {
                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.42)' : '#f8fafc',
                    borderColor: isDark ? 'rgba(148, 163, 184, 0.14)' : '#e2e8f0',
                  },
                ]}
              >
                <FiCalendar size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                <Text style={[styles.modalMetaText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  Posted {selectedDate}
                </Text>
              </View>
            </ScrollView>

            {!!selectedAnnouncement?.pdfUrl ? (
              <View
                style={[
                  styles.modalFooter,
                  { borderTopColor: isDark ? 'rgba(148, 163, 184, 0.14)' : '#f1f5f9' },
                ]}
              >
                <ActionChip
                  label="View PDF Document"
                  icon={FiFileText}
                  onPress={handleOpenPDFFromModal}
                  isDark={isDark}
                  variant="accent"
                  style={styles.modalFooterButton}
                />
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  toggle: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    padding: 4,
  },
  toggleButton: {
    minHeight: 38,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    shadowColor: '#2563eb',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  toggleButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  searchWrap: {
    marginTop: 12,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  listGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 16,
    alignItems: 'start',
  },
  cardItem: {
    marginBottom: 16,
  },
  cardItemGrid: {
    marginBottom: 0,
    minWidth: 0,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  broadcastCard: {
    ...Platform.select({
      web: {
        cursor: 'default',
      },
    }),
  },
  cardHovered: {
    transform: [{ translateY: -4 }],
  },
  cardPressed: {
    transform: [{ scale: 0.992 }],
  },
  cardContent: {
    padding: 18,
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  broadcastTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  cardPreview: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
  },
  broadcastPreview: {
    marginTop: 8,
    lineHeight: 20,
  },
  cardMetaRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardActions: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionChip: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  actionChipHovered: {
    transform: [{ translateY: -1 }],
  },
  actionChipPressed: {
    transform: [{ scale: 0.985 }],
  },
  actionChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyWrap: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 18,
    ...Platform.select({
      web: {
        gridColumn: '1 / -1',
      },
    }),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 860,
    maxHeight: '86%',
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0px 28px 60px rgba(2, 6, 23, 0.3)',
      },
      default: {
        shadowColor: '#020617',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.2,
        shadowRadius: 28,
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  modalTitle: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '800',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transitionDuration: '180ms',
      },
    }),
  },
  closeBtnHovered: {
    transform: [{ translateY: -1 }],
  },
  closeBtnPressed: {
    transform: [{ scale: 0.96 }],
  },
  modalBody: {
    flexGrow: 0,
  },
  modalBodyContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  modalText: {
    fontSize: 15,
    lineHeight: 26,
  },
  modalMetaRow: {
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  modalMetaText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
    borderTopWidth: 1,
  },
  modalFooterButton: {
    minHeight: 48,
    paddingHorizontal: 18,
  },
});

export default AnnouncementsScreen;
