import React, { memo, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { FiChevronRight, FiClock, FiUsers } from '../../utils/iconCompat';
import colors from '../../design/colors';
import { useTheme } from '../../context/ThemeContext';
import {
  formatPollDate,
  getDeadlineLabel,
  getPollDisplayStatus,
  getPollTotalVotes,
  getVotePercentage,
  getVotesForOption,
} from './pollUtils';

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

const CARD_SHADOW = Platform.select({
  web: {
    boxShadow: '0px 18px 60px rgba(15, 23, 42, 0.08)',
    transitionDuration: '220ms',
    transitionProperty: 'transform, box-shadow, border-color',
    transitionTimingFunction: 'ease',
    cursor: 'pointer',
  },
  default: {
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 6,
  },
});

const PollCard = ({ poll, now, onOpenDetail }) => {
  const { isDark } = useTheme();
  const status = useMemo(() => getPollDisplayStatus(poll, now), [poll, now]);
  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.active;
  const totalVotes = useMemo(() => getPollTotalVotes(poll), [poll]);
  const deadlineLabel = useMemo(() => getDeadlineLabel(poll, now), [poll, now]);

  const previewText = useMemo(() => {
    const options = (poll?.options || []).map((option, index) => ({
      option,
      votes: getVotesForOption(poll, option),
      percentage: getVotePercentage(poll, option),
      color: OPTION_COLORS[index % OPTION_COLORS.length],
    }));

    const leading = options.reduce(
      (best, option) => (option.percentage > best.percentage ? option : best),
      { option: '', percentage: 0, votes: 0, color: OPTION_COLORS[0] }
    );

    if (!leading.option || totalVotes === 0) {
      return {
        label: 'Preview',
        text:
          status === 'active'
            ? 'Tap to view options and cast your vote.'
            : 'Tap to review the final breakdown.',
        accent: OPTION_COLORS[0],
      };
    }

    return {
      label: 'Top option',
      text: `${leading.option} - ${leading.percentage}%`,
      accent: leading.color,
    };
  }, [poll, status, totalVotes]);

  return (
    <Pressable
      onPress={() => onOpenDetail?.(poll)}
      style={({ hovered, pressed }) => [
        styles.card,
        CARD_SHADOW,
        {
          borderColor: isDark ? 'rgba(148,163,184,0.12)' : '#e2e8f0',
          backgroundColor: isDark ? 'rgba(8,15,28,0.9)' : 'rgba(255,255,255,0.96)',
          transform: [{ translateY: hovered ? -4 : pressed ? 1 : 0 }],
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusStyle.backgroundColor, borderColor: statusStyle.borderColor },
              ]}
            >
              <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
            </View>
            <Text style={[styles.metaText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              Created {formatPollDate(poll?.createdAt)}
            </Text>
          </View>

          <Text
            style={[styles.question, { color: isDark ? '#f8fafc' : colors.textPrimary }]}
            numberOfLines={2}
          >
            {poll?.question || 'Untitled poll'}
          </Text>

          <View style={styles.summaryRow}>
            <View
              style={[
                styles.summaryPill,
                {
                  backgroundColor: isDark ? 'rgba(15,23,42,0.7)' : '#f8fafc',
                  borderColor: isDark ? 'rgba(148,163,184,0.12)' : '#e2e8f0',
                },
              ]}
            >
              <FiUsers size={14} color={isDark ? '#cbd5e1' : '#475569'} />
              <Text style={[styles.summaryText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                {totalVotes} votes
              </Text>
            </View>

            {deadlineLabel ? (
              <View
                style={[
                  styles.summaryPill,
                  {
                    backgroundColor:
                      status === 'closed'
                        ? isDark
                          ? 'rgba(71,85,105,0.22)'
                          : '#f1f5f9'
                        : isDark
                          ? 'rgba(13,148,136,0.18)'
                          : '#ecfeff',
                    borderColor:
                      status === 'closed'
                        ? isDark
                          ? 'rgba(148,163,184,0.2)'
                          : '#cbd5e1'
                        : isDark
                          ? 'rgba(45,212,191,0.18)'
                          : '#bae6fd',
                  },
                ]}
              >
                <FiClock size={14} color={status === 'closed' ? '#64748b' : '#0f766e'} />
                <Text
                  style={[
                    styles.summaryText,
                    { color: status === 'closed' ? '#64748b' : '#0f766e' },
                  ]}
                >
                  {status === 'closed' ? 'Closed' : deadlineLabel}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View
          style={[
            styles.ctaWrap,
            {
              backgroundColor: isDark ? 'rgba(15,23,42,0.74)' : '#f8fafc',
              borderColor: isDark ? 'rgba(148,163,184,0.12)' : '#e2e8f0',
            },
          ]}
        >
          <FiChevronRight size={18} color={isDark ? '#cbd5e1' : '#475569'} />
        </View>
      </View>

      <View
        style={[
          styles.previewCard,
          {
            borderColor: isDark ? 'rgba(148,163,184,0.12)' : '#e2e8f0',
            backgroundColor: isDark ? 'rgba(15,23,42,0.56)' : '#f8fafc',
          },
        ]}
      >
        <View style={styles.previewTopRow}>
          <View style={[styles.previewAccent, { backgroundColor: previewText.accent }]} />
          <Text style={[styles.previewLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            {previewText.label}
          </Text>
        </View>
        <Text style={[styles.previewText, { color: isDark ? '#f8fafc' : '#0f172a' }]} numberOfLines={2}>
          {previewText.text}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerMain: {
    flex: 1,
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
  metaText: {
    fontSize: 12,
    fontWeight: '700',
  },
  question: {
    marginTop: 12,
    fontSize: 19,
    lineHeight: 28,
    fontWeight: '800',
  },
  summaryRow: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  ctaWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCard: {
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  previewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewAccent: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  previewText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
});

export default memo(PollCard);
