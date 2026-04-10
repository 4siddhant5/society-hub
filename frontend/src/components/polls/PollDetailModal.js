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
import { FiCalendar, FiCheckCircle, FiClock, FiUsers, FiX } from '../../utils/iconCompat';
import PollOptionMeter from './PollOptionMeter';
import colors from '../../design/colors';
import spacing from '../../design/spacing';
import {
  formatPollDate,
  formatPollDateTime,
  getPollDisplayStatus,
  getPollTotalVotes,
  getPollUserVote,
  getTimestampMs,
  getVotePercentage,
  getVotesForOption,
} from './pollUtils';

const CLOSE_DURATION = 180;
const SHOULD_USE_NATIVE_DRIVER = Platform.OS !== 'web';
const OPTION_COLORS = ['#2563eb', '#0f766e', '#f59e0b', '#7c3aed', '#ef4444', '#0891b2'];

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

const formatCountdown = (deadline, now) => {
  const deadlineMs = getTimestampMs(deadline);
  if (deadlineMs === null) {
    return null;
  }

  const diff = deadlineMs - now;
  if (diff <= 0) {
    return 'Closed';
  }

  const totalMinutes = Math.floor(diff / (60 * 1000));
  const totalHours = Math.floor(diff / (60 * 60 * 1000));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `Ends in ${days}d ${hours}h`;
  }

  if (totalHours > 0) {
    return `Ends in ${totalHours}h ${minutes}m`;
  }

  if (totalMinutes > 0) {
    return `Ends in ${totalMinutes}m`;
  }

  return 'Ends in under 1m';
};

const PollDetailModal = ({
  visible,
  poll,
  now,
  onClose,
  onVote,
  userId,
  showVoteActions = false,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const [rendered, setRendered] = useState(visible);
  const [activePoll, setActivePoll] = useState(poll);
  const [liveNow, setLiveNow] = useState(now);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(isDesktop ? 0.96 : 1)).current;
  const cardTranslateY = useRef(new Animated.Value(isDesktop ? 18 : 44)).current;

  useEffect(() => {
    if (poll) {
      setActivePoll(poll);
    }
  }, [poll]);

  useEffect(() => {
    setLiveNow(now);
  }, [now]);

  useEffect(() => {
    if (!visible || !poll?.deadline) {
      return undefined;
    }

    const interval = setInterval(() => {
      setLiveNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [poll?.deadline, visible]);

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

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return undefined;
    }

    if (!visible) {
      document.body.style.overflow = 'auto';
      return undefined;
    }

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [visible]);

  const status = useMemo(() => getPollDisplayStatus(activePoll, liveNow), [activePoll, liveNow]);
  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.active;
  const totalVotes = useMemo(() => getPollTotalVotes(activePoll), [activePoll]);
  const myVote = useMemo(() => getPollUserVote(activePoll, userId), [activePoll, userId]);
  const hasVoted = Boolean(myVote);
  const countdownLabel = useMemo(() => formatCountdown(activePoll?.deadline, liveNow), [activePoll?.deadline, liveNow]);

  const helperText = useMemo(() => {
    if (status === 'closed') {
      return 'Voting has ended. Final results are available below.';
    }

    if (showVoteActions && hasVoted) {
      return 'Your response is locked in and reflected instantly below.';
    }

    return 'Select one option to vote. Results update in real time.';
  }, [hasVoted, showVoteActions, status]);

  const optionData = useMemo(
    () =>
      (activePoll?.options || []).map((option, index) => ({
        option,
        votes: getVotesForOption(activePoll, option),
        percentage: getVotePercentage(activePoll, option),
        isMyVote: myVote === option,
        color: OPTION_COLORS[index % OPTION_COLORS.length],
      })),
    [activePoll, myVote]
  );

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
              style={[styles.modalCard, isDesktop ? styles.modalCardDesktop : styles.modalCardMobile]}
              onPress={(event) => event.stopPropagation?.()}
            >
              <View style={styles.header}>
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

                      {countdownLabel ? (
                        <View
                          style={[
                            styles.countdownPill,
                            status === 'closed' && styles.countdownPillClosed,
                          ]}
                        >
                          <FiClock size={14} color={status === 'closed' ? '#64748b' : '#0f766e'} />
                          <Text
                            style={[
                              styles.countdownText,
                              status === 'closed' && styles.countdownTextClosed,
                            ]}
                          >
                            {countdownLabel}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={styles.title}>{activePoll?.question || 'Untitled poll'}</Text>
                    <Text style={styles.helperText}>{helperText}</Text>
                  </View>

                  <Pressable style={styles.closeIconButton} onPress={onClose}>
                    <FiX size={18} color="#64748b" />
                  </Pressable>
                </View>
              </View>

              <ScrollView
                style={styles.modalBody}
                contentContainerStyle={styles.modalBodyContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.statStrip}>
                  <View style={styles.statPill}>
                    <FiCalendar size={14} color="#7c3aed" />
                    <View style={styles.statTextWrap}>
                      <Text style={styles.statLabel}>Created</Text>
                      <Text style={styles.statValue}>{formatPollDate(activePoll?.createdAt)}</Text>
                    </View>
                  </View>
                  <View style={styles.statPill}>
                    <FiUsers size={14} color="#2563eb" />
                    <View style={styles.statTextWrap}>
                      <Text style={styles.statLabel}>Total votes</Text>
                      <Text style={styles.statValue}>{totalVotes}</Text>
                    </View>
                  </View>
                  <View style={styles.statPill}>
                    <FiClock size={14} color="#0f766e" />
                    <View style={styles.statTextWrap}>
                      <Text style={styles.statLabel}>Deadline</Text>
                      <Text style={styles.statValue}>
                        {activePoll?.deadline ? formatPollDateTime(activePoll.deadline) : 'No deadline'}
                      </Text>
                    </View>
                  </View>
                </View>

                {hasVoted ? (
                  <View style={styles.voteNotice}>
                    <FiCheckCircle size={15} color="#0f766e" />
                    <Text style={styles.voteNoticeText}>You have already voted. Re-voting is disabled.</Text>
                  </View>
                ) : null}

                <View style={styles.optionList}>
                  {optionData.map((item, index) => (
                    <PollOptionMeter
                      key={`${item.option}-${index}`}
                      label={item.option}
                      percentage={item.percentage}
                      votes={item.votes}
                      isSelected={item.isMyVote}
                      canVote={showVoteActions && status === 'active' && !hasVoted}
                      showVoteButton={showVoteActions && status === 'active'}
                      accentColor={item.color}
                      onVote={() => onVote?.(activePoll, item.option)}
                    />
                  ))}
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
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
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
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
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
  countdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#bae6fd',
    backgroundColor: '#ecfeff',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  countdownPillClosed: {
    borderColor: '#cbd5e1',
    backgroundColor: '#f1f5f9',
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f766e',
  },
  countdownTextClosed: {
    color: '#64748b',
  },
  title: {
    fontSize: 24,
    lineHeight: 33,
    fontWeight: '900',
    letterSpacing: -0.6,
    color: colors.textPrimary,
  },
  helperText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  closeIconButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  modalBody: {
    flex: 1,
    minHeight: 0,
  },
  modalBodyContent: {
    padding: 18,
    gap: 18,
  },
  statStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statPill: {
    flex: 1,
    minWidth: 160,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statTextWrap: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#94a3b8',
  },
  statValue: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: '#334155',
  },
  voteNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#99f6e4',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  voteNoticeText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: '#0f766e',
  },
  optionList: {
    gap: 12,
  },
});

export default memo(PollDetailModal);
