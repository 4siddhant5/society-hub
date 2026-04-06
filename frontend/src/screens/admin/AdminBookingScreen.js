import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { db } from '../../config/firebase';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { pushNotification } from '../../services/notificationHelpers';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    gradient: ['#f59e0b', '#d97706'],
    solidBg: '#fef3c7',
    solidText: '#92400e',
    dot: '#f59e0b',
  },
  approved: {
    label: 'Approved',
    gradient: ['#22c55e', '#16a34a'],
    solidBg: '#dcfce7',
    solidText: '#166534',
    dot: '#22c55e',
  },
  rejected: {
    label: 'Rejected',
    gradient: ['#ef4444', '#dc2626'],
    solidBg: '#fee2e2',
    solidText: '#991b1b',
    dot: '#ef4444',
  },
};

const FILTERS = ['all', 'pending', 'approved', 'rejected'];

const sortByCreatedAtDesc = (list) =>
  [...list].sort((a, b) => {
    const aTime = typeof a.createdAt === 'number' ? a.createdAt : 0;
    const bTime = typeof b.createdAt === 'number' ? b.createdAt : 0;
    return bTime - aTime;
  });

// ─── BookingCard ──────────────────────────────────────────────────────────────

function BookingCard({ item, isDark, onApprove, onReject, submitting }) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
  const cardBg = isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.97)';
  const textCol = isDark ? '#f1f5f9' : '#1e293b';
  const mutedCol = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? 'rgba(71,85,105,0.4)' : 'rgba(226,232,240,0.8)';
  const metaBg = isDark ? 'rgba(15,23,42,0.4)' : 'rgba(241,245,249,0.7)';
  const reasonBg = isDark ? 'rgba(120,53,15,0.2)' : '#fff7ed';

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}
      >
        {/* ── Card Header ── */}
        <View style={styles.cardHeader}>
          <View style={styles.facilityRow}>
            <View style={[styles.facilityDot, { backgroundColor: cfg.dot }]} />
            <Text style={[styles.facilityText, { color: textCol }]} numberOfLines={1}>
              {item.facility}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.solidBg }]}>
            <Text style={[styles.statusText, { color: cfg.solidText }]}>{cfg.label}</Text>
          </View>
        </View>

        {/* ── Resident Info ── */}
        <Text style={[styles.residentName, { color: textCol }]}>
          {item.userName || 'Resident'}
        </Text>

        {/* ── Meta Grid ── */}
        <View style={[styles.metaGrid, { backgroundColor: metaBg }]}>
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: mutedCol }]}>📅  Date</Text>
            <Text style={[styles.metaValue, { color: textCol }]}>{item.date || '—'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: mutedCol }]}>⏰  Time</Text>
            <Text style={[styles.metaValue, { color: textCol }]}>{item.timeSlot || '—'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: mutedCol }]}>🏠  Flat</Text>
            <Text style={[styles.metaValue, { color: textCol }]}>{item.flatNumber || 'N/A'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: mutedCol }]}>📋  Status</Text>
            <Text style={[styles.metaValue, { color: cfg.solidText }]}>{cfg.label}</Text>
          </View>
        </View>

        {/* ── Rejection Reason ── */}
        {!!item.rejectionReason && (
          <View style={[styles.reasonBox, { backgroundColor: reasonBg }]}>
            <Text style={styles.reasonLabel}>⚠️  Rejection Reason</Text>
            <Text style={styles.reasonText}>{item.rejectionReason}</Text>
          </View>
        )}

        {/* ── Action Buttons ── */}
        {item.status === 'pending' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => onApprove(item)}
              disabled={submitting}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnText}>✓  Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => onReject(item)}
              disabled={submitting}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnText}>✕  Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AdminBookingScreen({ goBack }) {
  const { userData } = useAuth();
  const { isDark } = useTheme();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const bg = isDark ? '#0f172a' : '#f8fafc';
  const surfaceBg = isDark ? '#1e293b' : '#ffffff';
  const textCol = isDark ? '#f1f5f9' : '#1e293b';
  const mutedCol = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? 'rgba(71,85,105,0.5)' : '#e2e8f0';
  const modalBg = isDark ? '#1e293b' : '#ffffff';
  const inputBg = isDark ? '#0f172a' : '#f8fafc';

  // ── Firestore listener (unchanged) ───────────────────────────────────────
  useEffect(() => {
    if (!userData?.societyId) return undefined;

    let unsubscribe = () => {};

    try {
      const bookingQuery = query(
        collection(db, 'bookings', userData.societyId, 'entries'),
        orderBy('createdAt', 'desc')
      );

      unsubscribe = onSnapshot(
        bookingQuery,
        (snapshot) => {
          setBookings(
            snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
          );
        },
        (error) => {
          if (
            error.code === 'failed-precondition' ||
            error.message?.includes('index')
          ) {
            const fallbackQuery = query(
              collection(db, 'bookings', userData.societyId, 'entries')
            );
            unsubscribe = onSnapshot(fallbackQuery, (snapshot) => {
              setBookings(
                sortByCreatedAtDesc(
                  snapshot.docs.map((docSnap) => ({
                    id: docSnap.id,
                    ...docSnap.data(),
                  }))
                )
              );
            });
          } else {
            console.error('AdminBookingScreen listener error:', error);
          }
        }
      );
    } catch (error) {
      console.error('AdminBookingScreen setup error:', error);
    }

    return () => unsubscribe();
  }, [userData?.societyId]);

  const filteredBookings = useMemo(
    () => bookings.filter((b) => filter === 'all' || b.status === filter),
    [bookings, filter]
  );

  // ── Helpers (unchanged logic) ─────────────────────────────────────────────
  const sendBookingUpdateNotification = async (booking, status) => {
    await pushNotification({
      societyId: userData.societyId,
      type: 'BOOKING_UPDATE',
      title: 'Booking Update',
      message: `Your booking for ${booking.facility} is ${status}`,
      targetRole: 'resident',
      userId: booking.userId,
    });
  };

  const hasApprovalConflict = async (booking) => {
    const conflictQuery = query(
      collection(db, 'bookings', userData.societyId, 'entries'),
      where('facility', '==', booking.facility),
      where('date', '==', booking.date),
      where('timeSlot', '==', booking.timeSlot)
    );
    const snapshot = await getDocs(conflictQuery);
    return snapshot.docs.some((docSnap) => {
      if (docSnap.id === booking.id) return false;
      const s = docSnap.data()?.status;
      return s === 'approved' || s === 'pending';
    });
  };

  const approveBooking = async (booking) => {
    if (!userData?.societyId || submitting) return;
    setSubmitting(true);
    try {
      const conflictExists = await hasApprovalConflict(booking);
      if (conflictExists) {
        Alert.alert('Conflict Found', 'Slot already booked or pending approval');
        return;
      }
      await updateDoc(
        doc(db, 'bookings', userData.societyId, 'entries', booking.id),
        { status: 'approved', rejectionReason: '' }
      );
      await sendBookingUpdateNotification(booking, 'approved');
      Alert.alert('Success', 'Booking approved');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to approve booking');
    } finally {
      setSubmitting(false);
    }
  };

  const openRejectModal = (booking) => {
    setSelectedBooking(booking);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const rejectBooking = async () => {
    if (!userData?.societyId || !selectedBooking || submitting) return;
    if (!rejectReason.trim()) {
      Alert.alert('Validation Error', 'Please provide a rejection reason');
      return;
    }
    setSubmitting(true);
    try {
      await updateDoc(
        doc(db, 'bookings', userData.societyId, 'entries', selectedBooking.id),
        { status: 'rejected', rejectionReason: rejectReason.trim() }
      );
      await sendBookingUpdateNotification(selectedBooking, 'rejected');
      setRejectModalVisible(false);
      setSelectedBooking(null);
      setRejectReason('');
      Alert.alert('Success', 'Booking rejected');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to reject booking');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Count badges ──────────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const c = { all: bookings.length, pending: 0, approved: 0, rejected: 0 };
    bookings.forEach((b) => {
      if (c[b.status] !== undefined) c[b.status]++;
    });
    return c;
  }, [bookings]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.pageContainer, { backgroundColor: bg }]}>

      {/* ── Fixed Header ── */}
      <View style={[styles.pageHeader, { backgroundColor: bg, borderBottomColor: borderCol }]}>
        <View style={styles.headerTop}>
          {goBack && (
            <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
              <Text style={styles.backArrow}>‹</Text>
              <Text style={styles.backLabel}>Back</Text>
            </TouchableOpacity>
          )}
          <View style={styles.titleBlock}>
            <Text style={[styles.pageTitle, { color: textCol }]}>Manage Bookings</Text>
            <Text style={[styles.pageSubtitle, { color: mutedCol }]}>
              {counts.all} total · {counts.pending} pending
            </Text>
          </View>
        </View>

        {/* ── Filter Pills ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERS.map((value) => {
            const isActive = filter === value;
            return (
              <TouchableOpacity
                key={value}
                style={[
                  styles.filterPill,
                  { backgroundColor: isDark ? 'rgba(30,41,59,0.8)' : '#f1f5f9' },
                  isActive && styles.filterPillActive,
                ]}
                onPress={() => setFilter(value)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: isDark ? '#94a3b8' : '#475569' },
                    isActive && styles.filterPillTextActive,
                  ]}
                >
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </Text>
                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor: isActive
                        ? 'rgba(255,255,255,0.25)'
                        : isDark
                        ? 'rgba(71,85,105,0.5)'
                        : '#e2e8f0',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      { color: isActive ? '#fff' : mutedCol },
                    ]}
                  >
                    {counts[value] ?? 0}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Scrollable Content ── */}
      <FlatList
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.listContent,
          filteredBookings.length === 0 && styles.emptyContainer,
        ]}
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <BookingCard
            item={item}
            isDark={isDark}
            onApprove={approveBooking}
            onReject={openRejectModal}
            submitting={submitting}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={[styles.emptyTitle, { color: textCol }]}>No bookings found</Text>
            <Text style={[styles.emptySubtitle, { color: mutedCol }]}>
              {filter === 'all'
                ? 'No bookings have been submitted yet.'
                : `No ${filter} bookings at the moment.`}
            </Text>
          </View>
        }
      />

      {/* ── Reject Modal ── */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: modalBg, borderColor: borderCol }]}>
            {/* Modal handle */}
            <View style={styles.modalHandle} />

            <Text style={[styles.modalTitle, { color: textCol }]}>Reject Booking</Text>
            {selectedBooking && (
              <View style={[styles.modalMeta, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: borderCol }]}>
                <Text style={[styles.modalMetaText, { color: mutedCol }]}>
                  🏢  {selectedBooking.facility}
                </Text>
                <Text style={[styles.modalMetaText, { color: mutedCol }]}>
                  👤  {selectedBooking.userName || 'Resident'}
                </Text>
              </View>
            )}

            <Text style={[styles.inputLabel, { color: mutedCol }]}>Reason for rejection</Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: textCol,
                  borderColor: borderCol,
                  backgroundColor: inputBg,
                },
              ]}
              placeholder="Provide a clear reason for the resident..."
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn, { borderColor: borderCol }]}
                onPress={() => {
                  setRejectModalVisible(false);
                  setSelectedBooking(null);
                  setRejectReason('');
                }}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <Text style={[styles.cancelBtnText, { color: textCol }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.submitRejectBtn]}
                onPress={rejectBooking}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <Text style={styles.submitRejectBtnText}>
                  {submitting ? 'Submitting...' : 'Reject Booking'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Layout
  pageContainer: {
    flex: 1,
    overflow: 'hidden',
  },

  // Header
  pageHeader: {
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
    gap: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingRight: 12,
    gap: 2,
  },
  backArrow: {
    fontSize: 28,
    color: '#2563eb',
    lineHeight: 30,
    fontWeight: '300',
  },
  backLabel: {
    fontSize: 15,
    color: '#2563eb',
    fontWeight: '600',
  },
  titleBlock: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  pageSubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },

  // Filter pills
  filterScroll: {
    paddingHorizontal: 20,
    paddingBottom: 4,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    gap: 6,
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: '#2563eb',
    ...Platform.select({
      web: { boxShadow: '0 4px 10px rgba(37,99,235,0.35)' },
      default: {
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 6,
      },
    }),
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Scroll
  scrollArea: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  // Card
  card: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    ...Platform.select({
      web: { boxShadow: '0 6px 18px rgba(0,0,0,0.07)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.07,
        shadowRadius: 18,
        elevation: 4,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  facilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 10,
  },
  facilityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  facilityText: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  residentName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    opacity: 0.8,
  },

  // Meta grid
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 4,
  },
  metaItem: {
    width: '45%',
    flexGrow: 1,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Reason box
  reasonBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d97706',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  reasonText: {
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      web: {},
      default: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  approveBtn: {
    backgroundColor: '#16a34a',
    ...Platform.select({
      web: { boxShadow: '0 4px 8px rgba(22,163,74,0.30)' },
      default: { shadowColor: '#16a34a' },
    }),
  },
  rejectBtn: {
    backgroundColor: '#ef4444',
    ...Platform.select({
      web: { boxShadow: '0 4px 8px rgba(239,68,68,0.30)' },
      default: { shadowColor: '#ef4444' },
    }),
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 52,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingTop: 16,
    borderWidth: 1,
    borderBottomWidth: 0,
    ...Platform.select({
      web: { boxShadow: '0 -4px 20px rgba(0,0,0,0.15)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 20,
      },
    }),
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  modalMeta: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    gap: 6,
  },
  modalMetaText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    minHeight: 100,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: Platform.OS === 'ios' ? 16 : 0,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelBtn: {
    borderWidth: 1.5,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  submitRejectBtn: {
    backgroundColor: '#ef4444',
    ...Platform.select({
      web: { boxShadow: '0 4px 10px rgba(239,68,68,0.30)' },
      default: {
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
      },
    }),
  },
  submitRejectBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
