import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity
} from "react-native";
import { db } from "../config/firebase";
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { pushNotification } from '../services/notificationHelpers';

export default function CreatePollScreen({ goBack }) {
  const { user, userData } = useAuth();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [creating, setCreating] = useState(false);

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleOptionChange = (text, index) => {
    const newOptions = [...options];
    newOptions[index] = text;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index) => {
    if (options.length <= 2) {
      Alert.alert('Error', 'A poll must have at least 2 options.');
      return;
    }
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const handleSubmit = async () => {
    if (!question.trim()) {
      Alert.alert('Error', 'Question cannot be empty');
      return;
    }

    const validOptions = options.map(o => o.trim()).filter(o => o !== '');
    if (validOptions.length < 2) {
      Alert.alert('Error', 'Please provide at least 2 valid options');
      return;
    }

    setCreating(true);

    try {
      await addDoc(collection(db, "polls"), {
        question: question.trim(),
        options: validOptions,
        votes: {},
        societyId: userData.societyId,
        createdBy: user.uid,
        isClosed: false,
        createdAt: Date.now()
      });

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
      <Text style={styles.title}>Create Poll</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Poll Question" 
        value={question} 
        onChangeText={setQuestion} 
        multiline
      />

      <Text style={styles.subtitle}>Options</Text>
      {options.map((option, index) => (
        <View key={index} style={styles.optionRow}>
          <TextInput
            style={[styles.input, styles.optionInput]}
            placeholder={`Option ${index + 1}`}
            value={option}
            onChangeText={(text) => handleOptionChange(text, index)}
          />
          {options.length > 2 && (
            <TouchableOpacity onPress={() => handleRemoveOption(index)} style={styles.removeBtn}>
              <Text style={styles.removeBtnText}>X</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      <View style={styles.btnSpacing}>
        <Button title="+ Add Option" onPress={handleAddOption} color="#666" />
      </View>

      <View style={styles.btnSpacing}>
        {creating ? (
          <ActivityIndicator size="large" color="#1a73e8" />
        ) : (
          <Button title="Create Poll" onPress={handleSubmit} color="#1a73e8" />
        )}
      </View>

      <View style={styles.btnSpacing}>
         <Button title="Cancel" onPress={goBack} color="#d32f2f" disabled={creating} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#fff', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#555' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 15, marginBottom: 15, backgroundColor: '#fafafa', fontSize: 16 },
  optionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  optionInput: { flex: 1, marginBottom: 0 },
  removeBtn: { marginLeft: 10, padding: 10, backgroundColor: '#ffebee', borderRadius: 8 },
  removeBtnText: { color: '#d32f2f', fontWeight: 'bold' },
  btnSpacing: { marginTop: 15 }
});
