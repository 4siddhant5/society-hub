import React from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FiArrowLeft, FiCalendar, FiFlag } from '../utils/iconCompat';
import AppCard from '../components/ui/AppCard';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import colors from '../design/colors';
import spacing from '../design/spacing';

const formatIssueDate = (value) => {
  if (!value) return '';
  if (typeof value?.toDate === 'function') {
    return value.toDate().toLocaleDateString();
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
};

export default function IssueDetailScreen({ issue, goBack }) {
  if (!issue) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.85}>
            <FiArrowLeft size={16} color={colors.primary} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <PageHeader
            eyebrow="Issue Review"
            title={issue.title || 'Issue Detail'}
            subtitle="A complete status, description, and proof timeline for this report."
          />
        </View>

        <AppCard style={styles.summaryCard}>
          <View style={styles.titleRow}>
            <Text style={styles.sectionTitle}>Current Status</Text>
            <StatusBadge status={issue.status} />
          </View>

          <View style={styles.metaRow}>
            {!!issue.category ? (
              <View style={styles.metaPill}>
                <FiFlag size={14} color={colors.textSecondary} />
                <Text style={styles.metaPillText}>{issue.category}</Text>
              </View>
            ) : null}
            {!!issue.priority ? (
              <View style={[styles.metaPill, styles.priorityPill]}>
                <Text style={[styles.metaPillText, styles.priorityPillText]}>{issue.priority}</Text>
              </View>
            ) : null}
            {!!issue.createdAt ? (
              <View style={styles.metaPill}>
                <FiCalendar size={14} color={colors.textSecondary} />
                <Text style={styles.metaPillText}>Reported {formatIssueDate(issue.createdAt)}</Text>
              </View>
            ) : null}
          </View>
        </AppCard>

        <AppCard style={styles.bodyCard}>
          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.description}>{issue.description || 'No description provided.'}</Text>
        </AppCard>

        {(!!issue.beforeImage || !!issue.beforeImageUrl || !!issue.imageUrl) ? (
          <AppCard style={styles.imageCard}>
            <Text style={styles.sectionLabel}>Before Image</Text>
            <Image
              source={{ uri: issue.beforeImage || issue.beforeImageUrl || issue.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          </AppCard>
        ) : null}

        {(!!issue.afterImage || !!issue.afterImageUrl) ? (
          <AppCard style={styles.imageCard}>
            <Text style={styles.sectionLabel}>After Image</Text>
            <Image
              source={{ uri: issue.afterImage || issue.afterImageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          </AppCard>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  headerBlock: {
    marginBottom: spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  backBtnText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  summaryCard: {
    marginBottom: spacing.md,
  },
  bodyCard: {
    marginBottom: spacing.md,
  },
  imageCard: {
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  priorityPill: {
    backgroundColor: '#fef2f2',
  },
  priorityPillText: {
    color: '#dc2626',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  image: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
  },
});
