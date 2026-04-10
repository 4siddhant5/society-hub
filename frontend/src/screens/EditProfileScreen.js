import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { FiCamera, FiChevronLeft, FiMail, FiPhone, FiTrash2, FiUserPlus } from '../utils/iconCompat';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AppCard from '../components/ui/AppCard';
import AppButton from '../components/ui/AppButton';
import colors from '../design/colors';
import spacing from '../design/spacing';
import typography from '../design/typography';
import { uploadImage } from '../services/cloudinaryService';
import { getUserDocument } from '../services/userService';
import {
  createEmptyFamilyMember,
  getProfileInitial,
  normalizeUserProfile,
  sanitizeFamilyMembers,
} from '../utils/profileUtils';

const InputField = ({ label, value, onChangeText, placeholder, keyboardType, isDark, editable = true }) => (
  <View style={styles.inputWrap}>
    <Text style={[styles.inputLabel, { color: isDark ? '#cbd5e1' : colors.textSecondary }]}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      editable={editable}
      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
      style={[
        styles.input,
        {
          backgroundColor: isDark ? '#0f172a' : '#f8fafc',
          borderColor: isDark ? '#1e293b' : colors.border,
          color: isDark ? '#f8fafc' : colors.textPrimary,
          opacity: editable ? 1 : 0.8,
        },
      ]}
    />
  </View>
);

const SectionCard = ({ eyebrow, title, subtitle, children, isDark }) => (
  <AppCard
    style={[
      styles.sectionCard,
      {
        backgroundColor: isDark ? '#111827' : colors.card,
        borderColor: isDark ? '#1f2937' : colors.border,
      },
    ]}
  >
    <Text style={[styles.sectionEyebrow, { color: isDark ? '#60a5fa' : colors.primary }]}>{eyebrow}</Text>
    <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : colors.textPrimary }]}>{title}</Text>
    {subtitle ? <Text style={[styles.sectionSubtitle, { color: isDark ? '#94a3b8' : colors.textSecondary }]}>{subtitle}</Text> : null}
    <View style={styles.sectionBody}>{children}</View>
  </AppCard>
);

export default function EditProfileScreen({ navigation, userId }) {
  const { user, currentUser, setCurrentUser } = useAuth();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [flat, setFlat] = useState('');
  const [wing, setWing] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactNumber, setEmergencyContactNumber] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const targetId = userId || user?.uid;

  useEffect(() => {
    if (!targetId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchUserData = async () => {
      try {
        const profile = await getUserDocument(targetId);
        if (!profile || !mounted) {
          return;
        }

        const data = normalizeUserProfile(profile);
        setName(data.name);
        setEmail(data.email);
        setFlat(data.flat);
        setWing(data.wing);
        setPhoneNumber(data.phoneNumber);
        setAlternatePhone(data.alternatePhone);
        setEmergencyContactName(data.emergencyContactName);
        setEmergencyContactNumber(data.emergencyContactNumber);
        setBloodGroup(data.bloodGroup);
        setProfileImageUrl(data.profileImageUrl || null);
        setFamilyMembers(data.familyMembers.length ? data.familyMembers : []);
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Could not fetch profile info.');
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

    fetchUserData();

    return () => {
      mounted = false;
    };
  }, [targetId, fadeAnim]);

  const palette = useMemo(
    () => ({
      background: isDark ? '#0b1220' : '#f8fafc',
      text: isDark ? '#f8fafc' : colors.textPrimary,
      subtle: isDark ? '#94a3b8' : colors.textSecondary,
      border: isDark ? '#1f2937' : colors.border,
      surface: isDark ? '#111827' : colors.card,
      accent: isDark ? '#60a5fa' : colors.primary,
      accentSoft: isDark ? 'rgba(59, 130, 246, 0.18)' : colors.primarySurface,
    }),
    [isDark]
  );

  const handlePickImage = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          setSaving(true);
          try {
            const url = await uploadImage(file);
            setProfileImageUrl(url);
          } finally {
            setSaving(false);
          }
        };
        input.click();
        return;
      }

      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Permission to access photos is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (!result.canceled) {
        setSaving(true);
        try {
          const url = await uploadImage({
            uri: result.assets[0].uri,
            type: 'image/jpeg',
            name: 'profile.jpg',
          });
          setProfileImageUrl(url);
        } finally {
          setSaving(false);
        }
      }
    } catch (error) {
      console.error(error);
      setSaving(false);
      Alert.alert('Error', 'Failed to upload image.');
    }
  };

  const addFamilyMember = () => {
    setFamilyMembers((prev) => [...prev, createEmptyFamilyMember()]);
  };

  const updateFamilyMember = (index, field, value) => {
    setFamilyMembers((prev) =>
      prev.map((member, memberIndex) =>
        memberIndex === index ? { ...member, [field]: value } : member
      )
    );
  };

  const removeFamilyMember = (index) => {
    setFamilyMembers((prev) => prev.filter((_, memberIndex) => memberIndex !== index));
  };

  const validateFamilyMembers = () => {
    const rows = sanitizeFamilyMembers(familyMembers);

    for (const member of rows) {
      if (!member.name || !member.relation) {
        Alert.alert('Incomplete Family Member', 'Each family member needs at least a name and relation.');
        return null;
      }
    }

    return rows;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Name is required.');
      return;
    }

    if ((emergencyContactName.trim() && !emergencyContactNumber.trim()) || (!emergencyContactName.trim() && emergencyContactNumber.trim())) {
      Alert.alert('Incomplete Emergency Info', 'Please add both emergency contact name and number.');
      return;
    }

    const cleanedFamilyMembers = validateFamilyMembers();
    if (!cleanedFamilyMembers) {
      return;
    }

    setSaving(true);

    const payload = {
      name: name.trim(),
      flat: flat.trim(),
      wing: wing.trim(),
      phoneNumber: phoneNumber.trim(),
      alternatePhone: alternatePhone.trim(),
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactNumber: emergencyContactNumber.trim(),
      bloodGroup: bloodGroup.trim(),
      profileImageUrl: profileImageUrl || '',
      familyMembers: cleanedFamilyMembers,
    };

    try {
      await updateDoc(doc(db, 'users', targetId), payload);

      if (targetId === user?.uid) {
        setCurrentUser((prev) => {
          if (!prev || prev.uid !== targetId) {
            return prev;
          }

          return {
            ...prev,
            ...payload,
            email: email || prev.email || '',
          };
        });
      }

      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.topBarButton}>
          <FiChevronLeft size={18} color={palette.text} />
          <Text style={[styles.topBarButtonText, { color: palette.text }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.topBarTitle, { color: palette.text }]}>Edit Profile</Text>
        <AppButton
          title={saving ? 'Saving...' : 'Save'}
          onPress={handleSave}
          disabled={saving || loading}
          style={styles.saveButton}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.accent} />
        </View>
      ) : (
        <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.contentShell}>
              <AppCard
                style={[
                  styles.heroCard,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                  },
                ]}
              >
                <View style={styles.avatarWrap}>
                  <Pressable onPress={handlePickImage} disabled={saving} style={styles.avatarButton}>
                    {profileImageUrl ? (
                      <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
                    ) : (
                      <View style={[styles.placeholderImage, { backgroundColor: palette.accent }]}>
                        <Text style={styles.placeholderText}>{getProfileInitial({ name })}</Text>
                      </View>
                    )}
                    <View style={[styles.cameraBadge, { backgroundColor: palette.accent }]}>
                      <FiCamera size={16} color="#ffffff" />
                    </View>
                  </Pressable>
                  <View style={styles.avatarCopy}>
                    <Text style={[styles.heroName, { color: palette.text }]}>{name || currentUser?.name || 'Your profile'}</Text>
                    <Text style={[styles.heroEmail, { color: palette.subtle }]}>{email || currentUser?.email || 'No email available'}</Text>
                  </View>
                </View>
              </AppCard>

              <SectionCard eyebrow="Section 1" title="Personal Info" subtitle="Basic identity and residence details." isDark={isDark}>
                <InputField label="Full Name" value={name} onChangeText={setName} placeholder="Your name" isDark={isDark} />
                <InputField label="Flat Number" value={flat} onChangeText={setFlat} placeholder="Flat or door number" isDark={isDark} />
                <InputField label="Wing" value={wing} onChangeText={setWing} placeholder="Wing or block" isDark={isDark} />
              </SectionCard>

              <SectionCard eyebrow="Section 2" title="Contact Info" subtitle="Main contact details used across the app." isDark={isDark}>
                <View style={styles.readOnlyRow}>
                  <View style={[styles.readOnlyIcon, { backgroundColor: palette.accentSoft }]}>
                    <FiMail size={16} color={palette.accent} />
                  </View>
                  <View style={styles.readOnlyCopy}>
                    <Text style={[styles.inputLabel, { color: palette.subtle }]}>Email</Text>
                    <Text style={[styles.readOnlyValue, { color: palette.text }]}>{email || 'Not available'}</Text>
                  </View>
                </View>
                <InputField label="Phone Number" value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Primary phone number" keyboardType="phone-pad" isDark={isDark} />
                <InputField label="Alternate Phone" value={alternatePhone} onChangeText={setAlternatePhone} placeholder="Optional alternate number" keyboardType="phone-pad" isDark={isDark} />
              </SectionCard>

              <SectionCard eyebrow="Section 3" title="Emergency Info" subtitle="Helpful details for urgent situations." isDark={isDark}>
                <InputField
                  label="Emergency Contact Name"
                  value={emergencyContactName}
                  onChangeText={setEmergencyContactName}
                  placeholder="Contact person name"
                  isDark={isDark}
                />
                <InputField
                  label="Emergency Contact Number"
                  value={emergencyContactNumber}
                  onChangeText={setEmergencyContactNumber}
                  placeholder="Contact person number"
                  keyboardType="phone-pad"
                  isDark={isDark}
                />
                <InputField label="Blood Group" value={bloodGroup} onChangeText={setBloodGroup} placeholder="Optional blood group" isDark={isDark} />
              </SectionCard>

              <SectionCard eyebrow="Section 4" title="Family Members" subtitle="Add household members for a richer profile." isDark={isDark}>
                {familyMembers.length ? (
                  <View style={styles.memberList}>
                    {familyMembers.map((member, index) => (
                      <View
                        key={`family-member-${index}`}
                        style={[
                          styles.memberCard,
                          {
                            backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                            borderColor: isDark ? '#1e293b' : colors.border,
                          },
                        ]}
                      >
                        <View style={styles.memberHeader}>
                          <View style={styles.memberHeading}>
                            <View style={[styles.memberIconWrap, { backgroundColor: palette.accentSoft }]}>
                              <FiUserPlus size={16} color={palette.accent} />
                            </View>
                            <Text style={[styles.memberTitle, { color: palette.text }]}>Member {index + 1}</Text>
                          </View>
                          <Pressable onPress={() => removeFamilyMember(index)} style={styles.removeButton}>
                            <FiTrash2 size={16} color={colors.danger} />
                            <Text style={styles.removeButtonText}>Remove</Text>
                          </Pressable>
                        </View>

                        <InputField
                          label="Name"
                          value={member.name}
                          onChangeText={(value) => updateFamilyMember(index, 'name', value)}
                          placeholder="Member name"
                          isDark={isDark}
                        />
                        <InputField
                          label="Relation"
                          value={member.relation}
                          onChangeText={(value) => updateFamilyMember(index, 'relation', value)}
                          placeholder="Relation"
                          isDark={isDark}
                        />
                        <InputField
                          label="Age"
                          value={member.age}
                          onChangeText={(value) => updateFamilyMember(index, 'age', value)}
                          placeholder="Optional age"
                          keyboardType="numeric"
                          isDark={isDark}
                        />
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={[styles.emptyState, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: palette.border }]}>
                    <FiUserPlus size={18} color={palette.accent} />
                    <Text style={[styles.emptyStateText, { color: palette.subtle }]}>No family members added yet.</Text>
                  </View>
                )}

                <AppButton
                  type="secondary"
                  title="Add Member"
                  onPress={addFamilyMember}
                  style={[
                    styles.addMemberCta,
                    {
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#334155' : colors.borderStrong,
                    },
                  ]}
                  textStyle={{ color: palette.text }}
                />
              </SectionCard>
            </View>
          </ScrollView>
        </Animated.View>
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
  },
  topBar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  topBarButton: {
    minWidth: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topBarButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
  },
  saveButton: {
    minWidth: 84,
    minHeight: 40,
    paddingVertical: 8,
    borderRadius: 12,
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
  heroCard: {
    borderRadius: 24,
    marginBottom: spacing.md,
  },
  avatarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  avatarButton: {
    position: 'relative',
  },
  profileImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#cbd5e1',
  },
  placeholderImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#ffffff',
    fontSize: 38,
    fontWeight: '800',
  },
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  avatarCopy: {
    flex: 1,
    minWidth: 180,
  },
  heroName: {
    ...typography.title,
    fontSize: 24,
  },
  heroEmail: {
    ...typography.body,
    marginTop: 4,
  },
  sectionCard: {
    borderRadius: 24,
    marginBottom: spacing.md,
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionTitle: {
    ...typography.section,
    marginTop: 6,
  },
  sectionSubtitle: {
    ...typography.body,
    marginTop: 6,
  },
  sectionBody: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  inputWrap: {
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
  },
  readOnlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 2,
    marginBottom: spacing.sm,
  },
  readOnlyIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readOnlyCopy: {
    flex: 1,
  },
  readOnlyValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  memberList: {
    gap: spacing.sm,
  },
  memberCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: spacing.md,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  memberHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  memberIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  removeButtonText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyStateText: {
    ...typography.body,
  },
  addMemberCta: {
    marginTop: spacing.sm,
  },
});
