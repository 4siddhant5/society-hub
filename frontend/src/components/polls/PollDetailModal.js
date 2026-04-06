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
import { PieChart } from 'react-native-chart-kit';
import { FiClock, FiLock, FiPieChart, FiX } from 'react-icons/fi';
import AppButton from '../ui/AppButton';
import colors from '../../design/colors';
import spacing from '../../design/spacing';
import {
  formatPollDate,
  formatPollDateTime,
  getDeadlineLabel,
  getPollStatus,
  getPollTotalVotes,
  getVotePercentage,
  getVotesForOption,
} from './pollUtils';

const CLOSE_DURATION = 180;
const SHOULD_USE_NATIVE_DRIVER = Platform.OS !== 'web';

const CHART_COLORS = ['#2563eb', '#0f766e', '#f59e0b', '#7c3aed', '#ef4444', '#0891b2'];

const STATUS_STYLES = {
  active: {
    label: 'Active',
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  closed: {
    label: 'Closed',
    backgroundColor: '#e2e8f0',
    color: '#475569',
  },
  scheduled: {
    label: 'Scheduled',
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
  },
};

const ProgressBar = memo(({ percentage, fillColor }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: percentage,
      duration: 450,
      useNativeDriver: false,
    }).start();
  }, [percentage, progress]);

  const width = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, { width, backgroundColor: fillColor }]} />
    </View>
  );
});

const PollDetailModal = ({
  visible,
  poll,
  now,
  onClose,
  onVote,
  userId,
  onClosePoll,
  showVoteActions = false,
  showAdminActions = false,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const [rendered, setRendered] = useState(visible);
  const [activePoll, setActivePoll] = useState(poll);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(isDesktop ? 0.96 : 1)).current;
  const cardTranslateY = useRef(new Animated.Value(isDesktop ? 12 : 40)).current;

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
        toValue: isDesktop ? 12 : 40,
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
        onClose();
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

  const status = useMemo(() => getPollStatus(activePoll, now), [activePoll, now]);
  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.active;
  const totalVotes = useMemo(() => getPollTotalVotes(activePoll), [activePoll]);
  const hasVoted = userId ? Boolean(activePoll?.votes?.[userId]) : false;
  const myVote = hasVoted ? activePoll?.votes?.[userId] : null;
  const deadlineLabel = useMemo(() => getDeadlineLabel(activePoll, now), [activePoll, now]);
  const chartWidth = Math.min(width - (isDesktop ? 200 : 96), 300);

  const optionData = useMemo(
    () =>
      (activePoll?.options || []).map((option, index) => ({
        option,
        votes: getVotesForOption(activePoll, option),
        percentage: getVotePercentage(activePoll, option),
        isMyVote: myVote === option,
        color: CHART_COLORS[index % CHART_COLORS.length],
      })),
    [activePoll, myVote]
  );

  const pieData = useMemo(() => {
    const hasAnyVotes = optionData.some((item) => item.votes > 0);

    if (!hasAnyVotes) {
      return [
        {
          name: 'No votes yet',
          population: 1,
          color: '#cbd5e1',
          legendFontColor: '#475569',
          legendFontSize: 13,
        },
      ];
    }

    return optionData.map((item) => ({
      name: item.option,
      population: item.votes,
      color: item.color,
      legendFontColor: '#475569',
      legendFontSize: 13,
    }));
  }, [optionData]);

  const chartConfig = useMemo(
    () => ({
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      color: (opacity = 1) => `rgba(15, 23, 42, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
      decimalPlaces: 0,
    }),
    []
  );

  if (!rendered || !activePoll) {
    return null;
  }

  return (
    <Modal transparent visible={rendered} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Pressable
          style={styles.modalContainer}
          onPress={onClose}
        >
          <Animated.View
            style={[
              styles.modalContent,
              !isDesktop && styles.modalContentMobile,
              {
                transform: [{ translateY: cardTranslateY }, { scale: cardScale }],
              },
            ]}
          >
            <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation?.()}>
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Text style={styles.title}>{activePoll?.question}</Text>
                  <View style={styles.metaRow}>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                      {status === 'closed' ? <FiLock size={12} color={statusStyle.color} /> : null}
                      <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
                    </View>
                    {deadlineLabel ? (
                      <View style={styles.deadlinePill}>
                        <FiClock size={12} color="#0f766e" />
                        <Text style={styles.deadlineText}>{deadlineLabel}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                <Pressable style={styles.closeIconButton} onPress={onClose}>
                  <FiX size={18} color="#64748b" />
                </Pressable>
              </View>

              <ScrollView
                style={styles.modalBody}
                contentContainerStyle={styles.modalBodyContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.contentSection}>
                  <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                      <FiPieChart size={18} color="#2563eb" />
                      <Text style={styles.sectionTitle}>Vote Distribution</Text>
                    </View>
                    <View style={styles.chartContainer}>
                      <PieChart
                        data={pieData}
                        width={chartWidth}
                        height={220}
                        chartConfig={chartConfig}
                        accessor="population"
                        backgroundColor="transparent"
                        paddingLeft="18"
                        absolute={totalVotes > 0}
                      />
                    </View>
                  </View>

                  <View style={styles.insightCard}>
                    <Text style={styles.sectionTitle}>Poll Snapshot</Text>
                    <View style={styles.statGrid}>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Total Votes</Text>
                        <Text style={styles.statValue}>{totalVotes}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Created</Text>
                        <Text style={styles.statValue}>{formatPollDate(activePoll?.createdAt)}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Deadline</Text>
                        <Text style={styles.statValue}>
                          {activePoll?.deadline ? formatPollDateTime(activePoll.deadline) : 'No deadline'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.optionList}>
                  {optionData.map((item, index) => (
                    <View
                      key={`${item.option}-${index}`}
                      style={[styles.optionRow, item.isMyVote && styles.optionRowSelected]}
                    >
                      <View style={styles.optionTopRow}>
                        <View style={styles.optionInfo}>
                          <View style={[styles.optionDot, { backgroundColor: item.color }]} />
                          <Text style={styles.optionTitle}>{item.option}</Text>
                        </View>
                        <Text style={styles.optionMetric}>
                          {item.votes} vote{item.votes === 1 ? '' : 's'} | {item.percentage}%
                        </Text>
                      </View>

                      <ProgressBar
                        percentage={item.percentage}
                        fillColor={item.isMyVote ? '#0f766e' : item.color}
                      />

                      {showVoteActions ? (
                        <AppButton
                          title={item.isMyVote ? 'Your vote' : 'Vote'}
                          onPress={(event) => {
                            event?.stopPropagation?.();
                            onVote?.(activePoll, item.option);
                          }}
                          type={item.isMyVote ? 'success' : 'secondary'}
                          disabled={hasVoted || status === 'closed'}
                          style={styles.voteButton}
                          textStyle={item.isMyVote ? styles.voteButtonActiveText : styles.voteButtonText}
                        />
                      ) : null}
                    </View>
                  ))}
                </View>
              </ScrollView>

              {showAdminActions && status !== 'closed' ? (
                <View style={styles.modalFooter}>
                  <AppButton
                    title="Close Poll"
                    onPress={(event) => {
                      event?.stopPropagation?.();
                      onClosePoll?.(activePoll.id);
                    }}
                    type="danger"
                    style={styles.closeButton}
                  />
                </View>
              ) : null}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: 650,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0px 20px 48px rgba(2, 6, 23, 0.18)',
        maxHeight: '90vh',
      },
      default: {
        shadowColor: '#020617',
        shadowOpacity: 0.18,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 12 },
        elevation: 10,
        maxHeight: '90%',
      },
    }),
  },
  modalContentMobile: {
    maxWidth: '100%',
    borderRadius: 12,
  },
  modalCard: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deadlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#ccfbf1',
  },
  deadlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#115e59',
  },
  closeIconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalBody: {
    flex: 1,
    width: '100%',
  },
  modalBodyContent: {
    padding: 16,
    flexDirection: 'column',
    gap: 12,
  },
  contentSection: {
    flexDirection: 'column',
    gap: 12,
  },
  chartCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fbff',
    padding: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  chartContainer: {
    width: '100%',
    maxWidth: 300,
    alignSelf: 'center',
  },
  insightCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  statGrid: {
    marginTop: 14,
    gap: 12,
  },
  statItem: {
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 12,
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
  optionList: {
    gap: 12,
  },
  optionRow: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    padding: 14,
  },
  optionRowSelected: {
    borderColor: '#99f6e4',
    backgroundColor: '#f0fdfa',
  },
  progressTrack: {
    width: '100%',
    height: 10,
    marginTop: 12,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#dbeafe',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  optionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  optionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  optionMetric: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    flexShrink: 0,
  },
  voteButton: {
    marginTop: 12,
    minHeight: 42,
    shadowOpacity: 0,
    elevation: 0,
  },
  voteButtonText: {
    color: '#0f172a',
  },
  voteButtonActiveText: {
    color: '#ffffff',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    backgroundColor: '#ffffff',
  },
  closeButton: {
    minHeight: 46,
  },
});

export default memo(PollDetailModal);
