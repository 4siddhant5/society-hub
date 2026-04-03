import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { db } from "../config/firebase";
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const toDateValue = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export default function BroadcastHistoryScreen({ goBack }) {
  const { userData } = useAuth();
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.societyId) return undefined;

    let unsubscribe = () => {};
    const orderedQuery = query(
      collection(db, 'broadcasts'),
      where('societyId', '==', userData.societyId),
      orderBy('timestamp', 'desc')
    );

    const applySnapshot = (snapshot) => {
      setBroadcasts(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
      setLoading(false);
    };

    unsubscribe = onSnapshot(orderedQuery, applySnapshot, (error) => {
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        const fallbackQuery = query(
          collection(db, 'broadcasts'),
          where('societyId', '==', userData.societyId)
        );

        unsubscribe = onSnapshot(fallbackQuery, (snapshot) => {
          const list = snapshot.docs
            .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
            .sort((a, b) => (toDateValue(b.timestamp)?.getTime() || 0) - (toDateValue(a.timestamp)?.getTime() || 0));
          setBroadcasts(list);
          setLoading(false);
        });
      } else {
        console.error('BroadcastHistory error:', error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [userData?.societyId]);

  const formatTime = (ts) => {
    const date = toDateValue(ts);
    return date ? date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Time unavailable';
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>BROADCAST</Text>
        </View>
        <Text style={styles.timeText}>{formatTime(item.timestamp)}</Text>
      </View>
      <Text style={styles.title}>{item.title || 'Broadcast update'}</Text>
      <Text style={styles.message}>{item.message || 'No message content available.'}</Text>
      {!!item.senderName && <Text style={styles.sender}>Sent by: {item.senderName}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Text style={styles.backText}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Broadcast History</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={broadcasts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>Broadcasts</Text>
              <Text style={styles.emptyTitle}>No Broadcasts Yet</Text>
              <Text style={styles.emptyText}>Emergency broadcasts sent to residents will appear here.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: { marginRight: 16 },
  backText: { fontSize: 16, color: '#2563eb', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderLeftWidth: 5,
    borderLeftColor: '#dc2626',
    boxShadow: '0px 8px 20px rgba(15, 23, 42, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#dc2626' },
  timeText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  title: { fontSize: 17, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  message: { fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 10 },
  sender: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', paddingTop: 100 },
  emptyIcon: { fontSize: 24, fontWeight: '800', color: '#dc2626', marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#334155', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 22 },
});
