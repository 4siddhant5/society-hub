import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { collection, addDoc } from 'firebase/firestore';
import { FiCalendar, FiClock, FiPlus, FiX } from 'react-icons/fi';
import { db } from "../config/firebase";
import AppCard from '../components/ui/AppCard';
import AppButton from '../components/ui/AppButton';
import { useAuth } from '../context/AuthContext';
import { pushNotification } from '../services/notificationHelpers';

export default function CreatePollScreen({ goBack }) {
  const { user, userData } = useAuth();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [creating, setCreating] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');

  const deadlineValue = useMemo(() => {
    if (!deadlineDate || !deadlineTime) {
      return null;
    }

    const parsed = new Date(`${deadlineDate}T${deadlineTime}`);
    return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
  }, [deadlineDate, deadlineTime]);

  const handleAddOption = () => {
    setOptions((prev) => [...prev, '']);
  };

  const handleOptionChange = (text, index) => {
    setOptions((prev) => prev.map((option, optionIndex) => (optionIndex === index ? text : option)));
  };

  const handleRemoveOption = (index) => {
    if (options.length <= 2) {
      Alert.alert('Error', 'A poll must have at least 2 options.');
      return;
    }
    setOptions((prev) => prev.filter((_, optionIndex) => optionIndex !== index));
  };

  const handleSubmit = async () => {
    if (!question.trim()) {
      Alert.alert('Error', 'Question cannot be empty');
      return;
    }

    const validOptions = options.map((option) => option.trim()).filter((option) => option !== '');
    if (validOptions.length < 2) {
      Alert.alert('Error', 'Please provide at least 2 valid options');
      return;
    }

    if ((deadlineDate || deadlineTime) && !deadlineValue) {
      Alert.alert('Error', 'Please enter a valid deadline date and time');
      return;
    }

    if (deadlineValue && deadlineValue <= Date.now()) {
      Alert.alert('Error', 'Deadline must be in the future');
      return;
    }

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

      await addDoc(collection(db, "polls"), payload);

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
      console.error("Poll creation error:", error);
      Alert.alert('Error', 'Failed to create poll');
    } finally {
      setCreating(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppCard style={styles.formCard}>
        <Text style={styles.title}>Create Poll</Text>
        <Text style={styles.subtitle}>Launch a clear poll with stronger presentation and an optional deadline.</Text>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Poll Question</Text>
          <TextInput
            style={[styles.input, styles.questionInput]}
            placeholder="What decision do you want feedback on?"
            value={question}
            onChangeText={setQuestion}
            multiline
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.fieldBlock}>
          <View style={styles.rowHeader}>
            <Text style={styles.label}>Options</Text>
            <Text style={styles.helperText}>At least 2 options</Text>
          </View>
          {options.map((option, index) => (
            <View key={index} style={styles.optionRow}>
              <TextInput
                style={[styles.input, styles.optionInput]}
                placeholder={`Option ${index + 1}`}
                value={option}
                onChangeText={(text) => handleOptionChange(text, index)}
                placeholderTextColor="#94a3b8"
              />
              {options.length > 2 ? (
                <TouchableOpacity onPress={() => handleRemoveOption(index)} style={styles.removeBtn}>
                  <FiX size={16} color="#dc2626" />
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
          <AppButton
            title="Add Option"
            onPress={handleAddOption}
            type="secondary"
            icon={FiPlus}
            style={styles.addOptionButton}
          />
        </View>

        <View style={styles.fieldBlock}>
          <View style={styles.rowHeader}>
            <Text style={styles.label}>Set Deadline (Optional)</Text>
            <Text style={styles.helperText}>Date and time are both optional until you set them.</Text>
          </View>
          <View style={styles.deadlineRow}>
            <View style={styles.deadlineField}>
              <Text style={styles.deadlineFieldLabel}>Date</Text>
              <View style={styles.deadlineInputWrap}>
                <FiCalendar size={16} color="#64748b" />
                <TextInput
                  style={styles.deadlineInput}
                  placeholder="YYYY-MM-DD"
                  value={deadlineDate}
                  onChangeText={setDeadlineDate}
                  autoCapitalize="none"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <View style={styles.deadlineField}>
              <Text style={styles.deadlineFieldLabel}>Time</Text>
              <View style={styles.deadlineInputWrap}>
                <FiClock size={16} color="#64748b" />
                <TextInput
                  style={styles.deadlineInput}
                  placeholder="HH:MM"
                  value={deadlineTime}
                  onChangeText={setDeadlineTime}
                  autoCapitalize="none"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>
          </View>
        </View>

        {creating ? <ActivityIndicator size="large" color="#1a73e8" style={styles.loader} /> : null}

        <View style={styles.actionRow}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
  },
  formCard: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    borderRadius: 24,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  fieldBlock: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  helperText: {
    fontSize: 12,
    color: '#64748b',
  },
  input: {
    borderWidth: 1,
    borderColor: '#dbe3ef',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
    fontSize: 16,
    color: '#0f172a',
  },
  questionInput: {
    minHeight: 108,
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionInput: {
    flex: 1,
  },
  removeBtn: {
    width: 46,
    height: 46,
    marginLeft: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
  },
  addOptionButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  deadlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  deadlineField: {
    flex: 1,
    minWidth: 220,
  },
  deadlineFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  deadlineInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#dbe3ef',
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: '#f8fafc',
  },
  deadlineInput: {
    flex: 1,
    minHeight: 52,
    fontSize: 15,
    color: '#0f172a',
  },
  loader: {
    marginVertical: 8,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
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
