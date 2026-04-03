import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const groupBookingsByDate = (bookings) => {
  const groups = bookings.reduce((acc, booking) => {
    if (!acc[booking.date]) acc[booking.date] = [];
    acc[booking.date].push(booking);
    return acc;
  }, {});

  return Object.keys(groups)
    .sort((a, b) => a.localeCompare(b))
    .map((date) => ({
      date,
      bookings: groups[date].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot)),
    }));
};

export default function BookingCalendarScreen({ goBack }) {
  const { userData } = useAuth();
  const { isDark } = useTheme();
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!userData?.societyId) return undefined;

    const approvedQuery = query(
      collection(db, 'bookings', userData.societyId, 'entries'),
      where('status', '==', 'approved')
    );

    const unsubscribe = onSnapshot(approvedQuery, (snapshot) => {
      setBookings(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    });

    return () => unsubscribe();
  }, [userData?.societyId]);

  const groupedBookings = useMemo(() => groupBookingsByDate(bookings), [bookings]);

  const bg = isDark ? '#121212' : '#f8fafc';
  const textColor = isDark ? '#ffffff' : '#1e293b';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#e2e8f0';
  const subTextColor = isDark ? '#cbd5e1' : '#64748b';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.header}>
        {goBack && (
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backText}>{'< Back'}</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.title, { color: textColor }]}>Booking Calendar</Text>
      </View>

      <FlatList
        data={groupedBookings}
        keyExtractor={(item) => item.date}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.dayCard, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.dateTitle, { color: textColor }]}>{item.date}</Text>
            {item.bookings.map((booking) => (
              <View key={booking.id} style={styles.slotRow}>
                <View style={styles.slotTimeBox}>
                  <Text style={styles.slotTime}>{booking.timeSlot}</Text>
                </View>
                <View style={styles.slotBody}>
                  <Text style={[styles.slotFacility, { color: textColor }]}>{booking.facility}</Text>
                  <Text style={[styles.slotMeta, { color: subTextColor }]}>
                    {booking.userName || 'Resident'} - Flat {booking.flatNumber || 'N/A'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: subTextColor }]}>No approved bookings in the calendar yet.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { marginRight: 15 },
  backText: { color: '#2563eb', fontSize: 16, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700' },
  list: { padding: 16, paddingBottom: 24 },
  dayCard: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 12 },
  dateTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  slotRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  slotTimeBox: {
    minWidth: 90,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    marginRight: 12,
  },
  slotTime: { color: '#2563eb', fontSize: 13, fontWeight: '700' },
  slotBody: { flex: 1, paddingTop: 2 },
  slotFacility: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  slotMeta: { fontSize: 13, lineHeight: 18 },
  emptyText: { textAlign: 'center', marginTop: 32, fontSize: 14 },
});
