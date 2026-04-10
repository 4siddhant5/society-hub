import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  FiAlertCircle,
  FiBarChart2,
  FiCalendar,
  FiChevronLeft,
  FiHome,
  FiMail,
  FiPhone,
  FiSettings,
  FiShield,
  FiUsers,
} from '../utils/iconCompat';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { db } from '../config/firebase';
import { getUserDocument } from '../services/userService';
import AppCard from '../components/ui/AppCard';
import AppButton from '../components/ui/AppButton';
import colors from '../design/colors';
import shadows from '../design/shadows';
import spacing from '../design/spacing';
import typography from '../design/typography';
import {
  calculateProfileCompletion,
  getProfileInitial,
  getRoleLabel,
  normalizeUserProfile,
} from '../utils/profileUtils';

const WEB_ONLY = Platform.OS === 'web';
const EMPTY_INSIGHTS = {
  pollsParticipated: 0,
  issuesReported: 0,
  bookingsMade: 0,
};

const getIdentity = (value) => value?.id || value?.uid || null;
const isUserIssue = (issue, profileId) =>
  [issue?.userId, issue?.createdBy, issue?.residentId, issue?.reportedBy].some((candidate) => candidate === profileId);

const SurfaceCard = ({ children, style, onPress, disabled = false }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ hovered, pressed }) => [
      styles.surfaceCard,
      hovered && WEB_ONLY && styles.surfaceCardHover,
      pressed && onPress && styles.surfaceCardPressed,
      style,
    ]}
  >
    {children}
  </Pressable>
);

const FieldRow = ({ icon: Icon, label, value, isDark }) => (
  <View style={styles.fieldRow}>
    <View style={[styles.fieldIconWrap, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.18)' : colors.primarySurface }]}>
      <Icon size={16} color={isDark ? '#93c5fd' : colors.primary} />
    </View>
    <View style={styles.fieldCopy}>
      <Text style={[styles.fieldLabel, { color: isDark ? '#94a3b8' : colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.fieldValue, { color: isDark ? '#f8fafc' : colors.textPrimary }]}>{value || 'Not added'}</Text>
    </View>
  </View>
);

const InsightStat = ({ icon: Icon, label, value, isDark }) => (
  <View
    style={[
      styles.insightItem,
      {
        backgroundColor: isDark ? '#0f172a' : '#f8fafc',
        borderColor: isDark ? '#1e293b' : colors.border,
      },
    ]}
  >
    <View style={[styles.insightIconWrap, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.18)' : colors.primarySurface }]}>
      <Icon size={16} color={isDark ? '#93c5fd' : colors.primary} />
    </View>
    <View style={styles.insightCopy}>
      <Text style={[styles.insightValue, { color: isDark ? '#f8fafc' : colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.insightLabel, { color: isDark ? '#94a3b8' : colors.textSecondary }]}>{label}</Text>
    </View>
  </View>
);

const InfoCard = ({ title, eyebrow, children, isDark, style }) => (
  <SurfaceCard
    style={[
      styles.infoCard,
      shadows.card,
      {
        backgroundColor: isDark ? '#111827' : colors.card,
        borderColor: isDark ? '#1f2937' : colors.border,
      },
      style,
    ]}
  >
    <Text style={[styles.infoEyebrow, { color: isDark ? '#60a5fa' : colors.primary }]}>{eyebrow}</Text>
    <Text style={[styles.infoTitle, { color: isDark ? '#f8fafc' : colors.textPrimary }]}>{title}</Text>
    <View style={styles.infoBody}>{children}</View>
  </SurfaceCard>
);

export default function ProfileScreen({ navigation, userId }) {
  const { user, currentUser } = useAuth();
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(EMPTY_INSIGHTS);
  const [showSettingsTooltip, setShowSettingsTooltip] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const targetId = userId || user?.uid;
  const isWide = width >= 920;
  const profileId = userProfile?.id || targetId;
  const currentProfileId = getIdentity(currentUser) || user?.uid || null;
  const isOwnProfile = Boolean(currentProfileId && profileId && currentProfileId === profileId);

  useEffect(() => {
    if (!targetId) {
      setLoading(false);
      setInsights(EMPTY_INSIGHTS);
      return;
    }

    let mounted = true;

    const fetchUser = async () => {
      try {
        const profile = await getUserDocument(targetId);
        if (mounted) {
          setUserProfile(profile ? normalizeUserProfile(profile) : null);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        if (mounted) {
          setUserProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }).start();
        }
      }
    };

    fetchUser();

    return () => {
      mounted = false;
    };
  }, [targetId, fadeAnim]);

  useEffect(() => {
    if (!profileId || !userProfile?.societyId) {
      setInsights(EMPTY_INSIGHTS);
      return;
    }

    let active = true;

    const fetchInsights = async () => {
      try {
        const [pollSnapshot, issueSnapshot, bookingSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'polls'), where('societyId', '==', userProfile.societyId))),
          getDocs(query(collection(db, 'issues'), where('societyId', '==', userProfile.societyId))),
          getDocs(query(collection(db, 'bookings', userProfile.societyId, 'entries'), where('userId', '==', profileId))),
        ]);

        if (!active) {
          return;
        }

        setInsights({
          pollsParticipated: pollSnapshot.docs.reduce((count, item) => count + (item.data()?.votes?.[profileId] ? 1 : 0), 0),
          issuesReported: issueSnapshot.docs.reduce((count, item) => count + (isUserIssue(item.data(), profileId) ? 1 : 0), 0),
          bookingsMade: bookingSnapshot.size,
        });
      } catch (error) {
        console.error('Error fetching profile insights:', error);
        if (active) {
          setInsights(EMPTY_INSIGHTS);
        }
      }
    };

    fetchInsights();

    return () => {
      active = false;
    };
  }, [profileId, userProfile?.societyId]);

  const completion = useMemo(() => calculateProfileCompletion(userProfile || {}), [userProfile]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: completion.percentage,
      duration: 520,
      useNativeDriver: false,
    }).start();
  }, [completion.percentage, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const palette = useMemo(
    () => ({
      background: isDark ? '#0b1220' : '#f8fafc',
      panel: isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.92)',
      panelBorder: isDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(255, 255, 255, 0.75)',
      text: isDark ? '#f8fafc' : colors.textPrimary,
      subtle: isDark ? '#94a3b8' : colors.textSecondary,
      accent: isDark ? '#60a5fa' : colors.primary,
      accentSoft: isDark ? 'rgba(59, 130, 246, 0.18)' : colors.primarySurface,
      track: isDark ? '#1f2937' : '#dbeafe',
      fill: isDark ? '#60a5fa' : colors.primary,
    }),
    [isDark]
  );

  const familyMembers = userProfile?.familyMembers || [];
  const quickInsights = useMemo(
    () => [
      { key: 'polls', label: 'Total Polls Participated', value: insights.pollsParticipated, icon: FiBarChart2 },
      { key: 'issues', label: 'Issues Reported', value: insights.issuesReported, icon: FiAlertCircle },
      { key: 'bookings', label: 'Bookings Made', value: insights.bookingsMade, icon: FiCalendar },
    ],
    [insights.bookingsMade, insights.issuesReported, insights.pollsParticipated]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.topBarButton}>
          <FiChevronLeft size={18} color={palette.text} />
          <Text style={[styles.topBarButtonText, { color: palette.text }]}>Back</Text>
        </Pressable>
        <Text style={[styles.topBarTitle, { color: palette.text }]}>Profile</Text>
        <View style={styles.topBarSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.accent} />
        </View>
      ) : userProfile ? (
        <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.scrollContent, isWide && styles.scrollContentWide]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.contentShell}>
              <SurfaceCard
                style={[
                  styles.heroCard,
                  shadows.card,
                  {
                    backgroundColor: palette.panel,
                    borderColor: palette.panelBorder,
                  },
                ]}
              >
                <View style={styles.heroGlowPrimary} />
                <View style={styles.heroGlowSecondary} />

                {isOwnProfile ? (
                  <View style={styles.heroUtility}>
                    {showSettingsTooltip ? (
                      <View
                        pointerEvents="none"
                        style={[
                          styles.settingsTooltip,
                          { backgroundColor: isDark ? '#020617' : '#0f172a' },
                        ]}
                      >
                        <Text style={styles.settingsTooltipText}>Settings</Text>
                      </View>
                    ) : null}

                    <Pressable
                      onPress={() => navigation.navigate('SettingsScreen')}
                      onHoverIn={() => setShowSettingsTooltip(true)}
                      onHoverOut={() => setShowSettingsTooltip(false)}
                      onFocus={() => setShowSettingsTooltip(true)}
                      onBlur={() => setShowSettingsTooltip(false)}
                      accessibilityLabel="Settings"
                      style={({ hovered, pressed }) => [
                        styles.iconCircleButton,
                        {
                          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.82)' : 'rgba(255, 255, 255, 0.72)',
                          borderColor: isDark ? '#334155' : 'rgba(255, 255, 255, 0.8)',
                        },
                        hovered && WEB_ONLY && styles.iconCircleButtonHover,
                        pressed && styles.iconCircleButtonPressed,
                      ]}
                    >
                      <FiSettings size={18} color={palette.text} />
                    </Pressable>
                  </View>
                ) : null}

                <View style={[styles.heroTopRow, !isWide && styles.heroTopRowCompact, isOwnProfile && styles.heroTopRowWithUtility]}>
                  <View style={styles.heroIdentity}>
                    {userProfile.profileImageUrl ? (
                      <Image source={{ uri: userProfile.profileImageUrl }} style={styles.profileImage} />
                    ) : (
                      <View style={[styles.placeholderImage, { backgroundColor: palette.accent }]}>
                        <Text style={styles.placeholderText}>{getProfileInitial(userProfile)}</Text>
                      </View>
                    )}

                    <View style={styles.heroCopy}>
                      <View style={styles.nameRow}>
                        <Text style={[styles.heroName, { color: palette.text }]}>{userProfile.name || 'Unknown user'}</Text>
                        <View style={[styles.rolePill, { backgroundColor: palette.accentSoft }]}>
                          <Text style={[styles.rolePillText, { color: palette.accent }]}>{getRoleLabel(userProfile.role)}</Text>
                        </View>
                      </View>
                      <Text style={[styles.heroEmail, { color: palette.subtle }]}>{userProfile.email || 'No email added'}</Text>
                    </View>
                  </View>

                  {isOwnProfile ? (
                    <View style={[styles.heroActions, !isWide && styles.heroActionsCompact]}>
                      <AppButton
                        type="secondary"
                        title="Edit Profile"
                        onPress={() => navigation.navigate('EditProfileScreen', { userId: targetId })}
                        style={[
                          styles.editProfileButton,
                          {
                            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.82)' : 'rgba(255, 255, 255, 0.78)',
                            borderColor: isDark ? '#334155' : colors.border,
                          },
                        ]}
                        textStyle={{ color: palette.text }}
                      />
                    </View>
                  ) : null}
                </View>
              </SurfaceCard>

              {isOwnProfile ? (
                <AppCard
                  style={[
                    styles.progressCard,
                    {
                      backgroundColor: isDark ? '#111827' : colors.card,
                      borderColor: isDark ? '#1f2937' : colors.border,
                    },
                  ]}
                >
                  <View style={styles.progressHeader}>
                    <View>
                      <Text style={[styles.progressTitle, { color: palette.text }]}>Profile Completion: {completion.percentage}%</Text>
                      <Text style={[styles.progressHint, { color: palette.subtle }]}>Complete your profile for a better experience</Text>
                    </View>
                    <View style={[styles.progressBadge, { backgroundColor: palette.accentSoft }]}>
                      <Text style={[styles.progressBadgeText, { color: palette.accent }]}>
                        {completion.completed}/{completion.total}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: palette.track }]}>
                    <Animated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: palette.fill }]} />
                  </View>
                </AppCard>
              ) : null}

              <View style={styles.grid}>
                <InfoCard title="Society Details" eyebrow="Residence" isDark={isDark} style={[styles.gridCard, isWide && styles.gridCardHalf]}>
                  <FieldRow icon={FiHome} label="Flat Number" value={userProfile.flat} isDark={isDark} />
                  <FieldRow icon={FiHome} label="Wing" value={userProfile.wing} isDark={isDark} />
                  <FieldRow icon={FiShield} label="Role" value={getRoleLabel(userProfile.role)} isDark={isDark} />
                </InfoCard>

                <InfoCard title="Contact Information" eyebrow="Contact" isDark={isDark} style={[styles.gridCard, isWide && styles.gridCardHalf]}>
                  <FieldRow icon={FiMail} label="Email" value={userProfile.email} isDark={isDark} />
                  <FieldRow icon={FiPhone} label="Phone Number" value={userProfile.phoneNumber} isDark={isDark} />
                  <FieldRow icon={FiPhone} label="Alternate Phone" value={userProfile.alternatePhone} isDark={isDark} />
                </InfoCard>

                <InfoCard title="Emergency Info" eyebrow="Emergency" isDark={isDark} style={[styles.gridCard, isWide && styles.gridCardHalf]}>
                  <FieldRow icon={FiShield} label="Emergency Contact Name" value={userProfile.emergencyContactName} isDark={isDark} />
                  <FieldRow icon={FiPhone} label="Emergency Phone Number" value={userProfile.emergencyContactNumber} isDark={isDark} />
                  <FieldRow icon={FiShield} label="Blood Group" value={userProfile.bloodGroup} isDark={isDark} />
                </InfoCard>

                <InfoCard title="Quick Insights" eyebrow="Activity" isDark={isDark} style={[styles.gridCard, isWide && styles.gridCardHalf]}>
                  <View style={styles.insightGrid}>
                    {quickInsights.map((item) => (
                      <InsightStat
                        key={item.key}
                        icon={item.icon}
                        label={item.label}
                        value={item.value}
                        isDark={isDark}
                      />
                    ))}
                  </View>
                </InfoCard>

                <InfoCard title="Family Members" eyebrow="Household" isDark={isDark} style={[styles.gridCard, styles.gridCardFull]}>
                  <View style={styles.familyHeader}>
                    <Text style={[styles.familySubtitle, { color: palette.subtle }]}>
                      {familyMembers.length
                        ? `${familyMembers.length} member${familyMembers.length > 1 ? 's' : ''} ${isOwnProfile ? 'added' : 'listed'}`
                        : isOwnProfile
                          ? 'No family members added yet'
                          : 'No family members shared yet'}
                    </Text>
                    {isOwnProfile ? (
                      <AppButton
                        type="secondary"
                        title="Add Member"
                        onPress={() => navigation.navigate('EditProfileScreen', { userId: targetId })}
                        style={[
                          styles.addMemberButton,
                          {
                            backgroundColor: isDark ? '#0f172a' : '#ffffff',
                            borderColor: isDark ? '#334155' : colors.borderStrong,
                          },
                        ]}
                        textStyle={{ color: palette.text }}
                      />
                    ) : null}
                  </View>

                  {familyMembers.length ? (
                    <View style={styles.familyGrid}>
                      {familyMembers.map((member, index) => (
                        <View
                          key={`${member.name}-${member.relation}-${index}`}
                          style={[
                            styles.familyCard,
                            isWide && styles.familyCardWide,
                            {
                              backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                              borderColor: isDark ? '#1e293b' : colors.border,
                            },
                          ]}
                        >
                          <View style={[styles.familyAvatar, { backgroundColor: palette.accentSoft }]}>
                            <FiUsers size={16} color={palette.accent} />
                          </View>
                          <View style={styles.familyCopy}>
                            <Text style={[styles.familyName, { color: palette.text }]}>{member.name || 'Unnamed member'}</Text>
                            <Text style={[styles.familyMeta, { color: palette.subtle }]}>
                              {member.relation || 'Relation not added'}
                              {member.age ? ` | Age ${member.age}` : ''}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={[styles.emptyFamilyState, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: isDark ? '#1e293b' : colors.border }]}>
                      <FiUsers size={18} color={palette.accent} />
                      <Text style={[styles.emptyFamilyText, { color: palette.subtle }]}>Family member details will appear here once added.</Text>
                    </View>
                  )}
                </InfoCard>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      ) : (
        <View style={styles.center}>
          <Text style={[styles.emptyStateText, { color: palette.subtle }]}>User profile not found.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  topBar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarButton: {
    minWidth: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topBarButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  topBarSpacer: {
    width: 72,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  scrollContentWide: {
    paddingHorizontal: spacing.xl,
  },
  contentShell: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
  },
  surfaceCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    transitionDuration: WEB_ONLY ? '180ms' : undefined,
  },
  surfaceCardHover: {
    transform: [{ translateY: -4 }],
    ...shadows.hover,
  },
  surfaceCardPressed: {
    transform: [{ scale: 0.995 }],
  },
  heroCard: {
    position: 'relative',
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  heroGlowPrimary: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(37, 99, 235, 0.18)',
    top: -60,
    right: -20,
  },
  heroGlowSecondary: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    bottom: -50,
    left: -10,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  heroTopRowWithUtility: {
    paddingRight: 56,
  },
  heroTopRowCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  heroUtility: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    zIndex: 2,
    alignItems: 'flex-end',
  },
  heroIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    minWidth: 0,
  },
  profileImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#cbd5e1',
  },
  placeholderImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  heroName: {
    ...typography.title,
    fontSize: 26,
    lineHeight: 32,
  },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroEmail: {
    ...typography.body,
    marginTop: spacing.xs,
  },
  heroActions: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  heroActionsCompact: {
    alignItems: 'stretch',
    width: '100%',
  },
  iconCircleButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    transitionDuration: WEB_ONLY ? '160ms' : undefined,
  },
  iconCircleButtonHover: {
    transform: [{ translateY: -2 }],
  },
  iconCircleButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  settingsTooltip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 8,
  },
  settingsTooltipText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  editProfileButton: {
    minWidth: 132,
  },
  progressCard: {
    borderRadius: 24,
    marginBottom: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressTitle: {
    ...typography.section,
    fontSize: 18,
  },
  progressHint: {
    ...typography.body,
    marginTop: 4,
  },
  progressBadge: {
    minWidth: 52,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
  },
  progressBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '100%',
  },
  gridCardHalf: {
    width: '48.2%',
  },
  gridCardFull: {
    width: '100%',
  },
  infoCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  infoTitle: {
    ...typography.section,
    marginTop: 6,
  },
  infoBody: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  insightGrid: {
    gap: spacing.sm,
  },
  insightItem: {
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  insightIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightCopy: {
    flex: 1,
  },
  insightValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  insightLabel: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fieldIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldCopy: {
    flex: 1,
    minWidth: 0,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  familyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  familySubtitle: {
    ...typography.body,
    flex: 1,
  },
  addMemberButton: {
    minWidth: 126,
    minHeight: 42,
  },
  familyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  familyCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  familyCardWide: {
    width: '48.5%',
  },
  familyAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyCopy: {
    flex: 1,
  },
  familyName: {
    fontSize: 15,
    fontWeight: '700',
  },
  familyMeta: {
    fontSize: 13,
    marginTop: 4,
  },
  emptyFamilyState: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyFamilyText: {
    ...typography.body,
    textAlign: 'center',
  },
  emptyStateText: {
    ...typography.bodyLarge,
    textAlign: 'center',
  },
});
