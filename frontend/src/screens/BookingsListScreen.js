import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { db } from '../config/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function BookingsListScreen({ goBack }) {
  const { userData } = useAuth();
  const { isDark } = useTheme();
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!userData?.societyId) return;
    const q = query(
      collection(db, 'bookings', userData.societyId, 'entries')
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => b.createdAt - a.createdAt);
      setBookings(list);
    });
    return () => unsub();
  }, [userData?.societyId]);

  const bg = isDark ? '#121212' : '#f8fafc';
  const textCol = isDark ? '#ffffff' : '#1e293b';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const borderColor = isDark ? '#333333' : '#e2e8f0';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.header}>
        {goBack && (
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.title, { color: textCol }]}>All Facility Bookings</Text>
      </View>

      <FlatList
        data={bookings}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.facilityText, { color: textCol }]}>{item.facility}</Text>
              <View style={[styles.statusBadge, { backgroundColor: item.status === 'approved' ? '#dcfce7' : item.status === 'rejected' ? '#fee2e2' : '#fef3c7' }]}>
                <Text style={{ fontSize: 12, color: item.status === 'approved' ? '#166534' : item.status === 'rejected' ? '#991b1b' : '#92400e', fontWeight: 'bold' }}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={[styles.text, { color: isDark ? '#aaa' : '#64748b' }]}>Date: {item.date}</Text>
            <Text style={[styles.text, { color: isDark ? '#aaa' : '#64748b' }]}>Time: {item.timeSlot}</Text>
            <Text style={[styles.text, { color: isDark ? '#aaa' : '#64748b', marginTop: 4, fontWeight: '600' }]}>Booked by: {item.userName}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: textCol, textAlign: 'center', marginTop: 20 }}>No bookings yet.</Text>}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backBtn: { marginRight: 15 },
  backText: { color: '#2563eb', fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 20, fontWeight: 'bold' },
  list: { padding: 16 },
  card: { padding: 16, borderWidth: 1, borderRadius: 12, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  facilityText: { fontSize: 18, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  text: { fontSize: 14, marginBottom: 2 },
});
