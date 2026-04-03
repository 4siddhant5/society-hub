import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView
} from "react-native";
import { db } from "../config/firebase";
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function CreateBookingScreen({ goBack }) {
  const { user, userData } = useAuth();
  const { isDark } = useTheme();
  const [facility, setFacility] = useState('hall'); 
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const submitBooking = async () => {
    try {
      if (!date || !time || !facility) {
        Alert.alert("Error", "Please fill facility, date and time");
        return;
      }
      await addDoc(collection(db, "bookings"), {
        userId: user.uid,
        facility,
        date,
        timeSlot: time,
        status: "pending",
        societyId: userData.societyId,
        userName: userData.name || "Unknown"
      });
      Alert.alert("Success", "Booking created");
      if (goBack) goBack();
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const bg = isDark ? '#0f172a' : '#ffffff';
  const textCol = isDark ? '#fff' : '#000';

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]}>
      <Text style={[styles.title, { color: textCol }]}>Book Facility</Text>
      
      <Text style={[styles.label, { color: textCol }]}>Facility (hall | gym | clubhouse):</Text>
      <TextInput 
        style={[styles.input, { color: textCol, borderColor: isDark ? '#334155' : '#ccc' }]} 
        value={facility} 
        onChangeText={setFacility} 
        placeholderTextColor="#888" 
      />
      
      <Text style={[styles.label, { color: textCol }]}>Date (YYYY-MM-DD):</Text>
      <TextInput 
        style={[styles.input, { color: textCol, borderColor: isDark ? '#334155' : '#ccc' }]} 
        value={date} 
        onChangeText={setDate} 
        placeholder="YYYY-MM-DD" 
        placeholderTextColor="#888" 
      />
      
      <Text style={[styles.label, { color: textCol }]}>Time:</Text>
      <TextInput 
        style={[styles.input, { color: textCol, borderColor: isDark ? '#334155' : '#ccc' }]} 
        value={time} 
        onChangeText={setTime} 
        placeholder="10:00 AM - 12:00 PM" 
        placeholderTextColor="#888" 
      />

      <TouchableOpacity style={styles.btn} onPress={submitBooking}>
        <Text style={styles.btnText}>Submit Booking</Text>
      </TouchableOpacity>
      
      {goBack && (
        <TouchableOpacity style={[styles.btn, styles.backBtn]} onPress={goBack}>
          <Text style={styles.btnText}>Back</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 16, marginTop: 10, marginBottom: 5, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
  btn: { backgroundColor: '#2563eb', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  backBtn: { backgroundColor: '#64748b', marginTop: 15 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
