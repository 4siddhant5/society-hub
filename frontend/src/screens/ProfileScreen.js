import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Image
} from "react-native";
import { db } from "../config/firebase";
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function ProfileScreen({ navigation, userId }) {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // If userId is undefined, maybe it's the current user?
  const targetId = userId || user.uid;
  const isMe = targetId === user.uid;

  useEffect(() => {
    if (!targetId) return;
    
    const fetchUser = async () => {
      try {
        const docRef = doc(db, "users", targetId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        } else {
          console.log("No such user document!");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    
    // To properly support "Seamless navigation", we add listener if needed, 
    // but just fetching once on mount is fine unless they edit profile.
    // Assuming edit updates firestore and we return here, we can re-fetch or rely on cache.
    // For robust immediate updates after edit, onSnapshot can be used.
  }, [targetId]);

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: isDark ? '#121212' : '#f0f2f5'}]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Info</Text>
        {isMe ? (
          <TouchableOpacity onPress={() => navigation.navigate('EditProfileScreen', { userId: targetId })}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} /> // Placeholder for balance
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={isDark ? '#fff' : '#075E54'} />
        </View>
      ) : userProfile ? (
        <View style={styles.content}>
          <View style={[styles.avatarSection, { backgroundColor: isDark ? '#1e1e1e' : '#fff', borderBottomColor: isDark ? '#333' : '#ddd' }]}>
             {userProfile.profileImageUrl ? (
               <Image source={{ uri: userProfile.profileImageUrl }} style={styles.profileImage} />
             ) : (
               <View style={styles.placeholderImage}>
                 <Text style={styles.placeholderText}>
                   {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : '?'}
                 </Text>
               </View>
             )}
             <Text style={[styles.nameText, { color: isDark ? '#fff' : '#000' }]}>
               {userProfile.name || 'Unknown'} {userProfile.role === 'admin' ? '👑' : ''}
             </Text>
             <Text style={[styles.phoneText, { color: isDark ? '#aaa' : '#666' }]}>{userProfile.email || 'N/A'}</Text>
          </View>
          
          <View style={[styles.card, { backgroundColor: isDark ? '#1e1e1e' : '#fff', borderColor: isDark ? '#333' : '#ddd' }]}>
            <Text style={styles.cardHeader}>About</Text>
            
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: isDark ? '#ddd' : '#333' }]}>Role</Text>
              <Text style={[styles.value, { color: isDark ? '#fff' : '#000' }]}>{userProfile.role ? userProfile.role.toUpperCase() : 'N/A'}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#eee' }]} />

            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: isDark ? '#ddd' : '#333' }]}>Flat Number</Text>
              <Text style={[styles.value, { color: isDark ? '#fff' : '#000' }]}>{userProfile.flat || 'N/A'}</Text>
            </View>

            {!!userProfile.wing && (
              <>
                <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#eee' }]} />
                <View style={styles.infoRow}>
                  <Text style={[styles.label, { color: isDark ? '#ddd' : '#333' }]}>Wing</Text>
                  <Text style={[styles.value, { color: isDark ? '#fff' : '#000' }]}>{userProfile.wing}</Text>
                </View>
              </>
            )}
            
          </View>

          {!isMe && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isDark ? '#1e1e1e' : '#fff', borderColor: isDark ? '#333' : '#ddd' }]}>
               <Text style={styles.actionBtnText}>Message {userProfile.name}</Text>
            </TouchableOpacity>
          )}

          {isMe && (
            <TouchableOpacity style={styles.themeBtn} onPress={toggleTheme}>
               <Text style={styles.themeBtnText}>Toggle Dark Mode: {isDark ? 'ON' : 'OFF'}</Text>
            </TouchableOpacity>
          )}

        </View>
      ) : (
        <View style={styles.center}>
          <Text style={styles.errorText}>User profile not found.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#075E54', paddingTop: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  backBtn: { padding: 5, width: 60 },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  editBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', width: 60, textAlign: 'right' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  avatarSection: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  profileImage: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#eee', marginBottom: 15 },
  placeholderImage: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#128C7E', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  placeholderText: { fontSize: 60, color: '#fff', fontWeight: 'bold' },
  nameText: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  phoneText: { fontSize: 16 },
  card: { marginTop: 15, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#ddd' },
  cardHeader: { fontSize: 14, fontWeight: 'bold', color: '#128C7E', paddingHorizontal: 20, paddingVertical: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 20 },
  label: { fontSize: 16 },
  value: { fontSize: 16, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#eee', marginHorizontal: 20 },
  errorText: { fontSize: 18, color: '#d32f2f' },
  actionBtn: { marginTop: 15, paddingVertical: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  actionBtnText: { fontSize: 16, color: '#d32f2f', fontWeight: 'bold' }, // Like the block user button, but here message
  themeBtn: { backgroundColor: '#333', marginTop: 15, paddingVertical: 15, borderRadius: 8, marginHorizontal: 20, alignItems: 'center' },
  themeBtnText: { fontSize: 16, color: '#fff', fontWeight: 'bold' }
});
