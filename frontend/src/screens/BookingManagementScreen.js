import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert
} from "react-native";
import { db } from "../config/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function BookingManagementScreen({ goBack }) {
  const { userData } = useAuth();
  const { isDark } = useTheme();
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!userData?.societyId) return;
    const q = query(collection(db, "bookings"), where("societyId", "==", userData.societyId));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setBookings(list);
    });
    return () => unsub();
  }, [userData?.societyId]);

  const approveBooking = async (id) => {
    try {
      await updateDoc(doc(db, "bookings", id), { status: "approved" });
      Alert.alert("Success", "Approved");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const bg = isDark ? '#0f172a' : '#ffffff';
  const textCol = isDark ? '#fff' : '#000';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Text style={[styles.title, { color: textCol }]}>Manage Bookings</Text>
      <FlatList
        data={bookings}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.card, { borderColor: isDark ? '#334155' : '#ccc' }]}>
            <Text style={[styles.text, { color: textCol, fontWeight: 'bold' }]}>Facility: {item.facility}</Text>
            <Text style={[styles.text, { color: textCol }]}>Date: {item.date}</Text>
            <Text style={[styles.text, { color: textCol }]}>Time: {item.timeSlot}</Text>
            <Text style={[styles.text, { color: textCol, marginBottom: 10 }]}>Status: {item.status}</Text>
            {item.status === 'pending' && (
              <TouchableOpacity style={styles.btn} onPress={() => approveBooking(item.id)}>
                <Text style={styles.btnText}>Approve</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
      {goBack && (
        <TouchableOpacity style={[styles.btn, styles.backBtn]} onPress={goBack}>
          <Text style={styles.btnText}>Back</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { padding: 15, borderWidth: 1, borderRadius: 8, marginBottom: 15 },
  text: { fontSize: 16, marginBottom: 5 },
  btn: { backgroundColor: '#16a34a', padding: 12, borderRadius: 5, alignItems: 'center' },
  backBtn: { backgroundColor: '#64748b', marginTop: 15 },
  btnText: { color: '#fff', fontWeight: 'bold' }
});
