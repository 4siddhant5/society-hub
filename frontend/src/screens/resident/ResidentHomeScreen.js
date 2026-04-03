import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import React_, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppCard from '../../components/ui/AppCard';
import SectionHeader from '../../components/ui/SectionHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import { IoAlertCircle, IoNotifications, IoStatsChart, IoChatbubbleEllipses, IoAddCircle, IoCalendar } from 'react-icons/io5';

const QuickAction = ({ icon: Icon, label, onPress, color, isDark }) => (
  <TouchableOpacity style={[styles.actionCard, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }]} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.iconWrapper, { backgroundColor: color + '15' }]}>
      <Icon size={24} color={color} />
    </View>
    <Text style={[styles.actionLabel, { color: isDark ? '#ffffff' : '#334155' }]}>{label}</Text>
  </TouchableOpacity>
);

const ResidentHomeScreen = ({ 
  userData, 
  issues, 
  announcements,
  latestBroadcast,
  onNavigate 
}) => {
  const { isDark } = useTheme();
  const recentIssues = issues.slice(0, 3);
  const recentAnnouncements = announcements.slice(0, 3);

  const [showBroadcast, setShowBroadcast] = useState(true);

  // On mount: check if user already dismissed a broadcast
  useEffect(() => {
    AsyncStorage.getItem('broadcastDismissedId').then(dismissedId => {
      if (latestBroadcast?.id && dismissedId === latestBroadcast.id) {
        setShowBroadcast(false);
      }
    });
  }, []);

  // When a new broadcast arrives, show it again if it's different
  useEffect(() => {
    if (!latestBroadcast?.id) return;
    AsyncStorage.getItem('broadcastDismissedId').then(dismissedId => {
      if (dismissedId === latestBroadcast.id) {
        setShowBroadcast(false);
      } else {
        setShowBroadcast(true);
      }
    });
  }, [latestBroadcast?.id]);

  const handleDismissBroadcast = async () => {
    setShowBroadcast(false);
    if (latestBroadcast?.id) {
      await AsyncStorage.setItem('broadcastDismissedId', latestBroadcast.id);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f8fafc' }]} contentContainerStyle={styles.content}>
      {!!latestBroadcast && showBroadcast && (
        <View style={styles.broadcastBanner}>
          <Text style={styles.broadcastIcon}>📢</Text>
          <View style={styles.broadcastTextBox}>
            <Text style={styles.broadcastTitle}>{latestBroadcast.title}</Text>
            <Text style={styles.broadcastMsg}>{latestBroadcast.message}</Text>
          </View>
          <TouchableOpacity onPress={handleDismissBroadcast} style={styles.broadcastCloseBtn}>
            <Text style={styles.broadcastCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={[styles.welcomeSection, { backgroundColor: isDark ? '#1e1e1e' : '#fff' }]}>
        <Text style={[styles.welcomeText, { color: isDark ? '#cbd5e1' : '#64748b' }]}>Welcome back,</Text>
        <Text style={[styles.userName, { color: isDark ? '#ffffff' : '#1e293b' }]}>{userData?.name || 'Resident'}</Text>
      </View>

      <SectionHeader title="Quick Actions" />
      <View style={styles.actionGrid}>
        <QuickAction 
          icon={IoAddCircle} 
          label="Report Issue" 
          onPress={() => onNavigate('CreateIssue')} 
          color="#2563eb" 
          isDark={isDark}
        />
        <QuickAction 
          icon={IoNotifications} 
          label="Notice Board" 
          onPress={() => onNavigate('Announcements')} 
          color="#16a34a" 
          isDark={isDark}
        />
        <QuickAction 
          icon={IoStatsChart} 
          label="Polls" 
          onPress={() => onNavigate('Polls')} 
          color="#f59e0b" 
          isDark={isDark}
        />
        <QuickAction 
          icon={IoAlertCircle} 
          label="Emergency" 
          onPress={() => onNavigate('SOS')} 
          color="#dc2626" 
          isDark={isDark}
        />
        <QuickAction 
          icon={IoCalendar} 
          label="Book Facility" 
          onPress={() => onNavigate('Booking', { initialTab: 'create' })} 
          color="#8b5cf6" 
          isDark={isDark}
        />
        <QuickAction 
          icon={IoNotifications} 
          label="View Bookings" 
          onPress={() => onNavigate('Booking', { initialTab: 'public' })} 
          color="#06b6d4" 
          isDark={isDark}
        />
        <QuickAction
          icon={IoStatsChart}
          label="My Bookings"
          onPress={() => onNavigate('MyBookings')}
          color="#f59e0b"
          isDark={isDark}
        />
        <QuickAction
          icon={IoCalendar}
          label="Booking Calendar"
          onPress={() => onNavigate('BookingCalendar')}
          color="#16a34a"
          isDark={isDark}
        />
      </View>

      <SectionHeader 
        title="Recent Issues" 
        rightComponent={
          <TouchableOpacity onPress={() => onNavigate('MyIssues')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        }
      />
      {recentIssues.length === 0 ? (
        <AppCard><Text style={styles.emptyText}>No recent issues reported.</Text></AppCard>
      ) : (
        recentIssues.map(issue => (
          <AppCard key={issue.id} style={styles.issueCard}>
            <View style={styles.issueHeader}>
              <Text style={[styles.issueTitle, { color: isDark ? '#ffffff' : '#1e293b' }]}>{issue.title}</Text>
              <StatusBadge status={issue.status} />
            </View>
            <Text style={[styles.issueDesc, { color: isDark ? '#cbd5e1' : '#64748b' }]} numberOfLines={2}>{issue.description}</Text>
            <Text style={[styles.issueDate, { color: '#94a3b8' }]}>{new Date(issue.createdAt).toLocaleDateString()}</Text>
          </AppCard>
        ))
      )}

      <SectionHeader 
        title="Latest Announcements" 
        rightComponent={
          <TouchableOpacity onPress={() => onNavigate('Announcements')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        }
      />
      {recentAnnouncements.length === 0 ? (
        <AppCard><Text style={styles.emptyText}>No announcements found.</Text></AppCard>
      ) : (
        recentAnnouncements.map(ann => (
          <AppCard key={ann.id} style={[styles.annCard, { backgroundColor: isDark ? '#1e1e1e' : '#fff' }]}>
            <Text style={[styles.annTitle, { color: isDark ? '#ffffff' : '#1e293b' }]}>{ann.title}</Text>
            <Text style={[styles.annDesc, { color: isDark ? '#cbd5e1' : '#64748b' }]} numberOfLines={2}>{ann.description}</Text>
            <View style={styles.annFooter}>
               <Text style={styles.annTag}>Society Board</Text>
               <Text style={[styles.annDate, { color: '#94a3b8' }]}>{new Date(ann.createdAt).toLocaleDateString()}</Text>
            </View>
          </AppCard>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 30 },
  welcomeSection: { padding: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  welcomeText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  userName: { fontSize: 26, fontWeight: '800', color: '#1e293b', marginTop: 4 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, justifyContent: 'space-between' },
  actionCard: { width: '48%', backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  iconWrapper: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  actionLabel: { fontSize: 14, fontWeight: '700', color: '#334155' },
  issueCard: { marginHorizontal: 16, borderRadius: 16 },
  issueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  seeAll: { fontSize: 14, color: '#2563eb', fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 14, padding: 20 },
  issueTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' }, // Fallback, will be overridden inline
  issueDesc: { fontSize: 14, color: '#64748b', lineHeight: 22 }, // Fallback
  annTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' }, // Fallback
  annDesc: { fontSize: 14, color: '#64748b', lineHeight: 22 }, // Fallback

  broadcastBanner: { flexDirection: 'row', backgroundColor: '#fef2f2', borderLeftWidth: 5, borderLeftColor: '#dc2626', margin: 16, marginBottom: 0, padding: 14, borderRadius: 12, alignItems: 'flex-start' },
  broadcastIcon: { fontSize: 22, marginRight: 12, marginTop: 2 },
  broadcastTextBox: { flex: 1 },
  broadcastTitle: { fontSize: 15, fontWeight: '800', color: '#991b1b', marginBottom: 4 },
  broadcastMsg: { fontSize: 13, color: '#7f1d1d', lineHeight: 20 },
  broadcastCloseBtn: { padding: 6, marginLeft: 8, alignSelf: 'flex-start' },
  broadcastCloseText: { fontSize: 18, color: '#991b1b', fontWeight: '700' },
});

export default ResidentHomeScreen;
