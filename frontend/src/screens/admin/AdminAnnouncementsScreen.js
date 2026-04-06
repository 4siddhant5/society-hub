import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { FiBell, FiEdit, FiFileText, FiPlus, FiTrash2 } from 'react-icons/fi';
import AppButton from '../../components/ui/AppButton';
import AppCard from '../../components/ui/AppCard';
import EmptyState from '../../components/ui/EmptyState';
import SectionHeader from '../../components/ui/SectionHeader';
import AnnouncementDetailModal from './components/AnnouncementDetailModal';

const AdminAnnouncementsScreen = ({ announcements, handleEditClick, handleDeleteAnnouncement, openPDF, onNavigate }) => {
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const columns = width >= 768 ? 2 : 1;
  const surfaceColor = isDark ? '#111827' : '#ffffff';
  const pageColor = isDark ? '#0f172a' : '#f8fafc';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const descColor = isDark ? '#cbd5e1' : '#475569';
  const dividerColor = isDark ? '#1f2937' : '#e2e8f0';
  const mutedColor = isDark ? '#94a3b8' : '#94a3b8';
  const badgeBackground = isDark ? '#1d4ed8' : '#dbeafe';
  const badgeText = isDark ? '#dbeafe' : '#1d4ed8';
  const pdfBackground = isDark ? '#0b3b2e' : '#eff6ff';
  const pdfText = isDark ? '#93c5fd' : '#2563eb';

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

  const renderAnnouncementCard = ({ item }) => {
    const isGlobal = !!item.isGlobal;

    return (
      <View style={[styles.cardWrap, columns > 1 && styles.cardWrapHalf]}>
        <AppCard
          style={[
            styles.card,
            {
              backgroundColor: surfaceColor,
              borderColor: dividerColor,
            },
          ]}
          interactive={Platform.OS === 'web'}
          onPress={() => setSelectedAnnouncement(item)}
        >
          <View style={styles.cardHeader}>
            <View style={styles.titleGroup}>
              <Text style={[styles.title, { color: textColor }]} numberOfLines={2}>
                {item.title}
              </Text>
              {isGlobal ? (
                <View style={[styles.globalBadge, { backgroundColor: badgeBackground }]}>
                  <Text style={[styles.globalBadgeText, { color: badgeText }]}>Global</Text>
                </View>
              ) : null}
            </View>

            {!isGlobal ? (
              <View style={styles.actions}>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={(event) => {
                    event?.stopPropagation?.();
                    handleEditClick(item);
                  }}
                  style={[styles.editButton, { borderColor: dividerColor }]}
                >
                  <FiEdit size={16} color="#2563eb" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={(event) => {
                    event?.stopPropagation?.();
                    handleDeleteAnnouncement(item.id);
                  }}
                  style={[styles.deleteButton, { borderColor: dividerColor }]}
                >
                  <FiTrash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          <Text style={[styles.description, { color: descColor }]} numberOfLines={3}>
            {item.description}
          </Text>

          {!!item.pdfUrl ? (
            <TouchableOpacity
              accessibilityRole="link"
              onPress={(event) => {
                event?.stopPropagation?.();
                openPDF(item.pdfUrl);
              }}
              style={[styles.pdfLink, { backgroundColor: pdfBackground }]}
            >
              <FiFileText size={16} color={pdfText} />
              <Text style={[styles.pdfLinkText, { color: pdfText }]}>View PDF</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.pdfSpacer} />
          )}

          <View style={[styles.footer, { borderTopColor: dividerColor }]}>
            <Text style={[styles.date, { color: mutedColor }]}>{formatDate(item.createdAt)}</Text>
          </View>
        </AppCard>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: pageColor }]}>
      <SectionHeader
        title="Announcements"
        subtitle="Manage and broadcast society notices"
        rightComponent={
          <AppButton
            title="+ Create New"
            onPress={() => onNavigate('CreateAnnouncement')}
            type="primary"
            icon={FiPlus}
            style={styles.createBtn}
          />
        }
      />
      <FlatList
        data={announcements}
        key={columns}
        keyExtractor={(item) => item.id}
        renderItem={renderAnnouncementCard}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? styles.columnWrapper : undefined}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState message="No announcements posted." icon={FiBell} />}
        showsVerticalScrollIndicator={false}
      />
      <AnnouncementDetailModal
        visible={!!selectedAnnouncement}
        announcement={selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
        onEdit={handleEditClick}
        onDelete={handleDeleteAnnouncement}
        openPDF={openPDF}
        formatDate={formatDate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  columnWrapper: {
    gap: 16,
  },
  cardWrap: {
    width: '100%',
  },
  cardWrapHalf: {
    flex: 1,
  },
  card: {
    minHeight: 220,
    marginBottom: 16,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    ...Platform.select({
      web: { boxShadow: '0 8px 18px rgba(15,23,42,0.08)' },
      default: {
        shadowColor: '#0f172a',
        shadowOpacity: 0.08,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 3,
      },
    }),
  },
  createBtn: {
    minWidth: 148,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleGroup: {
    flex: 1,
    gap: 8,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  globalBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  globalBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#eff6ff',
  },
  editButtonText: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '700',
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
  },
  description: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 66,
  },
  pdfLink: {
    marginTop: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  pdfLinkText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pdfSpacer: {
    height: 20,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 14,
    borderTopWidth: 1,
  },
  date: {
    fontSize: 12,
    textAlign: 'right',
    fontWeight: '500',
  },
});

export default AdminAnnouncementsScreen;
