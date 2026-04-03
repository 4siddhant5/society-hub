import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity
} from "react-native";
import AppCard from '../../components/ui/AppCard';
import AppButton from '../../components/ui/AppButton';
import SectionHeader from '../../components/ui/SectionHeader';
import EmptyState from '../../components/ui/EmptyState';
import { FiBell, FiEdit, FiTrash2 } from 'react-icons/fi';

const AdminAnnouncementsScreen = ({ announcements, handleEditClick, handleDeleteAnnouncement, openPDF, onNavigate }) => {
  const { isDark } = useTheme();
  const textColor = isDark ? '#ffffff' : '#1e293b';
  const descColor = isDark ? '#cbd5e1' : '#475569';
  const toDateValue = (value) => {
    if (!value) return null;
    if (typeof value === 'number') return new Date(value);
    if (value?.toDate) return value.toDate();
    if (value?.seconds) return new Date(value.seconds * 1000);
    return new Date(value);
  };
  const formatDate = (value) => {
    const date = toDateValue(value);
    return date ? date.toLocaleDateString() : '';
  };
  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f8fafc' }]}>
      <SectionHeader 
        title="Announcements" 
        subtitle="Manage society notices" 
        rightComponent={
          <AppButton 
            title="Create New" 
            onPress={() => onNavigate('CreateAnnouncement')} 
            type="primary"
            style={styles.createBtn}
          />
        }
      />
      <FlatList
        data={announcements}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const isGlobal = !!item.isGlobal;
          return (
            <AppCard style={[styles.card, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }]}>
              <View style={styles.content}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, { color: textColor }]}>{item.title}</Text>
                  {isGlobal && <Text style={styles.globalTag}>Global</Text>}
                </View>
                <Text style={[styles.desc, { color: descColor }]}>{item.description}</Text>
                {!!item.pdfUrl && (
                  <TouchableOpacity onPress={() => openPDF(item.pdfUrl)}>
                    <Text style={styles.pdfLink}>📄 View PDF</Text>
                  </TouchableOpacity>
                )}
              </View>
              {!isGlobal && (
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => handleEditClick(item)} style={styles.actionBtn}>
                    <FiEdit size={18} color="#2563eb" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteAnnouncement(item.id)} style={styles.actionBtn}>
                    <FiTrash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              )}
              <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
            </AppCard>
          );
        }}
        ListEmptyComponent={<EmptyState message="No announcements posted." icon={FiBell} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { marginBottom: 12 },
  createBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  content: { marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  title: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 4, marginRight: 8 },
  globalTag: { fontSize: 11, fontWeight: '700', color: '#2563eb', backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, marginBottom: 4 },
  desc: { fontSize: 14, color: '#475569', lineHeight: 20 },
  pdfLink: { color: '#16a34a', fontWeight: '600', fontSize: 14, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  actionBtn: { padding: 4 },
  date: { fontSize: 11, color: '#94a3b8', textAlign: 'right', marginTop: 8 }
});

export default AdminAnnouncementsScreen;
