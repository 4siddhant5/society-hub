import React, { useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView
} from "react-native";
import { useTheme } from '../../context/ThemeContext';
import AppCard from '../../components/ui/AppCard';
import AppButton from '../../components/ui/AppButton';
import SectionHeader from '../../components/ui/SectionHeader';
import EmptyState from '../../components/ui/EmptyState';
import { FiBell, FiFileText, FiX } from 'react-icons/fi';


const AnnouncementsScreen = ({ announcements, openPDF }) => {
  const { isDark } = useTheme();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const textColor = isDark ? '#ffffff' : '#1e293b';
  const descColor = isDark ? '#cbd5e1' : '#475569';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f8fafc' }]}>
      <SectionHeader title="Society Announcements" />
      <FlatList
        data={announcements}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelectedAnnouncement(item)}>
            <AppCard style={[styles.card, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }]}>
              <Text style={[styles.title, { color: textColor }]}>{item.title}</Text>
              <Text style={[styles.desc, { color: descColor }]} numberOfLines={2}>{item.description}</Text>
              {!!item.pdfUrl && (
                <AppButton 
                  title="View PDF Document" 
                  onPress={() => openPDF(item.pdfUrl)} 
                  type="success"
                  icon={FiFileText}
                  style={styles.pdfButton}
                />
              )}
              <Text style={styles.date}>Posted: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</Text>
            </AppCard>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<EmptyState message="No announcements yet." icon={FiBell} />}
        contentContainerStyle={styles.list}
      />

      <Modal visible={!!selectedAnnouncement} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#334155' : '#f1f5f9' }]}>
              <Text style={[styles.modalTitle, { color: textColor }]} numberOfLines={2}>{selectedAnnouncement?.title}</Text>
              <TouchableOpacity onPress={() => setSelectedAnnouncement(null)} style={styles.closeBtn}>
                <FiX size={22} color={isDark ? '#cbd5e1' : '#64748b'} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={[styles.modalText, { color: isDark ? '#ffffff' : '#334155' }]}>
                {selectedAnnouncement?.fullText || selectedAnnouncement?.description}
              </Text>
              {!!selectedAnnouncement?.pdfUrl && (
                <AppButton
                  title="View PDF Document"
                  onPress={() => { openPDF(selectedAnnouncement.pdfUrl); setSelectedAnnouncement(null); }}
                  type="success"
                  icon={FiFileText}
                  style={{ marginTop: 16 }}
                />
              )}
              <Text style={styles.modalDate}>
                Posted: {selectedAnnouncement?.createdAt ? new Date(selectedAnnouncement.createdAt).toLocaleDateString() : ''}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#16a34a' },
  title: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  desc: { fontSize: 15, color: '#475569', lineHeight: 22, marginBottom: 16 },
  pdfButton: { marginVertical: 8 },
  date: { fontSize: 12, color: '#94a3b8', textAlign: 'right', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', flex: 1, marginRight: 12 },
  closeBtn: { padding: 4 },
  modalBody: { padding: 20 },
  modalText: { fontSize: 15, color: '#334155', lineHeight: 26 },
  modalDate: { fontSize: 12, color: '#94a3b8', marginTop: 24, textAlign: 'right' },
});

export default AnnouncementsScreen;
