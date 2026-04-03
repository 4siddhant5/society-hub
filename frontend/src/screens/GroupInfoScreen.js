import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Platform
} from "react-native";
import { db } from "../config/firebase";
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function GroupInfoScreen({ navigation }) {
  const { userData } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [societyName, setSocietyName] = useState('My Society');

  useEffect(() => {
    if (!userData?.societyId) return;

    const fetchGroupData = async () => {
      try {
        // Fetch society name if societies collection exists
        const socDocRef = doc(db, 'societies', userData.societyId);
        const socSnap = await getDoc(socDocRef);
        if (socSnap.exists() && socSnap.data().name) {
           setSocietyName(socSnap.data().name);
        }

        // Fetch users approved in this society
        const q = query(
          collection(db, "users"),
          where("societyId", "==", userData.societyId),
          where("status", "==", "approved")
        );
        const querySnapshot = await getDocs(q);
        const list = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Sort: admins first, then alphabetical
        list.sort((a, b) => {
           if (a.role === 'admin' && b.role !== 'admin') return -1;
           if (a.role !== 'admin' && b.role === 'admin') return 1;
           return (a.name || '').localeCompare(b.name || '');
        });
        
        setMembers(list);
      } catch (error) {
        console.error("Error fetching group data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [userData?.societyId]);

  const renderMember = ({ item }) => (
    <TouchableOpacity 
       style={styles.memberRow} 
       onPress={() => navigation.navigate('ProfileScreen', { userId: item.id })}
    >
      <View style={styles.avatarContainer}>
          {item.profileImageUrl ? (
            <Image source={{ uri: item.profileImageUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.fallbackAvatar}>
              <Text style={styles.fallbackAvatarText}>
                {item.name ? item.name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          )}
      </View>
      <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.name}</Text>
          <Text style={styles.memberStatus}>
            {item.flat ? `Flat ${item.flat}` : 'No Flat'} {item.wing ? `| Wing ${item.wing}` : ''}
          </Text>
      </View>
      {item.role === 'admin' && (
        <View style={styles.adminBadge}>
           <Text style={styles.adminBadgeText}>Group Admin</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Info</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.groupHeaderArea}>
         <View style={styles.groupIconPlaceholder}>
            <Text style={styles.groupIconText}>👥</Text>
         </View>
         <Text style={styles.groupName}>{societyName}</Text>
         <Text style={styles.memberCount}>Group • {members.length} participants</Text>
      </View>

      <View style={styles.participantsSection}>
         <Text style={styles.sectionHeader}>{members.length} participants</Text>
         {loading ? (
            <ActivityIndicator size="large" color="#075E54" style={{ marginVertical: 20 }} />
         ) : (
            <FlatList
              data={members}
              keyExtractor={(item) => item.id}
              renderItem={renderMember}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
         )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#075E54', paddingTop: Platform.OS === 'android' ? 40 : 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  backBtn: { padding: 5, width: 60 },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  groupHeaderArea: { backgroundColor: '#fff', alignItems: 'center', paddingVertical: 30, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  groupIconPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#128C7E', justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 2 },
  groupIconText: { fontSize: 60, color: '#fff' },
  groupName: { fontSize: 24, fontWeight: 'bold', color: '#000', marginBottom: 5 },
  memberCount: { fontSize: 16, color: '#666' },
  participantsSection: { flex: 1, backgroundColor: '#fff', marginTop: 15, borderTopWidth: 1, borderTopColor: '#ddd' },
  sectionHeader: { fontSize: 14, fontWeight: 'bold', color: '#128C7E', paddingHorizontal: 15, paddingVertical: 15 },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f2f5' },
  avatarContainer: { marginRight: 15 },
  avatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#eee' },
  fallbackAvatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#128C7E', justifyContent: 'center', alignItems: 'center' },
  fallbackAvatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 3 },
  memberStatus: { fontSize: 14, color: '#666' },
  adminBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#C8E6C9' },
  adminBadgeText: { fontSize: 12, color: '#2E7D32', fontWeight: 'bold' }
});
