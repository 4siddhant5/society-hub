import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
  Platform
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../services/cloudinaryService';
import { createIssue } from '../services/issueService';
import { useAuth } from '../context/AuthContext';
import { pushNotification } from '../services/notificationHelpers';

export default function CreateIssueScreen({ goBack }) {
  const { user, userData } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    try {
      if (Platform.OS === "web") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (event) => {
          const file = event.target.files[0];
          if (file) {
            setSelectedImage(file);
          }
        };
        input.click();
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaType.Images,
          quality: 1,
        });

        if (!result.canceled) {
          setSelectedImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error("Image pick error:", error);
    }
  };

  const handleSubmit = async () => {
    if (!title || !description) {
      Alert.alert('Error', 'Title and description are required.');
      return;
    }

    setUploading(true);
    let imageUrl = '';

    try {
      if (selectedImage) {
        if (Platform.OS === 'web') {
           imageUrl = await uploadImage(selectedImage);
        } else {
           const formattedImage = {
             uri: selectedImage,
             type: 'image/jpeg',
             name: 'issue_image.jpg'
           };
           imageUrl = await uploadImage(formattedImage);
        }
      }

      await createIssue({
        title,
        description,
        category,
        priority,
        beforeImage: imageUrl || '',      // screens check beforeImage
        beforeImageUrl: imageUrl || '',   // backward compat
        status: 'Pending',
        societyId: userData.societyId,
        userId: user.uid,       // filter compat alias
        createdBy: user.uid,    // primary filter field
        createdAt: Date.now(),
      });
      await pushNotification({
        societyId: userData.societyId,
        type: 'ISSUE_CREATED',
        title: 'New Issue Reported',
        message: `${userData.name || 'A resident'} reported: ${title}`,
        targetRole: 'admin',
      });
      console.log('Issue creation log: success');
      Alert.alert('Success', 'Issue created successfully!');
      goBack();
    } catch (error) {
      console.error("Issue creation error:", error);
      Alert.alert('Upload Failed', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Raise a New Issue</Text>
      
      <TextInput style={styles.input} placeholder="Issue Title" value={title} onChangeText={setTitle} />
      <TextInput style={[styles.input, styles.textArea]} placeholder="Detailed Description" value={description} onChangeText={setDescription} multiline numberOfLines={4} />
      <TextInput style={styles.input} placeholder="Category (e.g. Plumbing, Electrical)" value={category} onChangeText={setCategory} />
      <TextInput style={styles.input} placeholder="Priority (e.g. High, Medium, Low)" value={priority} onChangeText={setPriority} />

      <View style={styles.imagePickerContainer}>
        <Button title="Pick an Image (Optional)" onPress={pickImage} color="#666" />
        {selectedImage && (
          <Image 
            source={{ uri: Platform.OS === 'web' && typeof selectedImage !== 'string' ? URL.createObjectURL(selectedImage) : selectedImage }} 
            style={styles.preview} 
          />
        )}
      </View>

      <View style={styles.btnSpacing}>
        {uploading ? (
          <ActivityIndicator size="large" color="#1a73e8" />
        ) : (
          <Button title="Submit Issue" onPress={handleSubmit} color="#1a73e8" />
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
  imagePickerContainer: { marginBottom: 20, alignItems: 'center' },
  preview: { width: 200, height: 200, borderRadius: 8, marginTop: 15, resizeMode: 'cover' },
  btnSpacing: { marginTop: 15 }
});
