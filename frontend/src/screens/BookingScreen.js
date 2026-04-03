import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  FlatList,
  TextInput,
} from 'react-native';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { addDoc, collection, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';

const TABS = [
  { key: 'create', label: 'Book Facility' },
  { key: 'public', label: 'View Bookings' },
  { key: 'mine', label: 'My Bookings' },
];

const FACILITIES = ['Gym', 'Community Hall', 'Swimming Pool'];
const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening', 'Night'];

const STATUS_META = {
  pending: { bg: '#fef3c7', text: '#92400e', label: 'Pending' },
  approved: { bg: '#dcfce7', text: '#166534', label: 'Approved' },
  rejected: { bg: '#fee2e2', text: '#991b1b', label: 'Rejected' },
};

const getFlatNumber = (userData) =>
  userData?.flatNumber ||
  userData?.flatNo ||
  userData?.flat ||
  userData?.apartmentNumber ||
  'N/A';

const normalizeBooking = (docSnap) => ({
  id: docSnap.id,
  ...docSnap.data(),
});

const sortByCreatedAtDesc = (list) =>
  [...list].sort((a, b) => {
    const aTime = typeof a.createdAt === 'number' ? a.createdAt : 0;
    const bTime = typeof b.createdAt === 'number' ? b.createdAt : 0;
    return bTime - aTime;
  });

const BookingCard = ({ item, isDark, showBookedBy, showRejectionReason }) => {
  const status = STATUS_META[item.status] || STATUS_META.pending;
  const textColor = isDark ? '#ffffff' : '#1e293b';
  const subTextColor = isDark ? '#cbd5e1' : '#64748b';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <View style={[styles.listCard, { backgroundColor: cardBg, borderColor }]}>
      <View style={styles.listCardHeader}>
        <Text style={[styles.facilityTitle, { color: textColor }]}>{item.facility}</Text>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusBadgeText, { color: status.text }]}>{status.label}</Text>
        </View>
      </View>

      <Text style={[styles.listMetaText, { color: subTextColor }]}>
        {item.date} - {item.timeSlot}
      </Text>

      {showBookedBy && (
        <Text style={[styles.listMetaText, { color: subTextColor }]}>
          Booked by: {item.userName || 'Resident'} - Flat {item.flatNumber || 'N/A'}
        </Text>
      )}

      {!showBookedBy && (
        <Text style={[styles.listMetaText, { color: subTextColor }]}>
          Flat: {item.flatNumber || 'N/A'}
        </Text>
      )}

      {showRejectionReason && item.status === 'rejected' && !!item.rejectionReason && (
        <Text style={styles.reasonText}>Reason: {item.rejectionReason}</Text>
      )}
    </View>
  );
};

export default function BookingScreen({ goBack, initialTab = 'create' }) {
  const { user, userData } = useAuth();
  const { isDark } = useTheme();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [facility, setFacility] = useState('Gym');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [approvedBookings, setApprovedBookings] = useState([]);
  const [myBookings, setMyBookings] = useState([]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!userData?.societyId) return undefined;

    const approvedQuery = query(
      collection(db, 'bookings', userData.societyId, 'entries'),
      where('status', '==', 'approved')
    );

    const unsubscribeApproved = onSnapshot(approvedQuery, (snapshot) => {
      setApprovedBookings(sortByCreatedAtDesc(snapshot.docs.map(normalizeBooking)));
    });

    let unsubscribeMine = () => {};
    if (user?.uid) {
      const mineQuery = query(
        collection(db, 'bookings', userData.societyId, 'entries'),
        where('userId', '==', user.uid)
      );

      unsubscribeMine = onSnapshot(mineQuery, (snapshot) => {
        setMyBookings(sortByCreatedAtDesc(snapshot.docs.map(normalizeBooking)));
      });
    } else {
      setMyBookings([]);
    }

    return () => {
      unsubscribeApproved();
      unsubscribeMine();
    };
  }, [user?.uid, userData?.societyId]);

  const publicEmptyMessage = useMemo(
    () => (approvedBookings.length === 0 ? 'No approved bookings yet.' : null),
    [approvedBookings.length]
  );

  const myEmptyMessage = useMemo(
    () => (myBookings.length === 0 ? 'No personal bookings yet.' : null),
    [myBookings.length]
  );

  const handleSubmit = async () => {
    if (!facility || !date || !time) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (!user?.uid || !userData?.societyId) {
      Alert.alert('Error', 'User details not found');
      return;
    }

    setLoading(true);
    try {
      const bookingCollection = collection(db, 'bookings', userData.societyId, 'entries');
      const conflictQuery = query(
        bookingCollection,
        where('facility', '==', facility),
        where('date', '==', date),
        where('timeSlot', '==', time)
      );

      const conflictSnapshot = await getDocs(conflictQuery);
      const hasConflict = conflictSnapshot.docs.some((docSnap) => {
        const status = docSnap.data()?.status;
        return status === 'approved' || status === 'pending';
      });

      if (hasConflict) {
        Alert.alert('Booking Unavailable', 'Slot already booked or pending approval');
        return;
      }

      const payload = {
        id: '',
        userId: user.uid,
        userName: userData?.name || userData?.fullName || 'Resident',
        flatNumber: getFlatNumber(userData),
        facility,
        date,
        timeSlot: time,
        status: 'pending',
        rejectionReason: '',
        createdAt: Date.now(),
        timestamp: serverTimestamp(),
      };

      const bookingRef = await addDoc(bookingCollection, payload);
      await updateDoc(bookingRef, { id: bookingRef.id });

      Alert.alert('Success', 'Booking request submitted for approval');
      setDate('');
      setTime('');
      setFacility('Gym');
      setActiveTab('mine');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const bg = isDark ? '#121212' : '#f8fafc';
  const textColor = isDark ? '#ffffff' : '#1e293b';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#e2e8f0';
  const subTextColor = isDark ? '#cbd5e1' : '#64748b';

  const renderCreateTab = () => (
    <View style={[styles.formCard, { backgroundColor: cardBg, borderColor }]}>
      <Text style={[styles.label, { color: textColor }]}>Facility</Text>
      <View style={styles.buttonGroup}>
        {FACILITIES.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.optionBtn,
              { borderColor },
              facility === item && styles.optionSelected,
            ]}
            onPress={() => setFacility(item)}
          >
            <Text
              style={{
                color: facility === item ? '#fff' : textColor,
                fontWeight: facility === item ? '700' : '500',
              }}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: textColor }]}>Date (YYYY-MM-DD)</Text>
      {Platform.OS === 'web' ? (
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            padding: 12,
            borderRadius: 8,
            border: `1px solid ${borderColor}`,
            backgroundColor: isDark ? '#333' : '#fff',
            color: textColor,
            marginBottom: 20,
            width: '100%',
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <TextInput
          style={[styles.textInput, { color: textColor, borderColor, backgroundColor: isDark ? '#333' : '#fff' }]}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#94a3b8"
        />
      )}

      <Text style={[styles.label, { color: textColor }]}>Time Slot</Text>
      <View style={styles.buttonGroup}>
        {TIME_SLOTS.map((slot) => (
          <TouchableOpacity
            key={slot}
            style={[
              styles.optionBtn,
              { borderColor },
              time === slot && styles.optionSelected,
            ]}
            onPress={() => setTime(slot)}
          >
            <Text
              style={{
                color: time === slot ? '#fff' : textColor,
                fontWeight: time === slot ? '700' : '500',
              }}
            >
              {slot}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.helperText, { color: subTextColor }]}>
        Requests are saved as pending until an admin approves them.
      </Text>

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.submitText}>{loading ? 'Submitting...' : 'Submit Booking'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderList = (data, emptyMessage, options = {}) => (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <BookingCard
          item={item}
          isDark={isDark}
          showBookedBy={!!options.showBookedBy}
          showRejectionReason={!!options.showRejectionReason}
        />
      )}
      ListEmptyComponent={<Text style={[styles.emptyText, { color: subTextColor }]}>{emptyMessage}</Text>}
    />
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {goBack && (
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backText}>{'< Back'}</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.headerTitle, { color: textColor }]}>Bookings</Text>
      </View>

      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabChip, activeTab === tab.key && styles.tabChipActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabChipText, activeTab === tab.key && styles.tabChipTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'create' && renderCreateTab()}
      {activeTab === 'public' && renderList(approvedBookings, publicEmptyMessage, { showBookedBy: true })}
      {activeTab === 'mine' && renderList(myBookings, myEmptyMessage, { showRejectionReason: true })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 24 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { marginRight: 15 },
  backText: { color: '#2563eb', fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  tabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingTop: 16 },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
  },
  tabChipActive: { backgroundColor: '#2563eb' },
  tabChipText: { fontSize: 13, color: '#475569', fontWeight: '700' },
  tabChipTextActive: { color: '#fff' },
  formCard: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 10, marginTop: 10 },
  buttonGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15 },
  optionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  optionSelected: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  textInput: { padding: 12, borderWidth: 1, borderRadius: 8, marginBottom: 20, fontSize: 15 },
  helperText: { fontSize: 13, marginTop: 4 },
  submitBtn: {
    backgroundColor: '#16a34a',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitText: { color: 'white', fontWeight: '700', fontSize: 16 },
  listCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  listCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  facilityTitle: { fontSize: 17, fontWeight: '700' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
  listMetaText: { fontSize: 14, marginTop: 4 },
  reasonText: { fontSize: 14, color: '#dc2626', marginTop: 10, fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 32, fontSize: 14 },
});
