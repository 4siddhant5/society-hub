import React, { memo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { FiActivity, FiBarChart2, FiUsers } from 'react-icons/fi';
import spacing from '../../design/spacing';
import shadows from '../../design/shadows';

const ANALYTIC_CARDS = [
  { key: 'activePolls', label: 'Active Polls', icon: FiBarChart2 },
  { key: 'totalVotes', label: 'Total Votes', icon: FiUsers },
  { key: 'engagementRate', label: 'Engagement Rate', icon: FiActivity, suffix: '%' },
];

const PollAnalyticsHeader = ({ analytics, isCompact = false }) => (
  <View style={styles.shell}>
    <View style={styles.gradientBase} />
    <View style={styles.gradientOrbLeft} />
    <View style={styles.gradientOrbRight} />
    <View style={[styles.cardGrid, isCompact && styles.cardGridCompact]}>
      {ANALYTIC_CARDS.map(({ key, label, icon: Icon, suffix = '' }) => (
        <View key={key} style={[styles.statCard, isCompact && styles.statCardCompact]}>
          <View style={styles.iconWrap}>
            <Icon size={18} color="#e0f2fe" />
          </View>
          <Text style={styles.cardValue}>
            {analytics[key]}
            {suffix}
          </Text>
          <Text style={styles.cardLabel}>{label}</Text>
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  shell: {
    position: 'relative',
    width: '100%',
    marginBottom: spacing.lg,
    borderRadius: 24,
    overflow: 'hidden',
    padding: spacing.md,
    minHeight: 152,
    backgroundColor: '#0f766e',
  },
  gradientBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f766e',
  },
  gradientOrbLeft: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: '#2563eb',
    top: -60,
    left: -40,
    opacity: 0.85,
  },
  gradientOrbRight: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: '#2dd4bf',
    right: -30,
    bottom: -80,
    opacity: 0.45,
  },
  cardGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  cardGridCompact: {
    flexDirection: 'column',
  },
  statCard: {
    flex: 1,
    minWidth: 180,
    padding: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.14)',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(14px)' } : {}),
    ...shadows.card,
  },
  statCardCompact: {
    minWidth: 0,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    marginBottom: spacing.sm,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  cardLabel: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#dbeafe',
  },
});

export default memo(PollAnalyticsHeader);
