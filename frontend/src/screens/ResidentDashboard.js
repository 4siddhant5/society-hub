import React, { useEffect, useState } from 'react';
import { StyleSheet, Alert, AppState, View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { saveTokenToFirestore, listenToForegroundMessages } from '../services/notificationService';
import { listenToSOS } from '../services/sosListener';

import ResidentLayout from '../layouts/ResidentLayout';

import ResidentHomeScreen from './resident/ResidentHomeScreen';
import MyIssuesScreen from './resident/MyIssuesScreen';
import AnnouncementsScreen from './resident/AnnouncementsScreen';
import PollsScreen from './resident/PollsScreen';

import SOSScreen from './SOSScreen';
import SOSAlertsScreen from './SOSAlertsScreen';
import CreateIssueScreen from './CreateIssueScreen';
import ChatScreen from './ChatScreen';
import ProfileScreen from './ProfileScreen';
import MembersScreen from './MembersScreen';
import GroupInfoScreen from './GroupInfoScreen';
import EditProfileScreen from './EditProfileScreen';
import IssueDetailScreen from './IssueDetailScreen';
import NotificationScreen from './NotificationScreen';
import BookingScreen from './BookingScreen';
import BookingCalendarScreen from './BookingCalendarScreen';

export default function ResidentDashboard() {
  const { user, userData } = useAuth();
  const [polls, setPolls] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [issues, setIssues] = useState([]);
  const [latestBroadcast, setLatestBroadcast] = useState(null);
  const [activeSOS, setActiveSOS] = useState(null);
  const [sosBannerVisible, setSOSBannerVisible] = useState(true);

  const [navStack, setNavStack] = useState([{ screen: 'Home' }]);
  const navigate = (screen, params = {}) => setNavStack((prev) => [...prev, { screen, params }]);
  const goBack = () => setNavStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));

  useEffect(() => {
    if (!userData?.societyId) return undefined;

    const qIssues = query(collection(db, 'issues'), where('societyId', '==', userData.societyId));
    const unsubscribeIssues = onSnapshot(qIssues, (snapshot) => {
      const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setIssues(list);
    });

    const qAnn = query(collection(db, 'announcements'), where('societyId', '==', userData.societyId));
    const unsubscribeAnn = onSnapshot(qAnn, (snapshot) => {
      const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setAnnouncements(list);
    });

    const qPolls = query(collection(db, 'polls'), where('societyId', '==', userData.societyId));
    const unsubscribePolls = onSnapshot(qPolls, (snapshot) => {
      const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setPolls(list);
    });

    const qBroadcasts = query(collection(db, 'broadcasts'), where('societyId', '==', userData.societyId));
    const unsubscribeBroadcasts = onSnapshot(qBroadcasts, (snapshot) => {
      const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      const toMs = (value) => {
        if (!value) return 0;
        if (typeof value?.toMillis === 'function') return value.toMillis();
        if (typeof value?.toDate === 'function') return value.toDate().getTime();
        return Number(value) || 0;
      };

      list.sort((a, b) => toMs(b.timestamp) - toMs(a.timestamp));
      const latest = list[0];
      if (latest && Date.now() - toMs(latest.timestamp) < 24 * 60 * 60 * 1000) {
        setLatestBroadcast(latest);
      } else {
        setLatestBroadcast(null);
      }
    });

    return () => {
      unsubscribeIssues();
      unsubscribeAnn();
      unsubscribePolls();
      unsubscribeBroadcasts();
    };
  }, [userData?.societyId]);

  useEffect(() => {
    if (!userData?.uid) return undefined;

    const userRef = doc(db, 'users', userData.uid);
    updateDoc(userRef, { isOnline: true }).catch(console.error);

    saveTokenToFirestore(userData.uid, userData.societyId);
    const unsubscribeFCM = listenToForegroundMessages(navigate);

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      updateDoc(userRef, { isOnline: nextAppState === 'active', lastSeen: Date.now() }).catch(console.error);
    });

    return () => {
      subscription.remove();
      if (unsubscribeFCM) unsubscribeFCM();
      updateDoc(userRef, { isOnline: false, lastSeen: Date.now() }).catch(console.error);
    };
  }, [userData?.uid, userData?.societyId]);

  useEffect(() => {
    if (!userData?.societyId) return undefined;

    const unsubscribe = listenToSOS(userData.societyId, (alertItem) => {
      setActiveSOS(alertItem);

      if (!alertItem) {
        return;
      }

      const typeLabel = alertItem?.type?.toUpperCase?.() || 'UNKNOWN';
      const flatLabel = alertItem?.flatNumber || alertItem?.flat || '';
      const message = flatLabel ? `${typeLabel} at Flat ${flatLabel}` : `${typeLabel} emergency reported`;

      Alert.alert('\uD83D\uDEA8 EMERGENCY ALERT', message, [
        { text: 'View', onPress: () => navigate('SOSAlerts') },
        { text: 'Dismiss', style: 'cancel' },
      ]);
    });

    return unsubscribe;
  }, [userData?.societyId]);

  useEffect(() => {
    if (!activeSOS?.id) {
      setSOSBannerVisible(true);
      return undefined;
    }

    setSOSBannerVisible(true);
    const interval = setInterval(() => {
      setSOSBannerVisible((prev) => !prev);
    }, 700);

    return () => clearInterval(interval);
  }, [activeSOS?.id]);

  const handleVote = async (poll, selectedOption) => {
    if (poll.isClosed) return Alert.alert('Closed', 'This poll is closed.');
    if (poll.votes && poll.votes[user.uid]) return Alert.alert('Voted', 'Already voted');
    try {
      await updateDoc(doc(db, 'polls', poll.id), { [`votes.${user.uid}`]: selectedOption });
    } catch (error) {
      Alert.alert('Error', 'Failed to vote.');
    }
  };

  const openPDF = (url) => {
    if (url) window.open(url, '_blank');
  };

  const current = navStack[navStack.length - 1];

  const renderContent = () => {
    switch (current.screen) {
      case 'Home':
        return (
          <ResidentHomeScreen
            userData={userData}
            issues={issues}
            announcements={announcements}
            latestBroadcast={latestBroadcast}
            onNavigate={navigate}
          />
        );
      case 'MyIssues':
        return (
          <MyIssuesScreen
            issues={issues.filter(
              (item) => item.createdBy === user.uid || item.userId === user.uid || item.residentId === user.uid || item.reportedBy === user.uid
            )}
            onNavigate={navigate}
          />
        );
      case 'Announcements':
        return <AnnouncementsScreen announcements={announcements} openPDF={openPDF} />;
      case 'Polls':
        return <PollsScreen polls={polls} user={user} handleVote={handleVote} />;
      case 'SOS':
        return <SOSScreen goBack={goBack} />;
      case 'SOSAlerts':
      case 'SOSAlertsScreen':
        return <SOSAlertsScreen goBack={goBack} />;
      case 'CreateIssue':
      case 'CreateIssueScreen':
        return <CreateIssueScreen goBack={goBack} />;
      case 'CommunityChat':
      case 'ChatScreen':
        return <ChatScreen navigation={{ navigate, goBack }} />;
      case 'Profile':
      case 'ProfileScreen':
        return <ProfileScreen navigation={{ navigate, goBack }} userId={current.params?.userId} />;
      case 'Members':
      case 'MembersScreen':
        return <MembersScreen goBack={goBack} onViewProfile={(id) => navigate('Profile', { userId: id })} />;
      case 'GroupInfo':
      case 'GroupInfoScreen':
        return <GroupInfoScreen navigation={{ navigate, goBack }} />;
      case 'IssueDetail':
        return <IssueDetailScreen issue={current.params?.issue} goBack={goBack} />;
      case 'EditProfile':
      case 'EditProfileScreen':
        return <EditProfileScreen navigation={{ navigate, goBack }} userId={current.params?.userId} />;
      case 'NotificationScreen':
        return <NotificationScreen goBack={goBack} />;
      case 'CreateBooking':
      case 'CreateBookingScreen':
        return <BookingScreen goBack={goBack} initialTab="create" />;
      case 'Booking':
      case 'BookingScreen':
        return <BookingScreen goBack={goBack} initialTab={current.params?.initialTab || 'create'} />;
      case 'MyBookings':
        return <BookingScreen goBack={goBack} initialTab="mine" />;
      case 'BookingsList':
      case 'BookingsListScreen':
        return <BookingScreen goBack={goBack} initialTab="public" />;
      case 'BookingCalendar':
      case 'BookingCalendarScreen':
        return <BookingCalendarScreen goBack={goBack} />;
      default:
        return (
          <ResidentHomeScreen
            userData={userData}
            issues={issues}
            announcements={announcements}
            latestBroadcast={latestBroadcast}
            onNavigate={navigate}
          />
        );
    }
  };

  return (
    <ResidentLayout
      activeScreen={current.screen}
      onNavigate={navigate}
      title={current.screen === 'Home' ? `Hello, ${userData?.name || 'Resident'}` : current.screen}
    >
      <View style={styles.screenBody}>
        {activeSOS ? (
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => navigate('SOSAlerts')}
            style={[styles.sosBanner, !sosBannerVisible && styles.sosBannerDimmed]}
          >
            <Text style={styles.sosText}>{'\uD83D\uDEA8'} {activeSOS?.type?.toUpperCase?.() || 'UNKNOWN'} EMERGENCY</Text>
            <Text style={styles.sosSubtext}>Flat {activeSOS?.flatNumber || activeSOS?.flat || 'N/A'} needs immediate support</Text>
          </TouchableOpacity>
        ) : null}
        {renderContent()}
      </View>
    </ResidentLayout>
  );
}

const styles = StyleSheet.create({
  screenBody: {
    flex: 1,
  },
  sosBanner: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sosBannerDimmed: {
    opacity: 0.45,
  },
  sosText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  sosSubtext: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
