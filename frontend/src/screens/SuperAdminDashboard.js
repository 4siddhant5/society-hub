import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { FiAlertTriangle, FiBarChart2, FiBell, FiHome, FiUserCheck, FiUsers } from '../utils/iconCompat';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { logoutAuthUser } from '../services/authService';
import BaseLayout from '../layouts/BaseLayout';
import {
  approveSocietyRequest,
  approveAdminRequest,
  blockUser,
  createGlobalAnnouncement,
  deleteGlobalAnnouncement,
  deleteUserAccess,
  promoteUserToAdmin,
  rejectAdminRequest,
  rejectSocietyRequest,
  removeAdminRole,
  setSocietyStatus,
  unblockUser,
} from '../services/societyService';

const NAV_ITEMS = [
  { label: 'Societies', screen: 'Societies', icon: FiHome },
  { label: 'Admin Requests', screen: 'Admin Requests', icon: FiUserCheck },
  { label: 'Users', screen: 'Users', icon: FiUsers },
  { label: 'Issues', screen: 'Issues', icon: FiAlertTriangle },
  { label: 'Analytics', screen: 'Analytics', icon: FiBarChart2 },
  { label: 'Global Announcements', screen: 'Global Announcements', icon: FiBell },
];

const Pill = ({ label, tone = 'neutral' }) => {
  const colors = {
    neutral: ['#e2e8f0', '#475569'],
    info: ['#dbeafe', '#1d4ed8'],
    success: ['#dcfce7', '#166534'],
    warning: ['#fef3c7', '#92400e'],
    danger: ['#fee2e2', '#b91c1c'],
  }[tone] || ['#e2e8f0', '#475569'];

  return (
    <View style={[styles.pill, { backgroundColor: colors[0] }]}>
      <Text style={[styles.pillText, { color: colors[1] }]}>{label}</Text>
    </View>
  );
};

const ActionButton = ({ label, onPress, tone = 'primary', disabled = false }) => {
  const backgroundColor = {
    primary: '#0f62fe',
    success: '#15803d',
    warning: '#b45309',
    danger: '#dc2626',
    ghost: '#e2e8f0',
  }[tone] || '#0f62fe';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.actionButton, { backgroundColor }, disabled && { opacity: 0.6 }]}
    >
      <Text style={[styles.actionButtonText, tone === 'ghost' && { color: '#1e293b' }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const StatCard = ({ label, value, sublabel, accent }) => (
  <View style={styles.statCard}>
    <View style={[styles.statAccent, { backgroundColor: accent }]} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    {!!sublabel && <Text style={styles.statSub}>{sublabel}</Text>}
  </View>
);

const userName = (item) => item?.name || item?.email || item?.phoneNumber || 'Unnamed user';

export default function SuperAdminDashboard() {
  const { currentUser } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;

  const [activeTab, setActiveTab] = useState('Societies');
  const [societies, setSocieties] = useState([]);
  const [requests, setRequests] = useState([]);
  const [adminRequests, setAdminRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [issues, setIssues] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');

  useEffect(() => {
    const unsubSocieties = onSnapshot(
      collection(db, 'societies'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setSocieties(list);
      },
      (error) => console.log('SUPER ADMIN SOCIETIES ERROR:', error)
    );
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setUsers(list);
      },
      (error) => console.log('SUPER ADMIN USERS ERROR:', error)
    );
    const unsubRequests = onSnapshot(
      query(collection(db, 'societyRequests'), where('status', '==', 'pending')),
      (snap) => {
        console.log('FETCHED:', snap.docs.length);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setRequests(list);
      },
      (error) => console.log('SUPER ADMIN REQUESTS ERROR:', error)
    );
    const unsubAdminRequests = onSnapshot(
      query(collection(db, 'adminRequests'), where('status', '==', 'pending')),
      (snap) => {
        console.log('FETCHED:', snap.docs.length);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setAdminRequests(list);
      },
      (error) => console.log('SUPER ADMIN ADMIN REQUESTS ERROR:', error)
    );
    const unsubIssues = onSnapshot(
      collection(db, 'issues'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setIssues(list);
      },
      (error) => console.log('SUPER ADMIN ISSUES ERROR:', error)
    );
    const unsubAnnouncements = onSnapshot(
      query(collection(db, 'globalAnnouncements'), orderBy('createdAt', 'desc')),
      (snap) => setAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (error) => console.log('SUPER ADMIN ANNOUNCEMENTS ERROR:', error)
    );
    return () => {
      unsubSocieties();
      unsubUsers();
      unsubRequests();
      unsubAdminRequests();
      unsubIssues();
      unsubAnnouncements();
    };
  }, []);

  const societyMap = useMemo(
    () => societies.reduce((acc, item) => ({ ...acc, [item.id]: item.name || 'Unnamed society' }), {}),
    [societies]
  );

  const matches = (values) => values.join(' ').toLowerCase().includes(searchText.trim().toLowerCase());

  const filteredRequests = useMemo(
    () =>
      !searchText.trim()
        ? requests
        : requests.filter((item) => matches([item.name || '', item.address || '', item.email || '', item.phoneNumber || '', item.createdBy || ''])),
    [requests, searchText]
  );

  const filteredAdminRequests = useMemo(
    () =>
      !searchText.trim()
        ? adminRequests
        : adminRequests.filter((item) =>
            matches([item.email || '', item.userId || '', societyMap[item.societyId] || '', item.status || ''])
          ),
    [adminRequests, searchText, societyMap]
  );

  const filteredSocieties = useMemo(
    () => (!searchText.trim() ? societies : societies.filter((item) => matches([item.name || '', item.address || '', item.societyCode || '', item.status || '']))),
    [searchText, societies]
  );

  const filteredUsers = useMemo(
    () =>
      !searchText.trim()
        ? users
        : users.filter((item) => matches([item.name || '', item.email || '', item.phoneNumber || '', item.role || '', item.status || '', societyMap[item.societyId] || ''])),
    [searchText, societyMap, users]
  );

  const filteredIssues = useMemo(
    () =>
      !searchText.trim()
        ? issues
        : issues.filter((item) => matches([item.title || '', item.description || '', item.status || '', societyMap[item.societyId] || ''])),
    [issues, searchText, societyMap]
  );

  const filteredAnnouncements = useMemo(
    () => (!searchText.trim() ? announcements : announcements.filter((item) => matches([item.title || '', item.message || '']))),
    [announcements, searchText]
  );

  const totalMembers = users.filter((item) => item.societyId && item.status !== 'deleted').length;
  const isResolved = (status) => String(status || '').toLowerCase() === 'resolved';
  const analytics = useMemo(() => {
    const resolvedCount = issues.filter((item) => isResolved(item.status)).length;
    const activeCount = issues.length - resolvedCount;
    const activeSocieties = societies.filter((society) => society.status !== 'suspended').length;
    const suspendedSocieties = societies.filter((society) => society.status === 'suspended').length;
    const blockedUsers = users.filter((user) => user.status === 'blocked').length;
    const adminCount = users.filter((user) => user.role === 'admin').length;
    const appUsage = users.filter((user) => user.isOnline).length;
    return {
      totalSocieties: societies.length,
      totalUsers: users.length,
      activeIssues: activeCount,
      resolvedIssues: resolvedCount,
      appUsage,
      pendingSocietyRequests: requests.length,
      activeSocieties,
      suspendedSocieties,
      blockedUsers,
      adminCount,
    };
  }, [issues, requests.length, societies, users]);
  const issueMix = useMemo(() => {
    const counts = issues.reduce((acc, item) => {
      const key = item.status || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [issues]);

  const topSocieties = useMemo(() => {
    const counts = users.reduce((acc, item) => {
      const key = item.societyId || 'unassigned';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([key, value]) => ({ label: key === 'unassigned' ? 'Unassigned users' : societyMap[key] || 'Unknown society', value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [societyMap, users]);

  const confirmAction = (title, message, onConfirm) => {
    if (Platform.OS === 'web') {
      if (window.confirm(message)) onConfirm();
      return;
    }
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: onConfirm },
    ]);
  };

  const runAction = async (action, successMessage) => {
    try {
      await action();
      if (successMessage) Alert.alert('Updated', successMessage);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const toDateValue = (value) => {
    if (!value) return null;
    if (typeof value === 'number') return new Date(value);
    if (value?.toDate) return value.toDate();
    if (value?.seconds) return new Date(value.seconds * 1000);
    return new Date(value);
  };

  const formatDateTime = (value) => {
    const date = toDateValue(value);
    return date ? date.toLocaleString() : 'Unknown time';
  };

  const createAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      Alert.alert('Error', 'Please fill title and message.');
      return;
    }
    await runAction(
      () =>
        createGlobalAnnouncement({
          title: announcementTitle.trim(),
          message: announcementMessage.trim(),
          createdBy: currentUser?.uid,
        }),
      'Global announcement sent.'
    );
    setAnnouncementTitle('');
    setAnnouncementMessage('');
  };

  const renderRow = (title, subtitle, badges, actions, body) => (
    <View style={styles.listCard}>
      <View style={styles.rowHeader}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={styles.rowTitle}>{title}</Text>
          {!!subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
        </View>
        <View style={styles.badges}>{badges}</View>
      </View>
      {!!body && body}
      <View style={styles.buttonRow}>{actions}</View>
    </View>
  );

  const renderSocieties = () => (
    <>
      <View style={styles.panel}>
        <View style={styles.sectionBar}>
          <View>
            <Text style={styles.panelTitle}>Society Network</Text>
            <Text style={styles.panelSub}>Suspend or reactivate societies with one click.</Text>
          </View>
          <Pill label={`${filteredSocieties.length} societies`} tone="info" />
        </View>
        {filteredSocieties.length === 0 ? <Text style={styles.emptyText}>No societies match this search.</Text> : filteredSocieties.map((item) => (
          <React.Fragment key={item.id}>
            {renderRow(
              item.name,
              item.address || 'No address added yet.',
              <>
                <Pill label={item.societyCode || 'No code'} tone="info" />
                <Pill label={item.status === 'suspended' ? 'Suspended' : 'Active'} tone={item.status === 'suspended' ? 'danger' : 'success'} />
              </>,
              <>
                <ActionButton label={item.status === 'suspended' ? 'Activate society' : 'Suspend society'} tone={item.status === 'suspended' ? 'success' : 'danger'} onPress={() => confirmAction('Society Status', `Update ${item.name}?`, () => runAction(() => setSocietyStatus(item.id, item.status === 'suspended' ? 'active' : 'suspended'), `Society is now ${item.status === 'suspended' ? 'active' : 'suspended'}.`))} />
              </>,
              <Text style={styles.metaText}>Secretary: {users.find((user) => user.id === item.secretaryId)?.name || 'Not assigned yet'}</Text>
            )}
          </React.Fragment>
        ))}
      </View>
    </>
  );

  const renderRequests = () => (
    <>
      <View style={styles.panel}>
        <View style={styles.sectionBar}>
          <View>
            <Text style={styles.panelTitle}>Society Creation Approvals</Text>
            <Text style={styles.panelSub}>Approve or reject society admins and new society setup requests.</Text>
          </View>
          <Pill label={`${filteredRequests.length} pending`} tone={filteredRequests.length ? 'warning' : 'neutral'} />
        </View>
        {filteredRequests.length === 0 ? <Text style={styles.emptyText}>No pending society requests.</Text> : filteredRequests.map((item) => (
          <React.Fragment key={item.id}>
            {renderRow(
              item.name,
              item.address || 'No address provided.',
              <Pill label="Awaiting review" tone="warning" />,
              <>
                <ActionButton label="Approve" tone="success" onPress={() => runAction(() => approveSocietyRequest(item.id, currentUser?.uid), 'Society request approved.')} />
                <ActionButton label="Reject" tone="danger" onPress={() => runAction(() => rejectSocietyRequest(item.id, 'Request does not meet approval criteria.', currentUser?.uid), 'Society request rejected.')} />
              </>,
              <>
                <Text style={styles.metaText}>Requested by: {item.adminName || item.email || item.phoneNumber || users.find((u) => u.id === item.adminId || u.id === item.createdBy)?.email || 'Unknown admin'}</Text>
                <Text style={styles.metaText}>Submitted: {formatDateTime(item.createdAt)}</Text>
              </>
            )}
          </React.Fragment>
        ))}
      </View>

      <View style={styles.panel}>
        <View style={styles.sectionBar}>
          <View>
            <Text style={styles.panelTitle}>Admin Promotion Requests</Text>
            <Text style={styles.panelSub}>Manual promote-to-admin works already. Stored role requests also surface here.</Text>
          </View>
          <Pill label={`${filteredAdminRequests.length} pending`} tone={filteredAdminRequests.length ? 'warning' : 'neutral'} />
        </View>
        {filteredAdminRequests.length === 0 ? (
          <Text style={styles.emptyText}>No resident-to-admin upgrade requests are stored yet.</Text>
        ) : (
          filteredAdminRequests.map((item) => {
            const requestUser = users.find((user) => user.id === item.userId);
            const displayName = requestUser ? userName(requestUser) : item.email || 'Unknown user';
            const societyName = societyMap[item.societyId] || societyMap[requestUser?.societyId] || 'No society linked';
            const requestedByUser = users.find((user) => user.id === item.requestedBy);
            const requestedByLabel = requestedByUser ? userName(requestedByUser) : item.requestedBy || 'Unknown admin';
            return (
              <React.Fragment key={item.id}>
                {renderRow(
                  displayName,
                  societyName,
                  <Pill label="Role request" tone="info" />,
                  <>
                    <ActionButton label="Approve as admin" tone="success" onPress={() => runAction(() => approveAdminRequest(item.id, item.userId, currentUser?.uid), 'Admin request approved.')} />
                    <ActionButton label="Reject" tone="danger" onPress={() => runAction(() => rejectAdminRequest(item.id, 'Request rejected.', currentUser?.uid), 'Admin request rejected.')} />
                  </>,
                  <>
                    <Text style={styles.metaText}>Requested by: {requestedByLabel}</Text>
                    <Text style={styles.metaText}>Requested: {formatDateTime(item.createdAt)}</Text>
                  </>
                )}
              </React.Fragment>
            );
          })
        )}
      </View>
    </>
  );

  const renderUsers = () => (
    <View style={styles.panel}>
      <View style={styles.sectionBar}>
        <View>
          <Text style={styles.panelTitle}>Global User Control</Text>
          <Text style={styles.panelSub}>View all users across societies, change roles, block accounts, or remove access.</Text>
        </View>
        <Pill label={`${filteredUsers.length} users`} tone="info" />
      </View>
      {filteredUsers.length === 0 ? <Text style={styles.emptyText}>No users match this search.</Text> : filteredUsers.map((item) => (
        <React.Fragment key={item.id}>
          {renderRow(
            userName(item),
            `${societyMap[item.societyId] || 'No society assigned'}${item.email ? ` - ${item.email}` : ''}`,
            <>
              <Pill label={item.role || 'resident'} tone={item.role === 'admin' ? 'info' : item.role === 'super_admin' ? 'warning' : 'neutral'} />
              <Pill label={item.status || 'pending'} tone={item.status === 'approved' ? 'success' : item.status === 'blocked' || item.status === 'deleted' ? 'danger' : 'warning'} />
            </>,
            <>
              {item.role !== 'admin' && item.role !== 'super_admin' ? <ActionButton label="Promote to admin" tone="success" onPress={() => runAction(() => promoteUserToAdmin(item.id), 'User promoted to admin.')} /> : null}
              {item.role === 'admin' ? <ActionButton label="Remove admin" tone="warning" onPress={() => runAction(() => removeAdminRole(item.id), 'Admin role removed.')} /> : null}
              {item.role !== 'super_admin' && item.status !== 'blocked' && item.status !== 'deleted' ? <ActionButton label="Block user" tone="danger" onPress={() => runAction(() => blockUser(item.id, 'Blocked by super admin'), 'User blocked.')} /> : null}
              {item.role !== 'super_admin' && item.status === 'blocked' ? <ActionButton label="Unblock user" tone="success" onPress={() => runAction(() => unblockUser(item.id), 'User reactivated.')} /> : null}
              {item.role !== 'super_admin' && item.status !== 'deleted' ? <ActionButton label="Delete access" tone="ghost" onPress={() => confirmAction('Delete User', `Remove access for ${userName(item)}?`, () => runAction(() => deleteUserAccess(item.id), 'User access removed.'))} /> : null}
            </>,
            <Text style={styles.metaText}>Flat: {item.flat || 'N/A'} - Wing: {item.wing || 'N/A'} - Phone: {item.phoneNumber || 'N/A'}</Text>
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderIssues = () => (
    <View style={styles.panel}>
      <View style={styles.sectionBar}>
        <View>
          <Text style={styles.panelTitle}>Issue Command Center</Text>
          <Text style={styles.panelSub}>Super admin visibility into issue volume across every society.</Text>
        </View>
        <Pill label={`${filteredIssues.length} issues`} tone="info" />
      </View>
      {filteredIssues.length === 0 ? <Text style={styles.emptyText}>No issues match this search.</Text> : filteredIssues.map((item) => (
        <React.Fragment key={item.id}>
          {renderRow(
            item.title || 'Issue',
            societyMap[item.societyId] || 'Unknown society',
            <Pill label={item.status || 'Pending'} tone={isResolved(item.status) ? 'success' : item.status === 'In Progress' ? 'info' : 'warning'} />,
            null,
            <>
              <Text style={styles.metaText}>{item.description || 'No description provided.'}</Text>
              <Text style={styles.metaText}>Reported: {formatDateTime(item.createdAt)}</Text>
            </>
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderAnalytics = () => {
    const issueMax = Math.max(...issueMix.map((item) => item.value), 0);
    const societyMax = Math.max(...topSocieties.map((item) => item.value), 0);

    return (
      <>
        <View style={styles.statGrid}>
          <StatCard label="Total societies" value={analytics.totalSocieties} sublabel={`${analytics.activeSocieties} active now`} accent="#0f62fe" />
          <StatCard label="Total users" value={analytics.totalUsers} sublabel={`${analytics.adminCount} admins, ${analytics.blockedUsers} blocked`} accent="#15803d" />
          <StatCard label="Active issues" value={analytics.activeIssues} sublabel={`${analytics.resolvedIssues} resolved`} accent="#f59e0b" />
          <StatCard label="App usage" value={analytics.appUsage} sublabel="Users online right now" accent="#7c3aed" />
        </View>

        <View style={[styles.split, isWide && styles.splitWide]}>
          <View style={[styles.panel, isWide && styles.mainCol]}>
            <Text style={styles.panelTitle}>Issue Status Mix</Text>
            <Text style={styles.panelSub}>A quick cross-society view of active versus resolved work.</Text>
            {issueMix.length === 0 ? <Text style={styles.emptyText}>Issue analytics will appear once data exists.</Text> : issueMix.map((item) => (
              <View key={item.label} style={styles.chartRow}>
                <View style={styles.chartLabelRow}>
                  <Text style={styles.chartLabel}>{item.label}</Text>
                  <Text style={styles.chartValue}>{item.value}</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${Math.max(8, Math.round((item.value / issueMax) * 100))}%`, backgroundColor: '#0f62fe' }]} />
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.panel, isWide && styles.sideCol]}>
            <Text style={styles.panelTitle}>Top Societies By Members</Text>
            <Text style={styles.panelSub}>See where most platform users currently belong.</Text>
            {topSocieties.length === 0 ? <Text style={styles.emptyText}>Member analytics will appear once data exists.</Text> : topSocieties.map((item) => (
              <View key={item.label} style={styles.chartRow}>
                <View style={styles.chartLabelRow}>
                  <Text style={styles.chartLabel}>{item.label}</Text>
                  <Text style={styles.chartValue}>{item.value}</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${Math.max(8, Math.round((item.value / societyMax) * 100))}%`, backgroundColor: '#7c3aed' }]} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </>
    );
  };

  const renderAnnouncements = () => (
    <>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Global Announcements</Text>
        <Text style={styles.panelSub}>Broadcast system-wide updates to every society from super admin.</Text>
        <TextInput style={styles.input} placeholder="Announcement title" value={announcementTitle} onChangeText={setAnnouncementTitle} />
        <TextInput style={[styles.input, styles.textArea]} placeholder="Announcement message" multiline value={announcementMessage} onChangeText={setAnnouncementMessage} />
        <View style={styles.buttonRow}>
          <ActionButton label="Send announcement" onPress={createAnnouncement} />
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.sectionBar}>
          <View>
            <Text style={styles.panelTitle}>Announcement History</Text>
            <Text style={styles.panelSub}>Review and remove published global announcements.</Text>
          </View>
          <Pill label={`${filteredAnnouncements.length} messages`} tone="info" />
        </View>
        {filteredAnnouncements.length === 0 ? <Text style={styles.emptyText}>No announcements match this search.</Text> : filteredAnnouncements.map((item) => (
          <React.Fragment key={item.id}>
            {renderRow(
              item.title,
              formatDateTime(item.createdAt),
              <Pill label="Global" tone="info" />,
              <ActionButton label="Delete" tone="ghost" onPress={() => confirmAction('Delete Announcement', `Delete "${item.title}"?`, () => runAction(() => deleteGlobalAnnouncement(item.id), 'Announcement deleted.'))} />,
              <Text style={styles.metaText}>{item.message}</Text>
            )}
          </React.Fragment>
        ))}
      </View>
    </>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Societies': return renderSocieties();
      case 'Admin Requests': return renderRequests();
      case 'Users': return renderUsers();
      case 'Issues': return renderIssues();
      case 'Analytics': return renderAnalytics();
      case 'Global Announcements': return renderAnnouncements();
      default: return null;
    }
  };

  return (
    <BaseLayout
      activeScreen={activeTab}
      onNavigate={(screen) => NAV_ITEMS.find((item) => item.screen === screen) && setActiveTab(screen)}
      title="Super Admin Panel"
      menuItems={NAV_ITEMS}
    >
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Text style={styles.topTitle}>Super Admin Control</Text>
          <ActionButton label="Logout" tone="danger" onPress={logoutAuthUser} />
        </View>

        <View style={styles.statGrid}>
          <StatCard label="Total societies" value={analytics.totalSocieties} sublabel={`${analytics.activeSocieties} active`} accent="#0f62fe" />
          <StatCard label="Total members" value={totalMembers} sublabel={`${analytics.adminCount} admins`} accent="#15803d" />
          <StatCard label="Open issues" value={analytics.activeIssues} sublabel={`${analytics.resolvedIssues} resolved`} accent="#f59e0b" />
          <StatCard label="Live app users" value={analytics.appUsage} sublabel={`${analytics.blockedUsers} blocked`} accent="#7c3aed" />
        </View>

        <View style={styles.toolbar}>
          <TextInput style={styles.searchInput} placeholder={`Search ${activeTab.toLowerCase()}...`} value={searchText} onChangeText={setSearchText} />
        </View>

        {renderTabContent()}
      </ScrollView>
    </BaseLayout>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#eef4ff' },
  container: { padding: 16, paddingTop: 28, paddingBottom: 40 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  topTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  toolbar: { marginBottom: 16 },
  searchInput: { marginTop: 4, backgroundColor: '#fff', borderWidth: 1, borderColor: '#dbe7ff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 18 },
  statCard: { width: '48.5%', backgroundColor: '#fff', borderRadius: 22, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#dbe7ff' },
  statAccent: { width: 40, height: 6, borderRadius: 999, marginBottom: 16 },
  statValue: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  statLabel: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginTop: 8 },
  statSub: { fontSize: 13, color: '#64748b', marginTop: 6, lineHeight: 18 },
  split: { flexDirection: 'column' },
  splitWide: { flexDirection: 'row', justifyContent: 'space-between' },
  mainCol: { width: '60.5%' },
  sideCol: { width: '37.5%' },
  panel: { backgroundColor: '#fff', borderRadius: 24, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#dbe7ff' },
  panelTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  panelSub: { marginTop: 6, marginBottom: 14, color: '#64748b', fontSize: 14, lineHeight: 20 },
  sectionBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  input: { backgroundColor: '#f8fbff', borderWidth: 1, borderColor: '#dbe7ff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  miniGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  listCard: { borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', padding: 16, marginTop: 12, backgroundColor: '#fcfdff' },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rowTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  rowSubtitle: { marginTop: 6, color: '#64748b', fontSize: 13, lineHeight: 18 },
  badges: { alignItems: 'flex-end' },
  metaText: { color: '#475569', fontSize: 13, lineHeight: 18, marginTop: 8 },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginLeft: 8, marginBottom: 8 },
  pillText: { fontSize: 12, fontWeight: '700' },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14 },
  actionButton: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, marginRight: 10, marginBottom: 10 },
  actionButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  emptyText: { color: '#64748b', fontSize: 14, lineHeight: 20, paddingVertical: 6 },
  chartRow: { marginTop: 12 },
  chartLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  chartLabel: { flex: 1, paddingRight: 12, color: '#1e293b', fontSize: 14, fontWeight: '700' },
  chartValue: { color: '#64748b', fontSize: 13, fontWeight: '700' },
  track: { height: 12, borderRadius: 999, backgroundColor: '#e2e8f0', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
});
