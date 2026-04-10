import React, { memo, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { FiImage, FiMessageSquare, FiUser } from '../../../utils/iconCompat';
import AppCard from '../../../components/ui/AppCard';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';

const WEB_TRANSITION = Platform.OS === 'web' ? { transitionDuration: '160ms' } : null;
const IMAGE_HEIGHT = 168;

const getReporterName = (item) =>
  item?.reporterName ||
  item?.userName ||
  item?.residentName ||
  item?.createdByName ||
  item?.name ||
  'Resident';

const getFlatLabel = (item) => item?.flatNumber || item?.flat || item?.flatNo || 'Flat N/A';

const getInitials = (name) =>
  `${name || 'Resident'}`
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'R';

const getNormalizedStatus = (status) =>
  `${status || 'pending'}`
    .trim()
    .toLowerCase()
    .replace(/_/g, ' ');

const ImagePlaceholder = memo(({ isDark }) => (
  <View
    style={[
      styles.placeholderWrap,
      { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.92)' : '#e5e7eb' },
    ]}
  >
    <FiImage size={24} color={isDark ? '#94a3b8' : '#94a3b8'} />
    <Text style={[styles.placeholderTitle, { color: isDark ? '#e2e8f0' : '#475569' }]}>
      No Image Available
    </Text>
    <Text style={[styles.placeholderText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
      Residents can attach a photo when reporting an issue.
    </Text>
  </View>
));

const ImageContainer = memo(({ uri, isDark, onPress, onOpenProof }) => {
  const content = uri ? (
    <>
      <Image source={{ uri }} style={styles.image} resizeMode="cover" />
      <View style={styles.imageOverlay}>
        <Text style={styles.imageOverlayText}>Tap to view full image</Text>
      </View>
      {onOpenProof ? (
        <TouchableOpacity
          activeOpacity={0.92}
          style={styles.proofChip}
          onPress={(event) => {
            event.stopPropagation?.();
            onOpenProof();
          }}
        >
          <Text style={styles.proofChipText}>View Proof</Text>
        </TouchableOpacity>
      ) : null}
    </>
  ) : (
    <ImagePlaceholder isDark={isDark} />
  );

  if (!uri) {
    return <View style={styles.imageWrap}>{content}</View>;
  }

  return (
    <TouchableOpacity activeOpacity={0.94} style={styles.imageWrap} onPress={onPress}>
      {content}
    </TouchableOpacity>
  );
});

const IssueCard = ({
  item,
  isDark,
  loading,
  loadingIssueId,
  stackActions,
  onOpenDetail,
  onOpenImage,
  onAssignWorker,
  onResolve,
  onChat,
}) => {
  const [hovered, setHovered] = useState(false);
  const reporterName = useMemo(() => getReporterName(item), [item]);
  const flatLabel = useMemo(() => getFlatLabel(item), [item]);
  const initials = useMemo(() => getInitials(reporterName), [reporterName]);
  const primaryImage = item.beforeImage || item.beforeImageUrl || item.imageUrl;
  const secondaryImage = item.afterImage || item.afterImageUrl;
  const normalizedStatus = useMemo(() => getNormalizedStatus(item.status), [item.status]);
  const isPending = normalizedStatus === 'pending';
  const isInProgress = normalizedStatus === 'in progress';
  const isResolved = normalizedStatus === 'resolved';

  return (
    <Pressable
      onPress={() => onOpenDetail(item)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.pressable,
        WEB_TRANSITION,
        hovered && styles.cardHover,
        pressed && styles.cardPressed,
      ]}
    >
      <AppCard
        style={[
          styles.card,
          {
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.96)',
            borderColor: isDark ? 'rgba(148, 163, 184, 0.18)' : '#e2e8f0',
          },
        ]}
      >
        <View style={styles.topRow}>
          <PriorityBadge priority={item.priority || 'Low'} />
          <StatusBadge status={item.status} />
        </View>

        <Text numberOfLines={2} style={[styles.title, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
          {item.title}
        </Text>

        <Text numberOfLines={3} style={[styles.description, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          {item.description || 'No description added.'}
        </Text>

        <ImageContainer
          uri={primaryImage}
          isDark={isDark}
          onPress={(event) => {
            event.stopPropagation?.();
            onOpenImage(primaryImage, secondaryImage ? 'Before Image' : 'Issue Image');
          }}
          onOpenProof={
            secondaryImage
              ? () => onOpenImage(secondaryImage, 'After Image (Proof)')
              : null
          }
        />

        <View style={styles.reporterRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.reporterTextWrap}>
            <Text numberOfLines={1} style={[styles.reporterName, { color: isDark ? '#e2e8f0' : '#0f172a' }]}>
              {reporterName}
            </Text>
            <Text numberOfLines={1} style={[styles.reporterMeta, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {flatLabel}
            </Text>
          </View>
          <View style={[styles.inlineMeta, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
            <FiUser size={12} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text style={[styles.inlineMetaText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(148, 163, 184, 0.12)' : '#e2e8f0' }]} />

        <View style={[styles.actions, stackActions ? styles.actionsStacked : styles.actionsInline]}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.secondaryAction,
              stackActions && styles.stackedAction,
              {
                backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : '#f8fafc',
                borderColor: isDark ? 'rgba(148, 163, 184, 0.18)' : '#dbe4f0',
              },
            ]}
            onPress={(event) => {
              event.stopPropagation?.();
              onChat(item);
            }}
          >
            <FiMessageSquare size={14} color={isDark ? '#e2e8f0' : '#334155'} />
            <Text style={[styles.secondaryActionText, { color: isDark ? '#e2e8f0' : '#334155' }]}>
              Chat with Resident
            </Text>
          </TouchableOpacity>

          {isPending ? (
            <TouchableOpacity
              activeOpacity={0.9}
              style={[
                styles.resolveAction,
                stackActions && styles.stackedAction,
                { opacity: loading && loadingIssueId === item.id ? 0.8 : 1 },
              ]}
              onPress={(event) => {
                event.stopPropagation?.();
                onAssignWorker(item);
              }}
              disabled={loading}
            >
              <Text style={styles.resolveActionText}>Start Work</Text>
            </TouchableOpacity>
          ) : null}

          {isInProgress ? (
            <TouchableOpacity
              activeOpacity={0.9}
              style={[
                styles.resolveAction,
                stackActions && styles.stackedAction,
                { opacity: loading && loadingIssueId === item.id ? 0.8 : 1 },
              ]}
              onPress={(event) => {
                event.stopPropagation?.();
                onResolve(item);
              }}
              disabled={loading}
            >
              <Text style={styles.resolveActionText}>
                {loading && loadingIssueId === item.id ? 'Uploading...' : 'Mark Resolved'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </AppCard>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 0,
    minHeight: 100,
    height: '100%',
    boxShadow: '0px 16px 40px rgba(15, 23, 42, 0.08)',
  },
  cardHover: {
    transform: [{ translateY: -4 }],
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  imageWrap: {
    position: 'relative',
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    height: IMAGE_HEIGHT,
    backgroundColor: '#e2e8f0',
  },
  image: {
    width: '100%',
    height: IMAGE_HEIGHT,
    backgroundColor: '#e2e8f0',
  },
  placeholderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  placeholderTitle: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  placeholderText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    right: 10,
    bottom: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  imageOverlayText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  proofChip: {
    position: 'absolute',
    left: 10,
    bottom: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.92)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  proofChipText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  reporterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#1d4ed8',
    fontSize: 14,
    fontWeight: '800',
  },
  reporterTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  reporterName: {
    fontSize: 14,
    fontWeight: '700',
  },
  reporterMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  inlineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  inlineMetaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginBottom: 14,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 'auto',
  },
  actionsInline: {
    minHeight: 42,
  },
  actionsStacked: {
    minHeight: 94,
  },
  secondaryAction: {
    minHeight: 42,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexBasis: 0,
    flexGrow: 1,
  },
  stackedAction: {
    flexBasis: '100%',
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  resolveAction: {
    minHeight: 42,
    borderRadius: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    flexBasis: 0,
    flexGrow: 1,
  },
  resolveActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default memo(IssueCard);
