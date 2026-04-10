import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Linking,
  Modal,
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
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiFileText,
  FiGlobe,
  FiHelpCircle,
  FiInfo,
  FiLifeBuoy,
  FiLogOut,
  FiMail,
  FiMoon,
  FiShield,
  FiSun,
  FiX,
} from '../utils/iconCompat';
import AppCard from '../components/ui/AppCard';
import AppButton from '../components/ui/AppButton';
import { useTheme } from '../context/ThemeContext';
import { logoutAuthUser } from '../services/authService';
import colors from '../design/colors';
import spacing from '../design/spacing';
import typography from '../design/typography';

const WEB_ONLY = Platform.OS === 'web';

const LANGUAGES = ['English', 'Hindi', 'Marathi'];
const FAQ_ITEMS = [
  {
    question: 'How to participate in polls?',
    answer: 'Open the Polls section, review the active poll, choose your option, and submit your vote before the deadline closes.',
  },
  {
    question: 'How to book facilities?',
    answer: 'Go to the Bookings area, pick the facility, select a date and time range, then submit the request for approval.',
  },
  {
    question: 'How to report issues?',
    answer: 'Use the issue or complaint flow from your dashboard, add the details clearly, and track the status from the Issues section.',
  },
  {
    question: 'How to contact admin?',
    answer: 'You can reach the management team through support, community members, or profile-based contact options available in your society space.',
  },
  {
    question: 'How to update profile?',
    answer: 'Open your profile, tap Edit Profile, update the fields or family member details, and save the changes from the edit screen.',
  },
  {
    question: 'What happens after booking request?',
    answer: 'Your booking stays in pending review until an admin approves or rejects it. You can check the final status and any rejection reason inside My Bookings.',
  },
];

const LEGAL_CONTENT = {
  terms: {
    title: 'Terms & Conditions',
    subtitle: 'Please review these usage terms before using SocietyHub services.',
    sections: [
      {
        heading: 'User Responsibilities',
        points: [
          'Keep your profile details accurate, especially contact information, flat details, and household records.',
          'Use SocietyHub respectfully and avoid uploading misleading, abusive, or harmful content.',
          'You are responsible for activity performed through your account unless unauthorized access is reported promptly.',
        ],
      },
      {
        heading: 'Platform Usage Rules',
        points: [
          'SocietyHub is intended for community communication, issue reporting, polls, bookings, and approved society operations.',
          'Users must not misuse the platform for spam, impersonation, harassment, or unauthorized commercial activity.',
          'Feature availability may vary depending on your role, society permissions, and administrative decisions.',
        ],
      },
      {
        heading: 'Admin Authority Scope',
        points: [
          'Admins may review resident requests, issue reports, booking requests, and moderation needs within their society workspace.',
          'Admin actions must remain limited to society management functions and do not transfer ownership of your personal device or broader accounts.',
          'SocietyHub may rely on admin decisions for approvals, rejections, announcements, and operational updates inside the app.',
        ],
      },
      {
        heading: 'Data Usage Disclaimer',
        points: [
          'Information shown in the app is used to enable society features and improve coordination between residents and admins.',
          'While reasonable care is taken, users should avoid storing unnecessary sensitive information inside optional profile fields or issue descriptions.',
          'SocietyHub may display shared community information where relevant to society workflows and approved participants.',
        ],
      },
      {
        heading: 'Booking & Poll Terms',
        points: [
          'Booking approvals are subject to society rules, availability, and admin review. Submission does not guarantee approval.',
          'Poll participation should be fair and truthful. Closed polls may remain visible for review, analytics, or record keeping.',
          'Repeated misuse of bookings, polls, or reporting tools may lead to restricted access based on society administration decisions.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'This summary explains what profile information is collected and how it is used.',
    sections: [
      {
        heading: 'Data Collected',
        points: [
          'SocietyHub may collect profile information such as your name, email address, flat information, and related society details.',
          'Additional data you choose to provide, such as phone numbers, family members, emergency contacts, bookings, issue reports, and poll activity, may also be stored for app functionality.',
        ],
      },
      {
        heading: 'How Data Is Used',
        points: [
          'Your information is used to power core app functions like profile display, resident verification, bookings, issue handling, and community participation.',
          'Contact information may be used for operational communication, society updates, approval workflows, and support responses.',
        ],
      },
      {
        heading: 'Data Protection Statement',
        points: [
          'SocietyHub is designed to handle data required for community management while limiting exposure to authorized users and role-based access.',
          'We aim to use reasonable safeguards to protect stored information, but users should still avoid sharing unnecessary confidential data in open fields.',
          'If policies or data practices change, updated privacy information should be reviewed inside the app when made available.',
        ],
      },
    ],
  },
};

const SectionHeader = ({ icon: Icon, title, subtitle, isDark }) => (
  <View style={styles.sectionHeader}>
    <View style={[styles.sectionIcon, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.18)' : colors.primarySurface }]}>
      <Icon size={16} color={isDark ? '#60a5fa' : colors.primary} />
    </View>
    <View style={styles.sectionCopy}>
      <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : colors.textPrimary }]}>{title}</Text>
      {subtitle ? <Text style={[styles.sectionSubtitle, { color: isDark ? '#94a3b8' : colors.textSecondary }]}>{subtitle}</Text> : null}
    </View>
  </View>
);

const ActionRow = ({ icon: Icon, title, subtitle, rightContent, onPress, isDark, danger = false }) => (
  <Pressable
    onPress={onPress}
    style={({ hovered, pressed }) => [
      styles.actionRow,
      {
        backgroundColor: isDark ? '#0f172a' : '#f8fafc',
        borderColor: isDark ? '#1e293b' : colors.border,
      },
      hovered && WEB_ONLY && styles.actionRowHover,
      pressed && styles.actionRowPressed,
    ]}
  >
    <View style={[styles.rowIcon, { backgroundColor: danger ? '#fee2e2' : isDark ? 'rgba(59, 130, 246, 0.18)' : colors.primarySurface }]}>
      <Icon size={16} color={danger ? colors.danger : isDark ? '#60a5fa' : colors.primary} />
    </View>
    <View style={styles.rowCopy}>
      <Text style={[styles.rowTitle, { color: danger ? colors.danger : isDark ? '#f8fafc' : colors.textPrimary }]}>{title}</Text>
      {subtitle ? <Text style={[styles.rowSubtitle, { color: isDark ? '#94a3b8' : colors.textSecondary }]}>{subtitle}</Text> : null}
    </View>
    {rightContent || <FiChevronRight size={18} color={isDark ? '#64748b' : colors.textSecondary} />}
  </Pressable>
);

export default function SettingsScreen({ navigation }) {
  const { isDark, toggleTheme } = useTheme();
  const { width } = useWindowDimensions();
  const [language, setLanguage] = useState('English');
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [activeLegalKey, setActiveLegalKey] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isWide = width >= 900;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const palette = useMemo(
    () => ({
      background: isDark ? '#0b1220' : '#f8fafc',
      text: isDark ? '#f8fafc' : colors.textPrimary,
      subtle: isDark ? '#94a3b8' : colors.textSecondary,
      surface: isDark ? '#111827' : colors.card,
      border: isDark ? '#1f2937' : colors.border,
      accent: isDark ? '#60a5fa' : colors.primary,
      accentSoft: isDark ? 'rgba(59, 130, 246, 0.18)' : colors.primarySurface,
      modalBackdrop: isDark ? 'rgba(2, 6, 23, 0.72)' : 'rgba(15, 23, 42, 0.42)',
    }),
    [isDark]
  );

  const activeLegalContent = activeLegalKey ? LEGAL_CONTENT[activeLegalKey] : null;

  const handleSupportPress = async () => {
    const supportEmail = 'mailto:c282481@gmail.com';
    try {
      await Linking.openURL(supportEmail);
    } catch (error) {
      Alert.alert('Support', 'Unable to open email client right now.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.topBarButton}>
          <FiChevronLeft size={18} color={palette.text} />
          <Text style={[styles.topBarButtonText, { color: palette.text }]}>Back</Text>
        </Pressable>
        <Text style={[styles.topBarTitle, { color: palette.text }]}>Settings</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.contentShell, isWide && styles.contentShellWide]}>
            <AppCard style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <SectionHeader icon={FiSun} title="Preferences" subtitle="Personalize your dashboard experience." isDark={isDark} />

              <View style={styles.sectionBody}>
                <ActionRow
                  icon={isDark ? FiMoon : FiSun}
                  title="Dark Mode"
                  subtitle={isDark ? 'Enabled' : 'Disabled'}
                  onPress={toggleTheme}
                  isDark={isDark}
                  rightContent={
                    <View style={[styles.toggleTrack, { backgroundColor: isDark ? palette.accent : '#cbd5e1' }]}>
                      <View style={[styles.toggleThumb, isDark && styles.toggleThumbActive]} />
                    </View>
                  }
                />

                <View>
                  <ActionRow
                    icon={FiGlobe}
                    title="Language"
                    subtitle={language}
                    onPress={() => setShowLanguageOptions((prev) => !prev)}
                    isDark={isDark}
                    rightContent={<FiChevronDown size={18} color={palette.subtle} />}
                  />

                  {showLanguageOptions ? (
                    <View style={[styles.optionList, { borderColor: palette.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
                      {LANGUAGES.map((option) => (
                        <Pressable
                          key={option}
                          onPress={() => {
                            setLanguage(option);
                            setShowLanguageOptions(false);
                          }}
                          style={({ hovered, pressed }) => [
                            styles.optionItem,
                            option === language && { backgroundColor: palette.accentSoft },
                            hovered && WEB_ONLY && styles.optionItemHover,
                            pressed && styles.optionItemPressed,
                          ]}
                        >
                          <Text style={[styles.optionText, { color: option === language ? palette.accent : palette.text }]}>{option}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            </AppCard>

            <AppCard style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <SectionHeader icon={FiLifeBuoy} title="Support" subtitle="Reach out whenever you need help." isDark={isDark} />

              <View style={styles.sectionBody}>
                <ActionRow
                  icon={FiMail}
                  title="Support Email"
                  subtitle="c282481@gmail.com"
                  onPress={handleSupportPress}
                  isDark={isDark}
                />
                <AppButton title="Contact Support" onPress={handleSupportPress} style={styles.fullButton} />
              </View>
            </AppCard>

            <AppCard style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <SectionHeader icon={FiFileText} title="Legal" subtitle="Important policies and terms." isDark={isDark} />

              <View style={styles.sectionBody}>
                <ActionRow
                  icon={FiFileText}
                  title="Terms & Conditions"
                  subtitle="Review responsibilities, platform rules, and booking or poll terms."
                  onPress={() => setActiveLegalKey('terms')}
                  isDark={isDark}
                />
                <ActionRow
                  icon={FiShield}
                  title="Privacy Policy"
                  subtitle="See what profile data is collected and how it is used."
                  onPress={() => setActiveLegalKey('privacy')}
                  isDark={isDark}
                />
              </View>
            </AppCard>

            <AppCard style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <SectionHeader icon={FiInfo} title="App Info" subtitle="Current release details." isDark={isDark} />

              <View style={styles.sectionBody}>
                <View style={[styles.infoRow, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: palette.border }]}>
                  <Text style={[styles.infoLabel, { color: palette.subtle }]}>Version</Text>
                  <Text style={[styles.infoValue, { color: palette.text }]}>v1.0.0</Text>
                </View>
              </View>
            </AppCard>

            <AppCard style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <SectionHeader icon={FiHelpCircle} title="FAQ" subtitle="Quick answers to common questions." isDark={isDark} />

              <View style={styles.sectionBody}>
                {FAQ_ITEMS.map((item, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <Pressable
                      key={item.question}
                      onPress={() => setOpenFaqIndex(isOpen ? null : index)}
                      style={({ hovered, pressed }) => [
                        styles.faqItem,
                        {
                          backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                          borderColor: palette.border,
                        },
                        hovered && WEB_ONLY && styles.actionRowHover,
                        pressed && styles.actionRowPressed,
                      ]}
                    >
                      <View style={styles.faqHeader}>
                        <Text style={[styles.faqQuestion, { color: palette.text }]}>{item.question}</Text>
                        {isOpen ? (
                          <FiChevronDown size={18} color={palette.subtle} />
                        ) : (
                          <FiChevronRight size={18} color={palette.subtle} />
                        )}
                      </View>
                      {isOpen ? <Text style={[styles.faqAnswer, { color: palette.subtle }]}>{item.answer}</Text> : null}
                    </Pressable>
                  );
                })}
              </View>
            </AppCard>

            <AppCard style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <SectionHeader icon={FiLogOut} title="Account" subtitle="Manage your session safely." isDark={isDark} />

              <View style={styles.sectionBody}>
                <View style={[styles.logoutDivider, { backgroundColor: palette.border }]} />
                <ActionRow
                  icon={FiLogOut}
                  title="Logout"
                  subtitle="Sign out from SocietyHub"
                  onPress={logoutAuthUser}
                  isDark={isDark}
                  danger
                  rightContent={<Text style={styles.logoutActionText}>Logout</Text>}
                />
              </View>
            </AppCard>
          </View>
        </ScrollView>
      </Animated.View>

      <Modal
        visible={!!activeLegalContent}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveLegalKey(null)}
      >
        <View style={[styles.legalModalOverlay, { backgroundColor: palette.modalBackdrop }]}>
          <View
            style={[
              styles.legalModalCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                maxWidth: isWide ? 760 : undefined,
              },
            ]}
          >
            <View style={styles.legalModalHeader}>
              <View style={styles.legalModalHeaderCopy}>
                <Text style={[styles.legalModalTitle, { color: palette.text }]}>{activeLegalContent?.title}</Text>
                <Text style={[styles.legalModalSubtitle, { color: palette.subtle }]}>{activeLegalContent?.subtitle}</Text>
              </View>
              <Pressable
                onPress={() => setActiveLegalKey(null)}
                style={({ hovered, pressed }) => [
                  styles.closeButton,
                  { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: palette.border },
                  hovered && WEB_ONLY && styles.actionRowHover,
                  pressed && styles.actionRowPressed,
                ]}
              >
                <FiX size={16} color={palette.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.legalScroll} contentContainerStyle={styles.legalScrollContent} showsVerticalScrollIndicator={false}>
              {activeLegalContent?.sections.map((section) => (
                <View key={section.heading} style={styles.legalSection}>
                  <Text style={[styles.legalSectionHeading, { color: palette.text }]}>{section.heading}</Text>
                  {section.points.map((point) => (
                    <Text key={point} style={[styles.legalPoint, { color: palette.subtle }]}>
                      {'\u2022'} {point}
                    </Text>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  contentShell: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  contentShellWide: {
    maxWidth: 1040,
  },
  sectionCard: {
    borderRadius: 24,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCopy: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.section,
  },
  sectionSubtitle: {
    ...typography.body,
    marginTop: 4,
  },
  sectionBody: {
    gap: spacing.sm,
  },
  actionRow: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    transitionDuration: WEB_ONLY ? '160ms' : undefined,
  },
  actionRowHover: {
    transform: [{ translateY: -2 }],
    ...Platform.select({
      web: {
        boxShadow: '0 12px 24px rgba(15, 23, 42, 0.08)',
      },
      default: {},
    }),
  },
  actionRowPressed: {
    transform: [{ scale: 0.992 }],
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  rowSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  toggleTrack: {
    width: 46,
    height: 28,
    borderRadius: 999,
    padding: 3,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  optionList: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 8,
    marginTop: spacing.xs,
    gap: 6,
  },
  optionItem: {
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  optionItemHover: {
    opacity: 0.92,
  },
  optionItemPressed: {
    transform: [{ scale: 0.995 }],
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fullButton: {
    marginTop: 4,
  },
  infoRow: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  faqItem: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  faqAnswer: {
    ...typography.body,
    marginTop: spacing.sm,
  },
  logoutDivider: {
    height: 1,
    marginBottom: spacing.xs,
    opacity: 0.85,
  },
  logoutActionText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '800',
  },
  legalModalOverlay: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legalModalCard: {
    width: '100%',
    maxHeight: '82%',
    borderWidth: 1,
    borderRadius: 28,
    padding: spacing.lg,
  },
  legalModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  legalModalHeaderCopy: {
    flex: 1,
  },
  legalModalTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  legalModalSubtitle: {
    ...typography.body,
    marginTop: 6,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legalScroll: {
    flexGrow: 0,
  },
  legalScrollContent: {
    paddingBottom: spacing.sm,
  },
  legalSection: {
    marginBottom: spacing.lg,
  },
  legalSectionHeading: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  legalPoint: {
    ...typography.body,
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
});
