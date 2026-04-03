import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator
} from "react-native";
import { db } from "../config/firebase";
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { pushNotification } from '../services/notificationHelpers';

export default function BroadcastScreen({ goBack }) {
  const { userData, user } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'broadcasts'), {
        title: title.trim(),
        message: message.trim(),
        societyId: userData.societyId,
        createdBy: user.uid,
        senderName: userData.name,
        timestamp: Date.now(),
        type: 'broadcast',
      });
      await pushNotification({
        societyId: userData.societyId,
        type: 'BROADCAST',
        title: 'New Broadcast',
        message: `${title.trim()}: ${message.trim()}`,
        targetRole: 'all',
      });
      Alert.alert('Success', 'Broadcast sent to all residents');
      goBack();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to send broadcast");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Broadcast</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Broadcast Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Water Supply Update"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Message</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Details about the emergency or update..."
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity 
          style={[styles.sendBtn, loading && styles.disabledBtn]} 
          onPress={handleSendBroadcast}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendBtnText}>📢 SEND BROADCAST</Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.warningText}>
          Note: This will be visible to all residents in your society instantly.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { marginRight: 15 },
  backBtnText: { fontSize: 16, color: '#1a73e8', fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  form: { padding: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20, backgroundColor: '#f9f9f9' },
  textArea: { height: 120, textAlignVertical: 'top' },
  sendBtn: { backgroundColor: '#d32f2f', padding: 18, borderRadius: 10, alignItems: 'center', boxShadow: '0px 10px 20px rgba(211, 47, 47, 0.28)' },
  sendBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  disabledBtn: { opacity: 0.6 },
  warningText: { marginTop: 15, color: '#888', fontSize: 12, textAlign: 'center', fontStyle: 'italic' }
});
