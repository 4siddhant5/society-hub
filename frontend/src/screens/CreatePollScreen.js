import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
import { FiCalendar, FiClock, FiPlus, FiX } from '../utils/iconCompat';
import { db } from '../config/firebase';
import AppCard from '../components/ui/AppCard';
import AppButton from '../components/ui/AppButton';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { pushNotification } from '../services/notificationHelpers';
import {
  DatePickerModal,
  TimePickerModal,
  formatTimeDisplay,
} from '../components/polls/PollDeadlinePickers';

const getFormErrors = ({ question, options, deadlineDate, deadlineTime, deadlineValue }) => {
  const errors = {};
  const trimmedQuestion = question.trim();
  const validOptions = options.map((option) => option.trim()).filter(Boolean);

  if (!trimmedQuestion) {
    errors.question = 'Enter a poll question before creating the poll.';
  }

  if (validOptions.length < 2) {
    errors.options = 'At least two non-empty options are required.';
  }

  if ((deadlineDate || deadlineTime) && !(deadlineDate && deadlineTime)) {
    errors.deadline = 'Select both a date and a time, or clear the deadline.';
  } else if ((deadlineDate || deadlineTime) && !deadlineValue) {
    errors.deadline = 'Choose a valid future deadline.';
  } else if (deadlineValue && deadlineValue <= Date.now()) {
    errors.deadline = 'Deadline must be in the future.';
  }

  return errors;
};

const FieldError = ({ message }) =>
  message ? <Text style={styles.fieldError}>{message}</Text> : null;

export default function CreatePollScreen({ goBack }) {
  const { user, userData } = useAuth();
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [creating, setCreating] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [errors, setErrors] = useState({});
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  const isCompact = width < 900;
  const deadlineValue = useMemo(() => {
    if (!deadlineDate || !deadlineTime) {
      return null;
    }

    const parsed = new Date(`${deadlineDate}T${deadlineTime}`);
    return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
  }, [deadlineDate, deadlineTime]);

  const deadlinePreview = useMemo(() => {
    if (!deadlineValue) {
      return '';
    }

    return new Date(deadlineValue).toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }, [deadlineValue]);

  const handleAddOption = () => {
    setOptions((prev) => [...prev, '']);
  };

  const handleOptionChange = (text, index) => {
    setOptions((prev) => prev.map((option, optionIndex) => (optionIndex === index ? text : option)));
    setErrors((current) => ({ ...current, options: undefined }));
  };

  const handleRemoveOption = (index) => {
    if (options.length <= 2) {
      return;
    }

    setOptions((prev) => prev.filter((_, optionIndex) => optionIndex !== index));
    setErrors((current) => ({ ...current, options: undefined }));
  };

  const handleClearDeadline = () => {
    setDeadlineDate('');
    setDeadlineTime('');
    setErrors((current) => ({ ...current, deadline: undefined }));
  };

  const handleSubmit = async () => {
    const nextErrors = getFormErrors({ question, options, deadlineDate, deadlineTime, deadlineValue });
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    const validOptions = options.map((option) => option.trim()).filter(Boolean);
    setCreating(true);

    try {
      const payload = {
        question: question.trim(),
        options: validOptions,
        votes: {},
        societyId: userData.societyId,
        createdBy: user.uid,
        isClosed: false,
        createdAt: Date.now(),
      };

      if (deadlineValue) {
        payload.deadline = deadlineValue;
      }

      await addDoc(collection(db, 'polls'), payload);

      await pushNotification({
        societyId: userData.societyId,
        type: 'POLL',
        title: 'New Poll',
        message: question.trim(),
        targetRole: 'all',
      });
      Alert.alert('Success', 'Poll created successfully!');
      goBack();
    } catch (error) {
      console.error('Poll creation error:', error);
      Alert.alert('Error', 'Failed to create poll');
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: isDark ? '#07111f' : '#f3f7fb' }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.backgroundOrbs}>
          <View style={[styles.orb, styles.orbPrimary, { opacity: isDark ? 0.22 : 0.4 }]} />
          <View style={[styles.orb, styles.orbSecondary, { opacity: isDark ? 0.18 : 0.28 }]} />
        </View>

        <AppCard
          style={[
            styles.formCard,
            {
              backgroundColor: isDark ? 'rgba(8,15,28,0.92)' : '#ffffff',
              borderColor: isDark ? 'rgba(148,163,184,0.12)' : '#e2e8f0',
            },
          ]}
        >
          <View style={styles.hero}>
            <View style={styles.heroCopy}>
              <Text style={[styles.title, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Create Poll</Text>
              <Text style={[styles.subtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                Launch a polished poll with clear choices and an optional closing deadline.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Poll Question</Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  borderColor: errors.question ? '#fca5a5' : isDark ? 'rgba(148,163,184,0.14)' : '#dbe3ef',
                  backgroundColor: isDark ? 'rgba(15,23,42,0.56)' : '#f8fafc',
                  color: isDark ? '#f8fafc' : '#0f172a',
                },
              ]}
              placeholder="What decision do you want feedback on?"
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              value={question}
              onChangeText={(text) => {
                setQuestion(text);
                setErrors((current) => ({ ...current, question: undefined }));
              }}
              multiline
              textAlignVertical="top"
            />
            <FieldError message={errors.question} />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Options</Text>
                <Text style={[styles.sectionHint, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  Add at least two answer choices.
                </Text>
              </View>
              <AppButton
                title="Add Option"
                onPress={handleAddOption}
                type="secondary"
                icon={FiPlus}
                style={styles.addOptionButton}
              />
            </View>

            <View style={styles.optionList}>
              {options.map((option, index) => (
                <View key={index} style={styles.optionRow}>
                  <View
                    style={[
                      styles.optionIndex,
                      { backgroundColor: isDark ? 'rgba(37,99,235,0.16)' : '#dbeafe' },
                    ]}
                  >
                    <Text style={styles.optionIndexText}>{index + 1}</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.optionInput,
                      {
                        borderColor: errors.options ? '#fca5a5' : isDark ? 'rgba(148,163,184,0.14)' : '#dbe3ef',
                        backgroundColor: isDark ? 'rgba(15,23,42,0.56)' : '#f8fafc',
                        color: isDark ? '#f8fafc' : '#0f172a',
                      },
                    ]}
                    placeholder={`Option ${index + 1}`}
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    value={option}
                    onChangeText={(text) => handleOptionChange(text, index)}
                  />
                  {options.length > 2 ? (
                    <Pressable
                      style={[
                        styles.removeButton,
                        {
                          backgroundColor: isDark ? 'rgba(239,68,68,0.14)' : '#fee2e2',
                          borderColor: isDark ? 'rgba(239,68,68,0.18)' : '#fecaca',
                        },
                      ]}
                      onPress={() => handleRemoveOption(index)}
                    >
                      <FiX size={16} color="#dc2626" />
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
            <FieldError message={errors.options} />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Deadline</Text>
                <Text style={[styles.sectionHint, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  Optional. Set both date and time if the poll should close automatically.
                </Text>
              </View>
              {(deadlineDate || deadlineTime) ? (
                <Pressable onPress={handleClearDeadline} style={styles.clearDeadlineButton}>
                  <Text style={styles.clearDeadlineText}>Clear</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={[styles.deadlineRow, isCompact && styles.deadlineRowCompact]}>
              <Pressable
                style={[
                  styles.deadlineCard,
                  {
                    borderColor: errors.deadline ? '#fca5a5' : isDark ? 'rgba(148,163,184,0.14)' : '#dbe3ef',
                    backgroundColor: isDark ? 'rgba(15,23,42,0.56)' : '#f8fafc',
                  },
                ]}
                onPress={() => setDatePickerVisible(true)}
              >
                <View style={styles.deadlineLabelRow}>
                  <FiCalendar size={17} color="#2563eb" />
                  <Text style={[styles.deadlineLabel, { color: isDark ? '#cbd5e1' : '#475569' }]}>Date</Text>
                </View>
                <Text style={[styles.deadlineValue, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  {deadlineDate
                    ? new Date(`${deadlineDate}T00:00:00`).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Select deadline date'}
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.deadlineCard,
                  {
                    borderColor: errors.deadline ? '#fca5a5' : isDark ? 'rgba(148,163,184,0.14)' : '#dbe3ef',
                    backgroundColor: isDark ? 'rgba(15,23,42,0.56)' : '#f8fafc',
                  },
                ]}
                onPress={() => setTimePickerVisible(true)}
              >
                <View style={styles.deadlineLabelRow}>
                  <FiClock size={17} color="#0f766e" />
                  <Text style={[styles.deadlineLabel, { color: isDark ? '#cbd5e1' : '#475569' }]}>Time</Text>
                </View>
                <Text style={[styles.deadlineValue, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  {deadlineTime ? formatTimeDisplay(deadlineTime) : 'Select deadline time'}
                </Text>
              </Pressable>
            </View>

            {deadlinePreview ? (
              <View
                style={[
                  styles.deadlinePreview,
                  { backgroundColor: isDark ? 'rgba(37,99,235,0.12)' : '#eff6ff' },
                ]}
              >
                <Text style={styles.deadlinePreviewLabel}>Poll closes on</Text>
                <Text style={[styles.deadlinePreviewValue, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  {deadlinePreview}
                </Text>
              </View>
            ) : null}
            <FieldError message={errors.deadline} />
          </View>

          {creating ? <ActivityIndicator size="large" color="#2563eb" style={styles.loader} /> : null}

          <View style={[styles.actionRow, isCompact && styles.actionRowCompact]}>
            <AppButton
              title="Create Poll"
              onPress={handleSubmit}
              loading={creating}
              disabled={creating}
              style={styles.primaryAction}
            />
            <AppButton
              title="Cancel"
              onPress={goBack}
              type="secondary"
              disabled={creating}
              style={styles.secondaryAction}
            />
          </View>
        </AppCard>
      </ScrollView>

      <DatePickerModal
        visible={datePickerVisible}
        value={deadlineDate}
        onClose={() => setDatePickerVisible(false)}
        onSelect={(nextDate) => {
          setDeadlineDate(nextDate);
          setErrors((current) => ({ ...current, deadline: undefined }));
        }}
      />
      <TimePickerModal
        visible={timePickerVisible}
        value={deadlineTime}
        onClose={() => setTimePickerVisible(false)}
        onSelect={(nextTime) => {
          setDeadlineTime(nextTime);
          setErrors((current) => ({ ...current, deadline: undefined }));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 30,
    justifyContent: 'center',
  },
  backgroundOrbs: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbPrimary: {
    width: 320,
    height: 320,
    right: -90,
    top: -50,
    backgroundColor: '#bfdbfe',
  },
  orbSecondary: {
    width: 260,
    height: 260,
    left: -80,
    bottom: 40,
    backgroundColor: '#ccfbf1',
  },
  formCard: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
    borderRadius: 28,
    padding: 24,
    marginBottom: 0,
  },
  hero: {
    marginBottom: 26,
  },
  heroCopy: {
    gap: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionHint: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  addOptionButton: {
    minWidth: 144,
  },
  optionList: {
    gap: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionIndex: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIndexText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  optionInput: {
    flex: 1,
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  removeButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deadlineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  deadlineRowCompact: {
    flexDirection: 'column',
  },
  deadlineCard: {
    flex: 1,
    minHeight: 98,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  deadlineLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deadlineLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  deadlineValue: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  clearDeadlineButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearDeadlineText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
  },
  deadlinePreview: {
    marginTop: 12,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  deadlinePreviewLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1d4ed8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  deadlinePreviewValue: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '800',
  },
  fieldError: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: '#dc2626',
  },
  loader: {
    marginVertical: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionRowCompact: {
    flexDirection: 'column',
  },
  primaryAction: {
    flex: 1,
    minWidth: 180,
  },
  secondaryAction: {
    flex: 1,
    minWidth: 180,
  },
});
