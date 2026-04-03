import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, TextInput } from 'react-native';
import { db } from '../../config/firebase';
import { collection, doc, getDocs, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { pushNotification } from '../../services/notificationHelpers';

const STATUS_STYLES = {
  pending: { bg: '#fef3c7', text: '#92400e', label: 'Pending' },
  approved: { bg: '#dcfce7', text: '#166534', label: 'Approved' },
  rejected: { bg: '#fee2e2', text: '#991b1b', label: 'Rejected' },
};

const sortByCreatedAtDesc = (list) =>
  [...list].sort((a, b) => {
    const aTime = typeof a.createdAt === 'number' ? a.createdAt : 0;
    const bTime = typeof b.createdAt === 'number' ? b.createdAt : 0;
    return bTime - aTime;
  });

export default function AdminBookingScreen({ goBack }) {
  const { userData } = useAuth();
  const { isDark } = useTheme();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
          setBookings(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
        },
        (error) => {
          if (error.code === 'failed-precondition' || error.message?.includes('index')) {
            const fallbackQuery = query(collection(db, 'bookings', userData.societyId, 'entries'));
            unsubscribe = onSnapshot(fallbackQuery, (snapshot) => {
              setBookings(sortByCreatedAtDesc(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))));
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
    () => bookings.filter((booking) => filter === 'all' || booking.status === filter),
    [bookings, filter]
  );

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
      const status = docSnap.data()?.status;
      return status === 'approved' || status === 'pending';
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

      await updateDoc(doc(db, 'bookings', userData.societyId, 'entries', booking.id), {
        status: 'approved',
        rejectionReason: '',
      });

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
      await updateDoc(doc(db, 'bookings', userData.societyId, 'entries', selectedBooking.id), {
        status: 'rejected',
        rejectionReason: rejectReason.trim(),
      });

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

  const bg = isDark ? '#121212' : '#ffffff';
  const textCol = isDark ? '#ffffff' : '#000000';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#e2e8f0';
  const mutedText = isDark ? '#cbd5e1' : '#64748b';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.header}>
        {goBack && (
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backText}>{'< Back'}</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.title, { color: textCol }]}>Manage Bookings</Text>
      </View>

      <View style={styles.filterRow}>
        {['all', 'pending', 'approved', 'rejected'].map((value) => (
          <TouchableOpacity
            key={value}
            style={[styles.filterChip, filter === value && styles.filterChipActive]}
            onPress={() => setFilter(value)}
          >
            <Text style={[styles.filterChipText, filter === value && styles.filterChipTextActive]}>
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const statusStyle = STATUS_STYLES[item.status] || STATUS_STYLES.pending;

          return (
            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.facility, { color: textCol }]}>{item.facility}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
                </View>
              </View>

              <Text style={[styles.text, { color: textCol }]}>User: {item.userName || 'Resident'}</Text>
              <Text style={[styles.text, { color: textCol }]}>Flat Number: {item.flatNumber || 'N/A'}</Text>
              <Text style={[styles.text, { color: mutedText }]}>Date: {item.date}</Text>
              <Text style={[styles.text, { color: mutedText }]}>Time: {item.timeSlot}</Text>

              {!!item.rejectionReason && (
                <Text style={styles.reasonText}>Reason: {item.rejectionReason}</Text>
              )}

              {item.status === 'pending' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: '#16a34a' }]}
                    onPress={() => approveBooking(item)}
                    disabled={submitting}
                  >
                    <Text style={styles.btnText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: '#ef4444' }]}
                    onPress={() => openRejectModal(item)}
                    disabled={submitting}
                  >
                    <Text style={styles.btnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={{ color: textCol, textAlign: 'center', marginTop: 20 }}>No bookings found.</Text>}
      />

      <Modal visible={rejectModalVisible} transparent animationType="slide" onRequestClose={() => setRejectModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textCol }]}>Reject Booking</Text>
            <TextInput
              style={[styles.input, { color: textCol, borderColor, backgroundColor: isDark ? '#333' : '#fff' }]}
              placeholder="Reason for rejection"
              placeholderTextColor={isDark ? '#aaa' : '#888'}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: '#64748b' }]}
                onPress={() => {
                  setRejectModalVisible(false);
                  setSelectedBooking(null);
                  setRejectReason('');
                }}
                disabled={submitting}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: '#ef4444' }]}
                onPress={rejectBooking}
                disabled={submitting}
              >
                <Text style={styles.btnText}>{submitting ? 'Submitting...' : 'Submit Rejection'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { marginRight: 15 },
  backText: { color: '#2563eb', fontSize: 16, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '700' },
  filterRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#e2e8f0' },
  filterChipActive: { backgroundColor: '#2563eb' },
  filterChipText: { fontSize: 13, color: '#475569', fontWeight: '700' },
  filterChipTextActive: { color: '#fff' },
  listContent: { paddingBottom: 24 },
  card: { padding: 16, borderWidth: 1, borderRadius: 12, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  facility: { fontSize: 18, fontWeight: '700' },
  text: { fontSize: 15, marginBottom: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  statusText: { fontWeight: '700', fontSize: 12 },
  reasonText: { fontSize: 14, color: '#ef4444', marginTop: 8, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 15 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContainer: { padding: 20, borderRadius: 12, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 15 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, minHeight: 90, textAlignVertical: 'top', marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 10 },
});
