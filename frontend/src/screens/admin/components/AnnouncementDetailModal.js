import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { FiEdit, FiFileText, FiTrash2, FiX } from '../../../utils/iconCompat';
import { useTheme } from '../../../context/ThemeContext';

const CLOSE_DURATION = 180;

const AnnouncementDetailModal = ({
  visible,
  announcement,
  onClose,
  onEdit,
  onDelete,
  openPDF,
  formatDate,
}) => {
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [rendered, setRendered] = useState(visible);
  const [activeAnnouncement, setActiveAnnouncement] = useState(announcement);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(isDesktop ? 0.96 : 1)).current;
  const cardTranslateY = useRef(new Animated.Value(isDesktop ? 12 : 40)).current;

  useEffect(() => {
    if (announcement) {
      setActiveAnnouncement(announcement);
    }
  }, [announcement]);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
      return undefined;
    }

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: CLOSE_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: isDesktop ? 0.96 : 1,
        duration: CLOSE_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: isDesktop ? 12 : 40,
        duration: CLOSE_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setRendered(false);
      setActiveAnnouncement(null);
    });

    return undefined;
  }, [cardScale, cardTranslateY, isDesktop, overlayOpacity, visible]);

  useEffect(() => {
    if (!visible || Platform.OS !== 'web') {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, visible]);

  if (!rendered || !activeAnnouncement) {
    return null;
  }

  const isGlobal = !!activeAnnouncement.isGlobal;
  const cardBackground = isDark ? '#0f172a' : '#ffffff';
  const overlayColor = 'rgba(2, 6, 23, 0.64)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const bodyColor = isDark ? '#dbeafe' : '#334155';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const dividerColor = isDark ? '#1e293b' : '#e2e8f0';
  const badgeBackground = isDark ? '#1d4ed8' : '#dbeafe';
  const badgeText = isDark ? '#dbeafe' : '#1d4ed8';
  const pdfBackground = isDark ? '#11203b' : '#eff6ff';
  const pdfText = '#2563eb';

  return (
    <Modal transparent visible={rendered} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity, backgroundColor: overlayColor }]}>
        <Pressable style={[styles.backdropPressable, isDesktop ? styles.desktopOverlay : styles.mobileOverlay]} onPress={onClose}>
          <Animated.View
            style={[
              styles.modalCard,
              isDesktop ? styles.desktopCard : styles.mobileCard,
              {
                backgroundColor: cardBackground,
                borderColor: dividerColor,
                transform: [{ translateY: cardTranslateY }, { scale: cardScale }],
              },
            ]}
          >
            <Pressable onPress={(event) => event.stopPropagation?.()}>
              <View style={[styles.header, { borderBottomColor: dividerColor }]}>
                <View style={styles.headerText}>
                  <Text style={[styles.title, { color: titleColor }]}>{activeAnnouncement.title}</Text>
                  {isGlobal ? (
                    <View style={[styles.badge, { backgroundColor: badgeBackground }]}>
                      <Text style={[styles.badgeText, { color: badgeText }]}>Global</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.headerActions}>
                  {!isGlobal ? (
                    <>
                      <TouchableOpacity
                        onPress={() => {
                          onClose();
                          onEdit(activeAnnouncement);
                        }}
                        style={[styles.iconButton, styles.editButton, { borderColor: dividerColor }]}
                      >
                        <FiEdit size={16} color="#2563eb" />
                        <Text style={styles.editText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          onClose();
                          onDelete(activeAnnouncement.id);
                        }}
                        style={[styles.iconButton, styles.deleteButton, { borderColor: dividerColor }]}
                      >
                        <FiTrash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </>
                  ) : null}

                  <TouchableOpacity onPress={onClose} style={[styles.iconButton, styles.closeButton, { borderColor: dividerColor }]}>
                    <FiX size={18} color={mutedColor} />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={[styles.description, { color: bodyColor }]}>{activeAnnouncement.description}</Text>

                {!!activeAnnouncement.pdfUrl ? (
                  <TouchableOpacity onPress={() => openPDF(activeAnnouncement.pdfUrl)} style={[styles.pdfLink, { backgroundColor: pdfBackground }]}>
                    <FiFileText size={17} color={pdfText} />
                    <Text style={[styles.pdfLinkText, { color: pdfText }]}>View PDF</Text>
                  </TouchableOpacity>
                ) : null}

                <View style={[styles.footer, { borderTopColor: dividerColor }]}>
                  <Text style={[styles.date, { color: mutedColor }]}>{formatDate(activeAnnouncement.createdAt)}</Text>
                </View>
              </ScrollView>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdropPressable: {
    flex: 1,
  },
  desktopOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  mobileOverlay: {
    justifyContent: 'flex-end',
  },
  modalCard: {
    width: '100%',
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#020617',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  desktopCard: {
    maxWidth: 680,
    maxHeight: '84%',
    borderRadius: 28,
  },
  mobileCard: {
    maxHeight: '88%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerText: {
    flex: 1,
    gap: 10,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '800',
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
  },
  editButton: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#eff6ff',
  },
  editText: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '700',
  },
  deleteButton: {
    width: 40,
    backgroundColor: '#fef2f2',
  },
  closeButton: {
    width: 40,
    backgroundColor: '#f8fafc',
  },
  scrollArea: {
    maxHeight: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  description: {
    fontSize: 15,
    lineHeight: 26,
  },
  pdfLink: {
    marginTop: 20,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
  },
  pdfLinkText: {
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    marginTop: 24,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  date: {
    fontSize: 12,
    textAlign: 'right',
    fontWeight: '600',
  },
});

export default AnnouncementDetailModal;
