import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../context/AuthContext';
import AppButton from '../components/ui/AppButton';
import { uploadDocument } from '../services/cloudinaryService';
import { pushNotification } from '../services/notificationHelpers';
import { createAnnouncement, updateAnnouncement } from '../services/announcementService';

const getExistingFileName = (url) => {
  if (!url || typeof url !== 'string') return '';
  const cleanUrl = url.split('?')[0];
  const parts = cleanUrl.split('/');
  return decodeURIComponent(parts[parts.length - 1] || 'Attached PDF');
};

export default function CreateAnnouncementScreen({ goBack, announcement }) {
  const { user, userData } = useAuth();
  const { width } = useWindowDimensions();
  const isEditing = !!announcement?.id;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setTitle(announcement?.title || '');
    setDescription(announcement?.description || '');
    setSelectedFile(null);
    setSelectedFileName('');
  }, [announcement]);

  const containerWidth = useMemo(() => {
    if (width >= 1024) return 680;
    if (width >= 768) return 640;
    return '100%';
  }, [width]);

  const existingPdfName = useMemo(() => getExistingFileName(announcement?.pdfUrl), [announcement?.pdfUrl]);
  const submitLabel = isEditing ? 'Update Announcement' : 'Create Announcement';
  const screenTitle = isEditing ? 'Update Announcement' : 'Create Announcement';
  const screenSubtitle = isEditing
    ? 'Review the notice details and save changes safely.'
    : 'Draft a clean society notice and share it with residents.';

  const pickDocument = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf';
        input.onchange = (event) => {
          const file = event.target.files[0];
          if (file) {
            setSelectedFile(file);
            setSelectedFileName(file.name || 'Selected PDF');
          }
        };
        input.click();
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileObj = result.assets[0];
        setSelectedFile(fileObj.uri);
        setSelectedFileName(fileObj.name || 'Selected PDF');
      }
    } catch (error) {
      console.error('Document pick error:', error);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Title and description are required');
      return;
    }

    setUploading(true);
    let pdfUrl = announcement?.pdfUrl || '';

    try {
      if (selectedFile) {
        pdfUrl = await uploadDocument(selectedFile);
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        pdfUrl: pdfUrl || '',
      };

      if (isEditing) {
        await updateAnnouncement(announcement.id, payload);
        Alert.alert('Success', 'Announcement updated successfully!');
      } else {
        await createAnnouncement({
          ...payload,
          societyId: userData.societyId,
          createdBy: user.uid,
        });
        await pushNotification({
          societyId: userData.societyId,
          type: 'ANNOUNCEMENT',
          title: 'New Announcement',
          message: title.trim(),
          targetRole: 'all',
        });
        Alert.alert('Success', 'Announcement created successfully!');
      }

      goBack();
    } catch (error) {
      console.error('Announcement submit error:', error);
      Alert.alert(isEditing ? 'Update Failed' : 'Upload Failed', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={[styles.shell, { maxWidth: containerWidth }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{screenTitle}</Text>
          <Text style={styles.subtitle}>{screenSubtitle}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Announcement Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter a clear title"
              placeholderTextColor="#94a3b8"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Write the full announcement details"
              placeholderTextColor="#94a3b8"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Attachment</Text>
            <View style={styles.uploadRow}>
              <TouchableOpacity onPress={pickDocument} style={styles.attachButton}>
                <Text style={styles.attachButtonText}>Attach PDF</Text>
              </TouchableOpacity>
              <View style={styles.fileMeta}>
                {selectedFileName ? (
                  <Text style={styles.fileText} numberOfLines={1}>
                    {selectedFileName}
                  </Text>
                ) : existingPdfName ? (
                  <Text style={styles.fileText} numberOfLines={1}>
                    Current: {existingPdfName}
                  </Text>
                ) : (
                  <Text style={styles.fileHint}>No PDF attached</Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <AppButton
              title={submitLabel}
              onPress={handleSubmit}
              loading={uploading}
              disabled={uploading}
              style={styles.primaryButton}
            />
            <AppButton
              title="Cancel"
              type="secondary"
              onPress={goBack}
              disabled={uploading}
              style={styles.secondaryButton}
            />
          </View>

          {uploading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.loadingText}>{isEditing ? 'Saving changes...' : 'Publishing announcement...'}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: '#f8fafc',
  },
  shell: {
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#64748b',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
    gap: 18,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: '#dbe4f0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
    fontSize: 15,
    color: '#0f172a',
  },
  textArea: {
    minHeight: 144,
    textAlignVertical: 'top',
  },
  uploadRow: {
    gap: 12,
  },
  attachButton: {
    minHeight: 48,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  attachButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
  },
  fileMeta: {
    minHeight: 22,
    justifyContent: 'center',
  },
  fileText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  fileHint: {
    fontSize: 13,
    color: '#94a3b8',
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    width: '100%',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
});
