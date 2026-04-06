import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Alert,
  AppState,
  Platform,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { updateIssueStatus, resolveIssue } from '../services/issueService';
import { uploadImage } from '../services/cloudinaryService';
import { deleteAnnouncement } from '../services/announcementService';
import { db } from '../config/firebase';
import {
  collection,
  query,
  where,
  doc,
  updateDoc,
  getDoc,
  onSnapshot,
  orderBy,
  limit,
  addDoc,
} from 'firebase/firestore';
import { saveTokenToFirestore, listenToForegroundMessages } from '../services/notificationService';
import { listenToSOS } from '../services/sosListener';
import { pushNotification } from '../services/notificationHelpers';
import { useTheme } from '../context/ThemeContext';

import AdminLayout from '../layouts/AdminLayout';

import AdminHomeScreen from './admin/AdminHomeScreen';
import AnalyticsScreen from './AnalyticsScreen';
import ResidentApprovalScreen from './admin/ResidentApprovalScreen';
import IssueManagementScreen from './admin/IssueManagementScreen';
import AdminAnnouncementsScreen from './admin/AdminAnnouncementsScreen';
import AdminPollsScreen from './admin/AdminPollsScreen';

import ChatScreen from './ChatScreen';
import ProfileScreen from './ProfileScreen';
import MembersScreen from './MembersScreen';
import GroupInfoScreen from './GroupInfoScreen';
import EditProfileScreen from './EditProfileScreen';
import SOSAlertsScreen from './SOSAlertsScreen';
import BroadcastScreen from './BroadcastScreen';
import CreateAnnouncementScreen from './CreateAnnouncementScreen';
import CreatePollScreen from './CreatePollScreen';
import IssueDetailScreen from './IssueDetailScreen';
import BroadcastHistoryScreen from './BroadcastHistoryScreen';
import NotificationScreen from './NotificationScreen';
import AdminBookingScreen from './admin/AdminBookingScreen';

const SCREEN_TITLES = {
  Dashboard: 'Admin Panel',
  ResidentApproval: 'Residents',
  ResidentsScreen: 'Residents',
  IssueManagement: 'Issue Management',
  Announcements: 'Announcements',
  Polls: 'Poll Center',
  SOSAlerts: 'SOS Alerts',
  SOSAlertsScreen: 'SOS Alerts',
  Broadcast: 'Broadcast',
  BroadcastScreen: 'Broadcast',
  BroadcastHistory: 'Broadcast History',
  BroadcastHistoryScreen: 'Broadcast History',
  Chat: 'Community Chat',
  ChatScreen: 'Community Chat',
  Profile: 'Profile',
  ProfileScreen: 'Profile',
  EditProfile: 'Edit Profile',
  EditProfileScreen: 'Edit Profile',
  Members: 'Members',
  MembersScreen: 'Members',
  CreateAnnouncement: 'Create Announcement',
  CreateAnnouncementScreen: 'Create Announcement',
  EditAnnouncement: 'Update Announcement',
  CreatePoll: 'Create Poll',
  CreatePollScreen: 'Create Poll',
  IssueDetail: 'Issue Detail',
  NotificationScreen: 'Notifications',
  BookingManagement: 'Bookings',
  BookingManagementScreen: 'Bookings',
  AdminBookingScreen: 'Bookings',
  Analytics: 'Analytics',
};

export default function AdminDashboard() {
  const { userData } = useAuth();
  const { isDark } = useTheme();
  const [pendingResidents, setPendingResidents] = useState([]);
  const [issues, setIssues] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [globalAnnouncements, setGlobalAnnouncements] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [societyCode, setSocietyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingIssueId, setLoadingIssueId] = useState(null);
  const [polls, setPolls] = useState([]);
  const [stats, setStats] = useState({ residents: 0, openIssues: 0, resolvedIssues: 0, activePolls: 0 });
  const [activeSOSFeed, setActiveSOSFeed] = useState([]);
  const [activeSOS, setActiveSOS] = useState(null);
  const [sosBannerVisible, setSOSBannerVisible] = useState(true);
  const [navStack, setNavStack] = useState([{ screen: 'Dashboard' }]);
  const [societyUsers, setSocietyUsers] = useState([]);
  const [adminRequests, setAdminRequests] = useState([]);
  const [adminRequestSubmittingId, setAdminRequestSubmittingId] = useState(null);
  const [adminRequestFeedback, setAdminRequestFeedback] = useState('');
  const [residentsLoading, setResidentsLoading] = useState(true);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const navigate = (screen, params = {}) => setNavStack((prev) => [...prev, { screen, params }]);
  const goBack = () => setNavStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));

  useEffect(() => {
    if (!userData?.societyId) {
      return undefined;
    }

    setDashboardLoading(true);
    getDoc(doc(db, 'societies', userData.societyId)).then((snapshot) => {
      if (snapshot.exists()) {
        setSocietyCode(snapshot.data().societyCode || '');
      }
    });

    const unsubIssues = onSnapshot(
      query(collection(db, 'issues'), where('societyId', '==', userData.societyId)),
      (snapshot) => {
        const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setIssues(list);
        setStats((prev) => ({
          ...prev,
          openIssues: list.filter((item) => item.status !== 'Resolved').length,
          resolvedIssues: list.filter((item) => item.status === 'Resolved').length,
        }));
        setIssuesLoading(false);
        setDashboardLoading(false);
      },
      (error) => {
        console.error(error);
        setIssuesLoading(false);
        setDashboardLoading(false);
      }
    );

    const unsubAnn = onSnapshot(query(collection(db, 'announcements'), where('societyId', '==', userData.societyId)), (snapshot) => {
      const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setAnnouncements(list);
    });

    const unsubGlobalAnn = onSnapshot(
      query(collection(db, 'globalAnnouncements'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setGlobalAnnouncements(snapshot.docs.map((item) => ({ id: item.id, ...item.data(), isGlobal: true })));
      },
      (error) => console.warn('[AdminDashboard] Global announcements error:', error)
    );

    const unsubPolls = onSnapshot(query(collection(db, 'polls'), where('societyId', '==', userData.societyId)), (snapshot) => {
      const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setPolls(list);
      setStats((prev) => ({ ...prev, activePolls: list.filter((item) => !item.isClosed).length }));
    });

    const unsubUsers = onSnapshot(
      query(collection(db, 'users'), where('societyId', '==', userData.societyId)),
      (snapshot) => {
        const users = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        const residentUsers = users.filter((item) => item.role !== 'super_admin' && item.status !== 'deleted');
        setSocietyUsers(residentUsers);
        setPendingResidents(residentUsers.filter((item) => item.status === 'pending'));
        setStats((prev) => ({
          ...prev,
          residents: residentUsers.filter((item) => item.role === 'resident').length,
        }));
        setResidentsLoading(false);
      },
      (error) => {
        console.error(error);
        setResidentsLoading(false);
      }
    );

    const unsubAdminRequests = onSnapshot(
      query(collection(db, 'adminRequests'), where('societyId', '==', userData.societyId)),
      (snapshot) => {
        const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setAdminRequests(list);
      },
      (error) => console.warn('[AdminDashboard] Admin request listener error:', error)
    );

    let unsubBroadcasts = () => {};
    try {
      const qBroadcasts = query(
        collection(db, 'broadcasts'),
        where('societyId', '==', userData.societyId),
        orderBy('timestamp', 'desc')
      );
      unsubBroadcasts = onSnapshot(
        qBroadcasts,
        (snapshot) => {
          setBroadcasts(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
        },
        (error) => {
          if (error.code === 'failed-precondition' || error.message?.includes('index')) {
            console.warn('[AdminDashboard] Broadcasts index missing. Falling back to unordered query.');
            const qFallback = query(collection(db, 'broadcasts'), where('societyId', '==', userData.societyId));
            unsubBroadcasts = onSnapshot(qFallback, (snapshot) => {
              const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
              list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
              setBroadcasts(list);
            });
          } else {
            console.error('[AdminDashboard] Broadcasts error:', error);
          }
        }
      );
    } catch (error) {
      console.error('[AdminDashboard] Broadcasts setup error:', error);
    }

    const qSOS = query(
      collection(db, 'sosAlerts'),
      where('societyId', '==', userData.societyId),
      where('status', '==', 'active'),
      orderBy('timestamp', 'desc'),
      limit(3)
    );
    let unsubSOSActive = onSnapshot(
      qSOS,
      (snapshot) => {
        setActiveSOSFeed(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item) => (item?.status || 'active') === 'active'));
      },
      (error) => {
        console.warn('[AdminDashboard] SOS Fallback:', error);
        const qFallback = query(collection(db, 'sosAlerts'), where('societyId', '==', userData.societyId), where('status', '==', 'active'));
        unsubSOSActive = onSnapshot(qFallback, (snapshot) => {
          const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
          list.sort((a, b) => {
            const aTimestamp = typeof a.timestamp?.toMillis === 'function' ? a.timestamp.toMillis() : Number(a.timestamp || 0);
            const bTimestamp = typeof b.timestamp?.toMillis === 'function' ? b.timestamp.toMillis() : Number(b.timestamp || 0);
            return bTimestamp - aTimestamp;
          });
          setActiveSOSFeed(list.slice(0, 3));
        });
      }
    );

    return () => {
      unsubIssues();
      unsubAnn();
      unsubGlobalAnn();
      unsubPolls();
      unsubUsers();
      unsubAdminRequests();
      unsubBroadcasts();
      unsubSOSActive();
    };
  }, [userData?.societyId]);

  useEffect(() => {
    if (!userData?.uid) {
      return undefined;
    }
    const userRef = doc(db, 'users', userData.uid);
    updateDoc(userRef, { isOnline: true }).catch(console.error);
    saveTokenToFirestore(userData.uid, userData.societyId);
    const unsubFCM = listenToForegroundMessages(navigate);
    const sub = AppState.addEventListener('change', (nextState) =>
      updateDoc(userRef, { isOnline: nextState === 'active', lastSeen: Date.now() }).catch(console.error)
    );
    return () => {
      sub.remove();
      if (unsubFCM) unsubFCM();
      updateDoc(userRef, { isOnline: false, lastSeen: Date.now() }).catch(console.error);
    };
  }, [userData?.uid, userData?.societyId]);

  useEffect(() => {
    if (!userData?.societyId) {
      return undefined;
    }

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

  const handleApprove = async (residentId) => {
    try {
      await updateDoc(doc(db, 'users', residentId), { status: 'approved' });
      Alert.alert('Success', 'Resident approved.');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRejectResident = async (residentId) => {
    try {
      await updateDoc(doc(db, 'users', residentId), { status: 'rejected' });
      Alert.alert('Success', 'Resident request rejected.');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const submitAdminRequest = async (targetUser) => {
    if (!userData?.societyId || !userData?.uid || !targetUser?.id) {
      return;
    }
    if (adminRequestSubmittingId) {
      return;
    }

    const latestRequest = adminRequests.find((item) => item.userId === targetUser.id);
    if (latestRequest?.status === 'pending') {
      setAdminRequestFeedback(`Request already pending for: ${targetUser.name || targetUser.email || 'Resident'}`);
      return;
    }

    setAdminRequestSubmittingId(targetUser.id);
    try {
      await addDoc(collection(db, 'adminRequests'), {
        userId: targetUser.id,
        userName: targetUser.name || '',
        userEmail: targetUser.email || '',
        email: targetUser.email || '',
        societyId: userData.societyId,
        requestedBy: userData.uid,
        status: 'pending',
        createdAt: Date.now(),
      });
      setAdminRequestFeedback(`Request sent for: ${targetUser.name || targetUser.email || 'Resident'}`);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setAdminRequestSubmittingId(null);
    }
  };

  const handleStatusChange = async (issueId, newStatus) => {
    try {
      await updateIssueStatus(issueId, newStatus, null);
      Alert.alert('Success', `Issue marked as ${newStatus}`);
      try {
        const issueSnap = await getDoc(doc(db, 'issues', issueId));
        if (issueSnap.exists()) {
          const issueData = issueSnap.data();
          const ownerId = issueData.createdBy || issueData.userId;
          const issueTitle = issueData.title || 'your issue';
          if (ownerId) {
            await pushNotification({
              societyId: userData.societyId,
              type: 'ISSUE_UPDATED',
              title: 'Issue Update',
              message: `Your issue "${issueTitle}" is now ${newStatus}`,
              targetRole: 'resident',
              userId: ownerId,
            });
          }
        }
      } catch (notifErr) {
        console.warn('ISSUE_UPDATED notification failed:', notifErr);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleClosePoll = async (pollId) => {
    try {
      await updateDoc(doc(db, 'polls', pollId), { isClosed: true });
      Alert.alert('Success', 'Poll closed.');
    } catch (error) {
      Alert.alert('Error', 'Failed to close poll.');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (Platform.OS === 'web') {
      if (!window.confirm('Delete this announcement?')) return;
      await deleteAnnouncement(id);
      return;
    }

    Alert.alert('Confirm Delete', 'Delete this announcement?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => deleteAnnouncement(id) },
    ]);
  };

  const pickAndUploadImage = async (issueId) => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (event) => {
          const file = event.target.files[0];
          if (file) {
            await processImageUpload(issueId, file, true);
          } else {
            Alert.alert('Required', 'You must upload proof image to resolve issue');
          }
        };
        input.click();
      } else {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert('Permission Required', 'Permission to access camera roll is required!');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
        });
        if (!result.canceled) {
          await processImageUpload(issueId, result.assets[0].uri, false);
        } else {
          Alert.alert('Required', 'You must upload proof image to resolve issue');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const processImageUpload = async (issueId, imageSource, isWeb) => {
    setLoading(true);
    setLoadingIssueId(issueId);
    try {
      const imageUrl = isWeb
        ? await uploadImage(imageSource)
        : await uploadImage({ uri: imageSource, type: 'image/jpeg', name: 'resolved_issue.jpg' });
      if (!imageUrl) throw new Error('Upload returned empty url');
      await resolveIssue(issueId, imageUrl);
      Alert.alert('Success', 'Issue marked as Resolved');
      try {
        const issueSnap = await getDoc(doc(db, 'issues', issueId));
        if (issueSnap.exists()) {
          const issueData = issueSnap.data();
          const ownerId = issueData.createdBy || issueData.userId;
          const issueTitle = issueData.title || 'your issue';
          if (ownerId) {
            await pushNotification({
              societyId: userData.societyId,
              type: 'ISSUE_UPDATED',
              title: 'Issue Update',
              message: `Your issue "${issueTitle}" is now Resolved`,
              targetRole: 'resident',
              userId: ownerId,
            });
          }
        }
      } catch (notifErr) {
        console.warn('ISSUE_UPDATED (resolved) notification failed:', notifErr);
      }
    } catch (error) {
      Alert.alert('Error', 'Image upload failed. Try again.');
    } finally {
      setLoading(false);
      setLoadingIssueId(null);
    }
  };

  const openPDF = (url) => {
    if (url) window.open(url, '_blank');
  };

  const combinedAnnouncements = useMemo(() => {
    const global = globalAnnouncements.map((item) => ({
      ...item,
      description: item.message || item.description || '',
      isGlobal: true,
    }));
    const local = announcements.map((item) => ({ ...item, isGlobal: false }));
    return [...global, ...local].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [announcements, globalAnnouncements]);

  const current = navStack[navStack.length - 1];
  const residentDirectory = useMemo(
    () => societyUsers.filter((item) => item.role !== 'super_admin' && item.status !== 'deleted'),
    [societyUsers]
  );

  const renderContent = () => {
    switch (current.screen) {
      case 'Dashboard':
        return (
          <AdminHomeScreen
            stats={stats}
            societyCode={societyCode}
            broadcasts={broadcasts}
            issues={issues}
            activeSOS={activeSOSFeed}
            pendingResidentsCount={pendingResidents.length}
            loading={dashboardLoading}
            onNavigate={navigate}
          />
        );
      case 'ResidentApproval':
      case 'ResidentsScreen':
        return (
          <ResidentApprovalScreen
            pendingResidents={pendingResidents}
            residents={residentDirectory}
            adminRequests={adminRequests}
            adminRequestFeedback={adminRequestFeedback}
            adminRequestSubmittingId={adminRequestSubmittingId}
            handleApprove={handleApprove}
            handleReject={handleRejectResident}
            onSendAdminRequest={submitAdminRequest}
            loading={residentsLoading}
          />
        );
      case 'IssueManagement':
        return (
          <IssueManagementScreen
            issues={issues}
            handleStatusChange={handleStatusChange}
            pickAndUploadImage={pickAndUploadImage}
            loading={loading}
            loadingIssueId={loadingIssueId}
            listLoading={issuesLoading}
            onNavigate={navigate}
          />
        );
      case 'Announcements':
        return (
          <AdminAnnouncementsScreen
            announcements={combinedAnnouncements}
            handleEditClick={(announcement) => navigate('EditAnnouncement', { announcement })}
            handleDeleteAnnouncement={handleDeleteAnnouncement}
            openPDF={openPDF}
            onNavigate={navigate}
          />
        );
      case 'Polls':
        return <AdminPollsScreen polls={polls} handleClosePoll={handleClosePoll} onNavigate={navigate} totalUsers={stats.residents} />;
      case 'SOSAlerts':
      case 'SOSAlertsScreen':
        return <SOSAlertsScreen goBack={goBack} />;
      case 'Broadcast':
      case 'BroadcastScreen':
        return <BroadcastScreen goBack={goBack} />;
      case 'BroadcastHistory':
      case 'BroadcastHistoryScreen':
        return <BroadcastHistoryScreen goBack={goBack} />;
      case 'Chat':
      case 'ChatScreen':
        return <ChatScreen navigation={{ navigate, goBack }} />;
      case 'Profile':
      case 'ProfileScreen':
        return <ProfileScreen navigation={{ navigate, goBack }} userId={current.params?.userId} />;
      case 'EditProfile':
      case 'EditProfileScreen':
        return <EditProfileScreen navigation={{ navigate, goBack }} userId={current.params?.userId} />;
      case 'Members':
      case 'MembersScreen':
        return <MembersScreen goBack={goBack} onViewProfile={(id) => navigate('Profile', { userId: id })} />;
      case 'CreateAnnouncement':
      case 'CreateAnnouncementScreen':
        return <CreateAnnouncementScreen navigation={{ navigate, goBack }} goBack={goBack} />;
      case 'EditAnnouncement':
        return (
          <CreateAnnouncementScreen
            navigation={{ navigate, goBack }}
            goBack={goBack}
            announcement={current.params?.announcement}
          />
        );
      case 'CreatePoll':
      case 'CreatePollScreen':
        return <CreatePollScreen navigation={{ navigate, goBack }} goBack={goBack} />;
      case 'IssueDetail':
        return <IssueDetailScreen issue={current.params?.issue} goBack={goBack} />;
      case 'NotificationScreen':
        return <NotificationScreen goBack={goBack} />;
      case 'BookingManagement':
      case 'BookingManagementScreen':
      case 'AdminBookingScreen':
        return <AdminBookingScreen goBack={goBack} />;
      case 'Analytics':
        return <AnalyticsScreen goBack={goBack} />;
      default:
        return (
          <AdminHomeScreen
            stats={stats}
            societyCode={societyCode}
            broadcasts={broadcasts}
            issues={issues}
            activeSOS={activeSOSFeed}
            pendingResidentsCount={pendingResidents.length}
            loading={dashboardLoading}
            onNavigate={navigate}
          />
        );
    }
  };

  return (
    <AdminLayout activeScreen={current.screen} onNavigate={navigate} title={SCREEN_TITLES[current.screen] || current.screen}>
      <View style={[styles.screenBody, { backgroundColor: isDark ? '#121212' : '#f8fafc' }]}>
        {activeSOS ? (
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => navigate('SOSAlerts')}
            style={[styles.sosBanner, !sosBannerVisible && styles.sosBannerDimmed]}
          >
            <Text style={styles.sosText}>{'\uD83D\uDEA8'} {activeSOS?.type?.toUpperCase?.() || 'UNKNOWN'} EMERGENCY</Text>
            <Text style={styles.sosSubtext}>Flat {activeSOS?.flatNumber || activeSOS?.flat || 'N/A'} needs attention now</Text>
          </TouchableOpacity>
        ) : null}
        {renderContent()}
      </View>
    </AdminLayout>
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
