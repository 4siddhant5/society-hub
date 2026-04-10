import React, { memo, useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import colors from '../../design/colors';
import spacing from '../../design/spacing';

const ProgressBar = memo(({ percentage, fillColor, compact = false }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: percentage,
      duration: 320,
      useNativeDriver: false,
    }).start();
  }, [percentage, progress]);

  const width = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.progressTrack, compact && styles.progressTrackCompact]}>
      <Animated.View style={[styles.progressFill, { width, backgroundColor: fillColor }]} />
    </View>
  );
});

const PollOptionMeter = ({
  label,
  percentage,
  votes,
  isSelected = false,
  canVote = false,
  showVoteButton = false,
  compact = false,
  accentColor = colors.primary,
  onVote,
}) => {
  const showAction = isSelected || (showVoteButton && canVote);

  return (
    <View style={[styles.optionCard, compact && styles.optionCardCompact, isSelected && styles.optionCardSelected]}>
      <View style={styles.optionTopRow}>
        <Text style={[styles.optionLabel, compact && styles.optionLabelCompact]} numberOfLines={2}>
          {label}
        </Text>
        <Text style={[styles.optionPercent, isSelected && styles.optionPercentSelected]}>{percentage}%</Text>
      </View>

      <ProgressBar percentage={percentage} fillColor={isSelected ? '#0f766e' : accentColor} compact={compact} />

      <View style={styles.optionBottomRow}>
        <Text style={styles.voteCount}>
          {votes} vote{votes === 1 ? '' : 's'}
        </Text>

        {showAction ? (
          isSelected ? (
            <View style={styles.voteStatePill}>
              <Text style={styles.voteStateText}>Your vote</Text>
            </View>
          ) : (
            <Pressable
              onPress={(event) => {
                event?.stopPropagation?.();
                onVote?.();
              }}
              style={({ hovered, pressed }) => [
                styles.voteButton,
                compact && styles.voteButtonCompact,
                hovered && Platform.OS === 'web' && styles.voteButtonHovered,
                pressed && styles.voteButtonPressed,
              ]}
            >
              <Text style={styles.voteButtonText}>Vote</Text>
            </Pressable>
          )
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  optionCard: {
    borderRadius: 18,
    padding: spacing.md,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  optionCardCompact: {
    padding: 14,
    gap: 8,
  },
  optionCardSelected: {
    backgroundColor: '#f0fdfa',
    borderColor: '#99f6e4',
  },
  optionTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  optionLabelCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
  optionPercent: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
  },
  optionPercentSelected: {
    color: '#0f766e',
  },
  progressTrack: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#dbeafe',
  },
  progressTrackCompact: {
    height: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  optionBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  voteCount: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  voteStatePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#0f766e',
  },
  voteStateText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  voteButton: {
    minHeight: 34,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    ...Platform.select({
      web: {
        transitionDuration: '160ms',
      },
      default: {},
    }),
  },
  voteButtonCompact: {
    minHeight: 32,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  voteButtonHovered: {
    transform: [{ translateY: -1 }],
  },
  voteButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  voteButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
});

export default memo(PollOptionMeter);
