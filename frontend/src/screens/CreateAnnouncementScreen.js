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
  Platform
} from "react-native";
import * as DocumentPicker from 'expo-document-picker';
import { uploadDocument } from '../services/cloudinaryService';
import { db } from "../config/firebase";
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { pushNotification } from '../services/notificationHelpers';

export default function CreateAnnouncementScreen({ goBack }) {
  const { user, userData } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const pickDocument = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/pdf";
        input.onchange = (event) => {
          const file = event.target.files[0];
          if (file) {
            setSelectedFile(file);
          }
        };
        input.click();
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/pdf',
          copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const fileObj = result.assets[0];
          setSelectedFile(fileObj.uri);
          console.log("Got file:", fileObj.uri);
        }
      }
    } catch (error) {
      console.error("Document pick error:", error);
    }
  };

  const handleSubmit = async () => {
    if (!title || !description) {
      Alert.alert('Error', 'Title and description are required');
      return;
    }

    setUploading(true);
    let pdfUrl = "";

    try {
      if (selectedFile) {
        pdfUrl = await uploadDocument(selectedFile);
      }

      await addDoc(collection(db, 'announcements'), {
        title,
        description,
        pdfUrl: pdfUrl || '',
        societyId: userData.societyId,
        createdBy: user.uid,
        createdAt: Date.now(),
      });
      await pushNotification({
        societyId: userData.societyId,
        type: 'ANNOUNCEMENT',
        title: 'New Announcement',
        message: title,
        targetRole: 'all',
      });
      console.log('Announcement creation log: success');
      Alert.alert('Success', 'Announcement created successfully!');
      goBack();
    } catch (error) {
      console.error("Announcement creation error:", error);
      Alert.alert('Upload Failed', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Announcement</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Announcement Title" 
        value={title} 
        onChangeText={setTitle} 
      />
      
      <TextInput 
        style={[styles.input, styles.textArea]} 
        placeholder="Detailed Description" 
        value={description} 
        onChangeText={setDescription} 
        multiline 
        numberOfLines={4} 
      />

      <View style={styles.pickerContainer}>
        <Button title="Attach PDF (Optional)" onPress={pickDocument} color="#666" />
        {selectedFile && (
          <Text style={styles.fileText}>PDF Selected ✅</Text>
        )}
      </View>

      <View style={styles.btnSpacing}>
        {uploading ? (
          <ActivityIndicator size="large" color="#1a73e8" />
        ) : (
          <Button title="Create Announcement" onPress={handleSubmit} color="#1a73e8" />
        )}
      </View>

      <View style={styles.btnSpacing}>
         <Button title="Cancel" onPress={goBack} color="#d32f2f" disabled={uploading} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#fff', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 15, marginBottom: 15, backgroundColor: '#fafafa', fontSize: 16 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  pickerContainer: { marginBottom: 20, alignItems: 'center' },
  fileText: { marginTop: 10, color: '#34a853', fontWeight: 'bold' },
  btnSpacing: { marginTop: 15 }
});
