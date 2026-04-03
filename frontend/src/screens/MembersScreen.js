import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import { db } from "../config/firebase";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function MembersScreen({ goBack, onViewProfile }) {
  const { userData } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.societyId) return;

    const fetchMembers = async () => {
      try {
        const q = query(
          collection(db, "users"), 
          where("societyId", "==", userData.societyId)
        );
        const querySnapshot = await getDocs(q);
        const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Filter out pending and rejected if needed, but let's just show all approved users
        const approvedList = list.filter(u => u.status === 'approved' || u.role === 'admin');
        setMembers(approvedList);
      } catch (error) {
        console.error("Error fetching members: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [userData]);

  const renderMember = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => onViewProfile(item.id)}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name ? item.name.charAt(0).toUpperCase() : '?'}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.role}>{item.role === 'admin' ? 'Admin' : 'Resident'}</Text>
        <Text style={styles.details}>Flat: {item.flat} {item.wing ? `| Wing: ${item.wing}` : ''}</Text>
      </View>
      <View style={styles.arrowContainer}>
         <Text style={styles.arrow}>{'›'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community Members</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1a73e8" />
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={renderMember}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.empty}>No members found.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#075e54', paddingTop: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  backBtn: { padding: 5 },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 15 },
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1a73e8', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  info: { flex: 1 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  role: { fontSize: 14, color: '#f29900', fontWeight: 'bold', marginVertical: 2 },
  details: { fontSize: 14, color: '#666' },
  arrowContainer: { paddingLeft: 10 },
  arrow: { fontSize: 24, color: '#ccc' },
  empty: { textAlign: 'center', color: '#999', marginTop: 30, fontSize: 16 },
});
