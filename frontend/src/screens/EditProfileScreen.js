import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Image,
  ScrollView,
  Platform,
  Alert
} from "react-native";
import { db } from "../config/firebase";
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../services/cloudinaryService';

export default function EditProfileScreen({ navigation, userId }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [flat, setFlat] = useState('');
  const [wing, setWing] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState(null);

  // Fallback to user.uid if no userId is passed
  const targetId = userId || user?.uid;

  useEffect(() => {
    if (!targetId) return;
    const fetchUserData = async () => {
      try {
        const docRef = doc(db, 'users', targetId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || '');
          setFlat(data.flat || '');
          setWing(data.wing || '');
          setProfileImageUrl(data.profileImageUrl || null);
        }
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "Could not fetch profile info.");
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [targetId]);

  const handlePickImage = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (event) => {
          const file = event.target.files[0];
          if (file) {
             setSaving(true);
             const url = await uploadImage(file);
             setProfileImageUrl(url);
             setSaving(false);
          }
        };
        input.click();
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
        if (!result.canceled) {
           setSaving(true);
           const url = await uploadImage({ uri: result.assets[0].uri, type: 'image/jpeg', name: 'profile.jpg' });
           setProfileImageUrl(url);
           setSaving(false);
        }
      }
    } catch (e) {
      console.error(e);
      setSaving(false);
      Alert.alert("Error", "Failed to upload image.");
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
       Alert.alert("Required", "Name is required.");
       return;
    }
    setSaving(true);
    try {
       const docRef = doc(db, 'users', targetId);
       await updateDoc(docRef, {
         name: name.trim(),
         flat: flat.trim(),
         wing: wing.trim(),
         profileImageUrl: profileImageUrl
       });
       Alert.alert("Success", "Profile updated successfully!");
       navigation.goBack();
    } catch (error) {
       console.error(error);
       Alert.alert("Error", "Failed to update profile.");
    } finally {
       setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
          <Text style={[styles.saveBtnText, saving && styles.disabledText]}>Save</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#075E54" /></View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.imageSection}>
             <TouchableOpacity style={styles.imageContainer} onPress={handlePickImage} disabled={saving}>
               {profileImageUrl ? (
                 <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
               ) : (
                 <View style={styles.placeholderImage}>
                    <Text style={styles.placeholderText}>{name ? name.charAt(0).toUpperCase() : '?'}</Text>
                 </View>
               )}
               <View style={styles.cameraIconContainer}>
                 <Text style={styles.cameraIcon}>📷</Text>
               </View>
             </TouchableOpacity>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
               <Text style={styles.label}>Name</Text>
               <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your Name" />
            </View>
            <View style={styles.inputGroup}>
               <Text style={styles.label}>Flat Number</Text>
               <TextInput style={styles.input} value={flat} onChangeText={setFlat} placeholder="Flat Number" />
            </View>
            <View style={styles.inputGroup}>
               <Text style={styles.label}>Wing</Text>
               <TextInput style={styles.input} value={wing} onChangeText={setWing} placeholder="Wing (Optional)" />
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#075E54', paddingTop: Platform.OS === 'android' ? 40 : 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  backBtn: { padding: 5, width: 70 },
  backBtnText: { color: '#fff', fontSize: 16 },
  saveBtn: { padding: 5, width: 70, alignItems: 'flex-end' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  disabledText: { opacity: 0.5 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  imageSection: { alignItems: 'center', marginVertical: 30 },
  imageContainer: { position: 'relative' },
  profileImage: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#ddd' },
  placeholderImage: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#128C7E', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 60, color: '#fff', fontWeight: 'bold' },
  cameraIconContainer: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#25D366', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#f0f2f5' },
  cameraIcon: { fontSize: 18, color: '#fff' },
  formSection: { paddingHorizontal: 20 },
  inputGroup: { backgroundColor: '#fff', marginBottom: 15, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10, elevation: 1 },
  label: { fontSize: 12, color: '#128C7E', fontWeight: 'bold', marginBottom: 5 },
  input: { fontSize: 16, color: '#333', paddingVertical: 5 }
});
