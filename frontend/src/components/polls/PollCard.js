import React, { memo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { FiChevronRight, FiClock, FiLock } from 'react-icons/fi';
import AppCard from '../ui/AppCard';
import colors from '../../design/colors';
import spacing from '../../design/spacing';
import {
  formatPollDate,
  formatPollDateTime,
  getDeadlineLabel,
  getPollStatus,
  getPollTotalVotes,
} from './pollUtils';

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

const PollCard = ({
  poll,
  now,
  onOpenDetail,
}) => {
  const status = getPollStatus(poll, now);
  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.active;
  const totalVotes = getPollTotalVotes(poll);
  const deadlineLabel = getDeadlineLabel(poll, now);

  return (
    <AppCard interactive hoverLift onPress={() => onOpenDetail?.(poll)} style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.question}>{poll?.question}</Text>
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

        <Pressable
          style={styles.menuButton}
          onPress={(event) => {
            event?.stopPropagation?.();
            onOpenDetail?.(poll);
          }}
        >
          <FiChevronRight size={18} color="#64748b" />
        </Pressable>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerMeta}>
          <Text style={styles.footerLabel}>Created</Text>
          <Text style={styles.footerValue}>{formatPollDate(poll?.createdAt)}</Text>
        </View>
        <View style={styles.footerMeta}>
          <Text style={styles.footerLabel}>Deadline</Text>
          <Text style={styles.footerValue}>{poll?.deadline ? formatPollDateTime(poll.deadline) : 'No deadline'}</Text>
        </View>
        <View style={styles.footerMeta}>
          <Text style={styles.footerLabel}>Votes</Text>
          <Text style={styles.footerValue}>{totalVotes}</Text>
        </View>
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: 0,
    flexDirection: 'column',
    borderColor: '#dbeafe',
    backgroundColor: '#ffffff',
    minWidth: 0,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transitionDuration: '200ms',
        boxShadow: '0px 8px 24px rgba(0,0,0,0.06)',
      },
      default: {
        shadowColor: '#000000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        elevation: 3,
      },
    }),
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  titleBlock: {
    flex: 1,
  },
  question: {
    fontSize: 18,
    lineHeight: 26,
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
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerMeta: {
    flex: 1,
    minWidth: 88,
  },
  footerLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    color: '#94a3b8',
  },
  footerValue: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#334155',
  },
});

export default memo(PollCard);
