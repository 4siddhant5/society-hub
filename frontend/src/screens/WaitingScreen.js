import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { SocietyHubLoader, SocietyHubMark } from '../components/branding/SocietyHubLogo';
import { useAuth } from '../context/AuthContext';
import colors from '../design/colors';
import shadows from '../design/shadows';
import spacing from '../design/spacing';
import typography from '../design/typography';
import { logoutAuthUser } from '../services/authService';

const STATUS_META = {
  pending: {
    badge: 'Waiting for Approval',
    accent: '#14B8A6',
    tint: 'rgba(16, 185, 129, 0.12)',
    title: 'Waiting for admin approval',
    subtitle: 'Your registration is complete. We will move you into the app as soon as your access is approved.',
  },
  rejected: {
    badge: 'Needs Attention',
    accent: colors.danger,
    tint: 'rgba(239, 68, 68, 0.10)',
    title: 'Your request was rejected',
    subtitle: 'Please review the message below and contact your administrator if you need help.',
  },
  blocked: {
    badge: 'Account Restricted',
    accent: colors.danger,
    tint: 'rgba(239, 68, 68, 0.10)',
    title: 'Your account is blocked',
    subtitle: 'Please contact support or your society administrator for the next steps.',
  },
  deleted: {
    badge: 'Access Removed',
    accent: '#64748B',
    tint: 'rgba(100, 116, 139, 0.12)',
    title: 'Your account access was removed',
    subtitle: 'If this was unexpected, please contact support for clarification.',
  },
};

const ActionButton = ({ title, onPress, loading, variant = 'primary' }) => (
  <Pressable
    accessibilityRole="button"
    disabled={loading}
    onPress={onPress}
    style={({ hovered, pressed }) => [
      styles.button,
      variant === 'secondary' ? styles.buttonSecondary : styles.buttonPrimary,
      hovered && Platform.OS === 'web' && !loading && styles.buttonHover,
      pressed && styles.buttonPressed,
      loading && styles.buttonDisabled,
    ]}
  >
    {loading ? (
      <SocietyHubLoader gradient={variant === 'secondary' ? 'brand' : 'dark'} size={24} />
    ) : (
      <Text style={[styles.buttonText, variant === 'secondary' && styles.buttonTextSecondary]}>{title}</Text>
    )}
  </Pressable>
);

export default function WaitingScreen() {
  const { userData, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isAdmin = userData?.role === 'admin';
  const statusKey = userData?.status || 'pending';
  const meta = STATUS_META[statusKey] || STATUS_META.pending;

  const title = isAdmin && statusKey === 'pending'
    ? 'Your society request is under review'
    : meta.title;

  const subtitle = isAdmin && statusKey === 'pending'
    ? 'We are reviewing your society setup. You will enter the admin workspace automatically after approval.'
    : meta.subtitle;

  const detailMessage = useMemo(() => {
    if (statusKey === 'rejected' && userData?.rejectionReason) {
      return userData.rejectionReason;
    }

    if (statusKey === 'blocked' && userData?.blockedReason) {
      return userData.blockedReason;
    }

    if (statusKey === 'deleted') {
      return 'This access change was applied by a super admin.';
    }

    return isAdmin
      ? 'You can refresh the status anytime. Once approved, your society code and dashboard access will appear automatically.'
      : 'You can refresh the status anytime. Once approved, you will be taken straight to your resident dashboard.';
  }, [isAdmin, statusKey, userData?.blockedReason, userData?.rejectionReason]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUser();
    } catch (error) {
      Alert.alert('Refresh failed', error?.message || 'Unable to refresh your approval status right now.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutAuthUser();
    } catch (error) {
      Alert.alert('Logout failed', error?.message || 'Unable to sign out right now.');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <View style={styles.page}>
      <View style={StyleSheet.absoluteFillObject}>
        <Svg height="100%" preserveAspectRatio="none" width="100%">
          <Defs>
            <LinearGradient id="waitingBg" x1="0%" x2="100%" y1="100%" y2="0%">
              <Stop offset="0%" stopColor="#E0F2FE" />
              <Stop offset="48%" stopColor="#EFF6FF" />
              <Stop offset="100%" stopColor="#ECFDF5" />
            </LinearGradient>
          </Defs>
          <Rect fill="url(#waitingBg)" height="100%" width="100%" x="0" y="0" />
          <Path d="M-20 530C126 456 246 444 355 490C450 529 544 535 704 450V820H-20V530Z" fill="#2563EB" opacity="0.08" />
          <Path d="M-80 80C90 24 225 27 334 86C432 138 535 148 700 68V-100H-80V80Z" fill="#10B981" opacity="0.07" />
        </Svg>
      </View>

      <View style={styles.card}>
        <View style={styles.headerBrand}>
          <SocietyHubMark size={56} />
          <View style={styles.headerCopy}>
            <Text style={styles.brandName}>SocietyHub</Text>
            <Text style={styles.brandTag}>We will bring you in automatically once access is ready.</Text>
          </View>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: meta.tint }]}>
          <View style={[styles.statusDot, { backgroundColor: meta.accent }]} />
          <Text style={[styles.statusText, { color: meta.accent }]}>{meta.badge}</Text>
        </View>

        <View style={styles.loaderPanel}>
          <SocietyHubLoader gradient="brand" label="Checking your access" size={96} />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Current status</Text>
          <Text style={[styles.infoValue, { color: meta.accent }]}>{statusKey.toUpperCase()}</Text>
          <Text style={styles.infoCopy}>{detailMessage}</Text>
        </View>

        <View style={styles.buttonStack}>
          <ActionButton loading={refreshing} onPress={handleRefresh} title={refreshing ? 'Refreshing...' : 'Retry / Refresh'} />
          <ActionButton loading={loggingOut} onPress={handleLogout} title={loggingOut ? 'Logging out...' : 'Logout'} variant="secondary" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: '#EFF6FF',
  },
  card: {
    width: '100%',
    maxWidth: 560,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.hover,
  },
  headerBrand: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerCopy: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  brandName: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  brandTag: {
    marginTop: 2,
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    marginBottom: spacing.lg,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.35,
    textTransform: 'uppercase',
  },
  loaderPanel: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: 'rgba(241, 245, 249, 0.9)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyLarge,
    textAlign: 'center',
    marginBottom: spacing.lg,
    maxWidth: 420,
    color: '#475569',
  },
  infoCard: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.35,
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  infoCopy: {
    ...typography.body,
    color: '#0F172A',
  },
  buttonStack: {
    width: '100%',
    gap: spacing.sm,
  },
  button: {
    minHeight: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  buttonPrimary: {
    backgroundColor: '#2563EB',
    ...shadows.card,
  },
  buttonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  buttonHover: {
    transform: [{ translateY: -1 }],
  },
  buttonPressed: {
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.72,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  buttonTextSecondary: {
    color: '#0F172A',
  },
});
