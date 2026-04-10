import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  FiActivity,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiUsers,
  FiX,
} from '../../utils/iconCompat';
import AppButton from '../ui/AppButton';
import spacing from '../../design/spacing';
import {
  formatPollDate,
  formatPollDateTime,
  getDeadlineLabel,
  getPollDisplayStatus,
  getPollTotalVotes,
  getVotePercentage,
  getVotesForOption,
} from './pollUtils';

const CLOSE_DURATION = 180;
const SHOULD_USE_NATIVE_DRIVER = Platform.OS !== 'web';
const POLL_COLORS = ['#2563eb', '#0f766e', '#f59e0b', '#7c3aed', '#ef4444', '#0891b2'];
const STATUS_STYLES = {
  active: {
    label: 'Active',
    backgroundColor: '#dcfce7',
    color: '#166534',
    borderColor: '#86efac',
  },
  closed: {
    label: 'Closed',
    backgroundColor: '#e2e8f0',
    color: '#475569',
    borderColor: '#cbd5e1',
  },
};

const compactValue = (value) =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(
    Number.isFinite(value) ? value : 0
  );

const getPollBreakdown = (poll) => {
  const options = (poll?.options || []).map((option, index) => ({
    key: `${poll?.id || 'poll'}-${index}`,
    label: option,
    value: getVotesForOption(poll, option),
    percentage: getVotePercentage(poll, option),
    color: POLL_COLORS[index % POLL_COLORS.length],
  }));
  const leadingPercentage = Math.max(0, ...options.map((item) => item.percentage));

  return options.map((item) => ({
    ...item,
    isLeading: leadingPercentage > 0 && item.percentage === leadingPercentage,
  }));
};

const SnapshotTile = memo(({ icon: Icon, label, value, tone = '#2563eb', isDark, caption }) => (
  <View
    style={[
      styles.snapshotTile,
      {
        borderColor: isDark ? 'rgba(148,163,184,0.12)' : '#e2e8f0',
        backgroundColor: isDark ? 'rgba(15,23,42,0.56)' : '#f8fafc',
      },
    ]}
  >
    <View style={[styles.snapshotIcon, { backgroundColor: `${tone}1A` }]}>
      <Icon size={15} color={tone} />
    </View>
    <Text style={[styles.snapshotLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{label}</Text>
    <Text style={[styles.snapshotValue, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{value}</Text>
    {caption ? (
      <Text style={[styles.snapshotCaption, { color: isDark ? '#64748b' : '#94a3b8' }]}>{caption}</Text>
    ) : null}
  </View>
));

const AdminPollDetailModal = ({
  visible,
  poll,
  now,
  onClose,
  onConfirmClose,
  totalUsers = 0,
  isDark = false,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const [rendered, setRendered] = useState(visible);
  const [activePoll, setActivePoll] = useState(poll);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(isDesktop ? 0.96 : 1)).current;
  const cardTranslateY = useRef(new Animated.Value(isDesktop ? 18 : 44)).current;

  useEffect(() => {
    if (poll) {
      setActivePoll(poll);
    }
  }, [poll]);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
        }),
        Animated.timing(cardScale, {
          toValue: 1,
          duration: 220,
          useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
        }),
        Animated.timing(cardTranslateY, {
          toValue: 0,
          duration: 220,
          useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
        }),
      ]).start();
      return undefined;
    }

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: CLOSE_DURATION,
        useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
      }),
      Animated.timing(cardScale, {
        toValue: isDesktop ? 0.96 : 1,
        duration: CLOSE_DURATION,
        useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
      }),
      Animated.timing(cardTranslateY, {
        toValue: isDesktop ? 18 : 44,
        duration: CLOSE_DURATION,
        useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
      }),
    ]).start(() => {
      setRendered(false);
      setActivePoll(null);
    });

    return undefined;
  }, [cardScale, cardTranslateY, isDesktop, overlayOpacity, visible]);

  useEffect(() => {
    if (!visible || Platform.OS !== 'web') {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, visible]);

  const status = useMemo(() => getPollDisplayStatus(activePoll, now), [activePoll, now]);
  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.active;
  const totalVotes = useMemo(() => getPollTotalVotes(activePoll), [activePoll]);
  const deadlineLabel = useMemo(() => getDeadlineLabel(activePoll, now), [activePoll, now]);
  const breakdown = useMemo(() => getPollBreakdown(activePoll), [activePoll]);
  const engagementRate = useMemo(() => {
    if (!totalUsers) {
      return totalVotes ? 100 : 0;
    }

    return Math.min(100, Math.round((totalVotes / totalUsers) * 100));
  }, [totalUsers, totalVotes]);

  if (!rendered || !activePoll) {
    return null;
  }

  return (
    <Modal transparent visible={rendered} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Pressable
          style={[styles.backdropPressable, isDesktop ? styles.desktopBackdrop : styles.mobileBackdrop]}
          onPress={onClose}
        >
          <Animated.View
            style={[
              styles.modalShell,
              isDesktop ? styles.modalShellDesktop : styles.modalShellMobile,
              {
                transform: [{ translateY: cardTranslateY }, { scale: cardScale }],
              },
            ]}
          >
            <Pressable
              style={[
                styles.modalCard,
                isDesktop ? styles.modalCardDesktop : styles.modalCardMobile,
                {
                  borderColor: isDark ? 'rgba(148,163,184,0.12)' : '#e2e8f0',
                  backgroundColor: isDark ? '#081120' : '#ffffff',
                },
              ]}
              onPress={(event) => event.stopPropagation?.()}
            >
              <View
                style={[
                  styles.header,
                  {
                    borderBottomColor: isDark ? 'rgba(148,163,184,0.12)' : '#e2e8f0',
                    backgroundColor: isDark ? '#081120' : '#ffffff',
                  },
                ]}
              >
                {!isDesktop ? <View style={styles.modalHandle} /> : null}

                <View style={styles.headerRow}>
                  <View style={styles.headerTextWrap}>
                    <View style={styles.metaRow}>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: statusStyle.backgroundColor,
                            borderColor: statusStyle.borderColor,
                          },
                        ]}
                      >
                        <Text style={[styles.statusText, { color: statusStyle.color }]}>
                          {statusStyle.label}
                        </Text>
                      </View>
                      <Text style={[styles.createdMeta, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        Created {formatPollDate(activePoll?.createdAt)}
                      </Text>
                    </View>

                    <Text style={[styles.title, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      {activePoll?.question || 'Untitled poll'}
                    </Text>

                    {deadlineLabel ? (
                      <View
                        style={[
                          styles.deadlinePill,
                          {
                            backgroundColor: isDark ? 'rgba(13,148,136,0.18)' : '#ecfeff',
                            borderColor: isDark ? 'rgba(45,212,191,0.18)' : '#bae6fd',
                          },
                        ]}
                      >
                        <FiClock size={14} color="#0f766e" />
                        <Text style={styles.deadlineText}>{deadlineLabel}</Text>
                      </View>
                    ) : null}
                  </View>

                  <Pressable
                    style={[
                      styles.closeIconButton,
                      {
                        borderColor: isDark ? 'rgba(148,163,184,0.12)' : '#e2e8f0',
                        backgroundColor: isDark ? 'rgba(15,23,42,0.74)' : '#f8fafc',
                      },
                    ]}
                    onPress={onClose}
                  >
                    <FiX size={18} color={isDark ? '#cbd5e1' : '#64748b'} />
                  </Pressable>
                </View>
              </View>

              <ScrollView
                style={styles.modalBody}
                contentContainerStyle={styles.modalBodyContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: isDark ? '#7dd3fc' : '#0369a1' }]}>
                    Vote Distribution
                  </Text>
                  <View style={styles.distributionList}>
                    {breakdown.map((item) => (
                      <View key={item.key} style={styles.distributionRow}>
                        <View style={styles.distributionTop}>
                          <View style={styles.distributionLabelWrap}>
                            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                            <Text
                              style={[
                                styles.distributionLabel,
                                { color: isDark ? '#f8fafc' : '#0f172a' },
                              ]}
                            >
                              {item.label}
                            </Text>
                            {item.isLeading ? (
                              <View
                                style={[
                                  styles.leadingBadge,
                                  {
                                    backgroundColor: isDark ? 'rgba(22,163,74,0.14)' : '#dcfce7',
                                    borderColor: isDark ? 'rgba(22,163,74,0.24)' : '#86efac',
                                  },
                                ]}
                              >
                                <FiCheckCircle size={12} color="#16a34a" />
                                <Text style={styles.leadingText}>Leading</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text
                            style={[
                              styles.distributionValue,
                              { color: isDark ? '#cbd5e1' : '#475569' },
                            ]}
                          >
                            {item.percentage}% ({item.value})
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.progressTrack,
                            { backgroundColor: isDark ? 'rgba(30,41,59,0.92)' : '#e2e8f0' },
                          ]}
                        >
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${Math.max(item.percentage, item.value ? 6 : 0)}%`,
                                backgroundColor: item.color,
                                opacity: item.isLeading ? 1 : 0.84,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: isDark ? '#7dd3fc' : '#0369a1' }]}>
                    Poll Snapshot
                  </Text>
                  <View style={styles.snapshotGrid}>
                    <SnapshotTile
                      icon={FiUsers}
                      label="Total Votes"
                      value={compactValue(totalVotes)}
                      tone="#2563eb"
                      isDark={isDark}
                      caption={`${engagementRate}% engagement`}
                    />
                    <SnapshotTile
                      icon={FiCalendar}
                      label="Created"
                      value={formatPollDate(activePoll?.createdAt)}
                      tone="#7c3aed"
                      isDark={isDark}
                    />
                    <SnapshotTile
                      icon={FiClock}
                      label="Deadline"
                      value={activePoll?.deadline ? formatPollDateTime(activePoll?.deadline) : 'No deadline'}
                      tone="#0f766e"
                      isDark={isDark}
                      caption={deadlineLabel || 'Open until manually closed'}
                    />
                    <SnapshotTile
                      icon={FiActivity}
                      label="Status"
                      value={statusStyle.label}
                      tone={status === 'closed' ? '#64748b' : '#16a34a'}
                      isDark={isDark}
                      caption={status === 'closed' ? 'Voting locked' : 'Accepting votes'}
                    />
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: isDark ? '#7dd3fc' : '#0369a1' }]}>
                    Admin Actions
                  </Text>
                  <View
                    style={[
                      styles.actionCard,
                      {
                        borderColor: isDark ? 'rgba(148,163,184,0.12)' : '#e2e8f0',
                        backgroundColor: isDark ? 'rgba(15,23,42,0.56)' : '#f8fafc',
                      },
                    ]}
                  >
                    <Text style={[styles.actionText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                      {status === 'closed'
                        ? 'This poll has already been closed. Results remain available for admin review.'
                        : 'Close this poll when voting should stop. Final tallies will stay visible right away.'}
                    </Text>

                    {status === 'closed' ? (
                      <View style={styles.closedBadge}>
                        <FiCheckCircle size={14} color="#64748b" />
                        <Text style={styles.closedBadgeText}>Closed</Text>
                      </View>
                    ) : (
                      <AppButton
                        title="Close Poll"
                        onPress={(event) => {
                          event?.stopPropagation?.();
                          onConfirmClose?.(activePoll);
                        }}
                        type="danger"
                        style={styles.closeButton}
                      />
                    )}
                  </View>
                </View>
              </ScrollView>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.66)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
      },
    }),
  },
  backdropPressable: {
    flex: 1,
    width: '100%',
  },
  desktopBackdrop: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  mobileBackdrop: {
    justifyContent: 'flex-end',
    paddingTop: 40,
  },
  modalShell: {
    width: '100%',
  },
  modalShellDesktop: {
    maxWidth: 700,
  },
  modalShellMobile: {
    maxWidth: '100%',
  },
  modalCard: {
    flexDirection: 'column',
    overflow: 'hidden',
    borderWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: '0px 24px 72px rgba(2, 6, 23, 0.22)',
        maxHeight: '86vh',
      },
      default: {
        shadowColor: '#020617',
        shadowOpacity: 0.22,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 12 },
        elevation: 12,
        maxHeight: '92%',
      },
    }),
  },
  modalCardDesktop: {
    borderRadius: 28,
  },
  modalCardMobile: {
    width: '100%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.45)',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerTextWrap: {
    flex: 1,
    gap: 10,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  createdMeta: {
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    lineHeight: 33,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  deadlinePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deadlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f766e',
  },
  closeIconButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    flex: 1,
    minHeight: 0,
  },
  modalBodyContent: {
    padding: 18,
    gap: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  distributionList: {
    gap: 12,
  },
  distributionRow: {
    gap: 8,
  },
  distributionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  distributionLabelWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  distributionLabel: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  distributionValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  leadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  leadingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16a34a',
  },
  progressTrack: {
    width: '100%',
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  snapshotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  snapshotTile: {
    flex: 1,
    minWidth: 160,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  snapshotIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  snapshotLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  snapshotValue: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
  snapshotCaption: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  actionCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  actionText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  closeButton: {
    minWidth: 150,
    alignSelf: 'flex-start',
  },
  closedBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
  },
  closedBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
});

export default memo(AdminPollDetailModal);
