import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { sendSOS } from '../services/sosService';

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  return Number(value) || 0;
};

const formatTime = (value) => {
  const milliseconds = toMillis(value);
  if (!milliseconds) return 'Time unavailable';
  return new Date(milliseconds).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const normalizeStatus = (status) => String(status || 'active').toLowerCase();

const SOSButton = ({ label, icon, color, onPress, disabled }) => (
  <TouchableOpacity
    style={[styles.sosCard, { borderLeftColor: color }, disabled && styles.disabledBtn]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.8}
  >
    <View style={[styles.iconCircle, { backgroundColor: `${color}20` }]}>
      <Text style={styles.btnSymbol}>{icon}</Text>
    </View>
    <View style={styles.btnContent}>
      <Text style={[styles.btnText, { color }]}>{label}</Text>
      <Text style={styles.btnSubtext}>Notify all admins immediately</Text>
    </View>
    <Text style={styles.chevron}>{'>'}</Text>
  </TouchableOpacity>
);

function SOSScreenInner({ goBack }) {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [activeSOS, setActiveSOS] = useState([]);
  const [allSOS, setAllSOS] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentError, setRecentError] = useState('');

  useEffect(() => {
    console.log('ACTIVE SOS:', activeSOS);
  }, [activeSOS]);

  useEffect(() => {
    console.log('ALL SOS:', allSOS);
  }, [allSOS]);

  useEffect(() => {
    if (!userData?.societyId) return undefined;

    let unsubActive = () => {};
    let unsubAll = () => {};

    setRecentLoading(true);
    setRecentError('');

    const applyActiveSnapshot = (snapshot) => {
      const items = snapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        .sort((a, b) => toMillis(b?.timestamp) - toMillis(a?.timestamp));

      setActiveSOS(items);
    };

    const applyAllSnapshot = (snapshot) => {
      const items = snapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        .sort((a, b) => toMillis(b?.timestamp) - toMillis(a?.timestamp));

      setAllSOS(items);
      setRecentLoading(false);
    };

    const activeQuery = query(
      collection(db, 'sosAlerts'),
      where('societyId', '==', userData.societyId),
      where('status', '==', 'active'),
      orderBy('timestamp', 'desc')
    );

    const allQuery = query(
      collection(db, 'sosAlerts'),
      where('societyId', '==', userData.societyId),
      orderBy('timestamp', 'desc')
    );

    unsubActive = onSnapshot(
      activeQuery,
      applyActiveSnapshot,
      (error) => {
        if (error.code === 'failed-precondition' || error.message?.includes('index')) {
          const activeFallbackQuery = query(
            collection(db, 'sosAlerts'),
            where('societyId', '==', userData.societyId),
            where('status', '==', 'active')
          );
          unsubActive();
          unsubActive = onSnapshot(
            activeFallbackQuery,
            applyActiveSnapshot,
            (fallbackError) => {
              console.error('SOSScreen active fallback error:', fallbackError);
              setRecentError('Unable to load active emergencies right now.');
            }
          );
          return;
        }

        console.error('SOSScreen active alerts error:', error);
        setRecentError('Unable to load active emergencies right now.');
      }
    );

    unsubAll = onSnapshot(
      allQuery,
      applyAllSnapshot,
      (error) => {
        if (error.code === 'failed-precondition' || error.message?.includes('index')) {
          const allFallbackQuery = query(
            collection(db, 'sosAlerts'),
            where('societyId', '==', userData.societyId)
          );
          unsubAll();
          unsubAll = onSnapshot(
            allFallbackQuery,
            applyAllSnapshot,
            (fallbackError) => {
              console.error('SOSScreen history fallback error:', fallbackError);
              setRecentError('Unable to load SOS history right now.');
              setRecentLoading(false);
            }
          );
          return;
        }

        console.error('SOSScreen history alerts error:', error);
        setRecentError('Unable to load SOS history right now.');
        setRecentLoading(false);
      }
    );

    return () => {
      unsubActive();
      unsubAll();
    };
  }, [userData?.societyId]);

  const submitSOS = async (type, customData = null) => {
    setLoading(true);
    try {
      const result = await sendSOS({
        senderId: user?.uid,
        userId: user?.uid,
        senderName: userData?.name || 'Unknown User',
        userName: userData?.name || 'Unknown User',
        type,
        message: customData?.description || `Emergency in Flat ${userData?.flat || 'N/A'}`,
        societyId: userData?.societyId,
        flat: userData?.flat || '',
        flatNumber: userData?.flat || '',
        wing: userData?.wing || '',
        location: `Flat ${userData?.flat || 'N/A'}`,
        customType: customData?.title || '',
        status: 'active',
      });

      if (result?.notificationFailed) {
        Alert.alert('SOS Sent', 'Emergency saved successfully. Push notification permission is unavailable, but the in-app SOS alert is active.');
      } else {
        Alert.alert('SOS Sent', 'Admins have been notified.');
      }

      setCustomModalVisible(false);
      setCustomTitle('');
      setCustomDesc('');
      if (!customData) goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to send SOS.');
    } finally {
      setLoading(false);
    }
  };

  const triggerDirectSOS = async () => {
    await submitSOS('SOS');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>Emergency Protocol</Text>
          <Text style={styles.warningText}>Use these buttons only for real emergencies. False alerts may result in penalties.</Text>
        </View>

        <TouchableOpacity style={styles.quickAlertButton} onPress={triggerDirectSOS} disabled={loading}>
          <Text style={styles.quickAlertText}>QUICK SOS ALERT</Text>
        </TouchableOpacity>

        <SOSButton label="FIRE EMERGENCY" icon="F" color="#ef4444" onPress={() => submitSOS('FIRE')} disabled={loading} />
        <SOSButton label="MEDICAL ASSISTANCE" icon="M" color="#f59e0b" onPress={() => submitSOS('MEDICAL')} disabled={loading} />
        <SOSButton label="SECURITY THREAT" icon="S" color="#2563eb" onPress={() => submitSOS('SECURITY')} disabled={loading} />
        <SOSButton label="OTHER EMERGENCY" icon="!" color="#8b5cf6" onPress={() => setCustomModalVisible(true)} disabled={loading} />

        {loading ? <ActivityIndicator size="large" color="#ef4444" style={styles.loader} /> : null}

        {recentLoading ? (
          <View style={styles.recentLoading}>
            <ActivityIndicator size="small" color="#ef4444" />
            <Text style={styles.recentLoadingText}>Loading SOS alerts...</Text>
          </View>
        ) : null}

        {recentError ? (
          <View style={styles.recentNotice}>
            <Text style={styles.recentNoticeText}>{recentError}</Text>
          </View>
        ) : null}

        {activeSOS.length > 0 ? (
          <View style={styles.activeBanner}>
            <Text style={styles.activeBannerTitle}>Active Emergency Alerts ({activeSOS.length})</Text>
            <Text style={styles.activeBannerText}>This banner auto-clears when all active alerts are resolved.</Text>
          </View>
        ) : null}

        {!recentLoading && allSOS.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No SOS history yet</Text>
            <Text style={styles.emptyText}>Emergency alerts will appear here when reported.</Text>
          </View>
        ) : null}

        {allSOS.length > 0 ? (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>SOS History</Text>
            {allSOS.map((alertItem) => {
              const isActive = normalizeStatus(alertItem?.status) === 'active';
              return (
                <View key={alertItem.id} style={styles.historyItem}>
                  <View
                    style={[
                      styles.historyDot,
                      {
                        backgroundColor:
                          alertItem?.type === 'FIRE'
                            ? '#ef4444'
                            : alertItem?.type === 'MEDICAL'
                              ? '#f59e0b'
                              : '#2563eb',
                      },
                    ]}
                  />
                  <View style={styles.historyCopy}>
                    <Text style={styles.historyText}>
                      {alertItem?.type?.toUpperCase?.() || 'UNKNOWN'}: {alertItem?.senderName || alertItem?.userName || 'Unknown User'}
                    </Text>
                    <Text style={styles.historyTime}>{formatTime(alertItem?.timestamp)}</Text>
                  </View>
                  <View style={[styles.statusPill, isActive ? styles.statusPillActive : styles.statusPillResolved]}>
                    <Text style={[styles.statusPillText, isActive ? styles.statusPillTextActive : styles.statusPillTextResolved]}>
                      {isActive ? 'Active' : 'Resolved'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={customModalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Specify Emergency</Text>
            <TextInput style={styles.input} placeholder="Nature of emergency (e.g. Gas Leak)" value={customTitle} onChangeText={setCustomTitle} />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Details / Flat Number"
              value={customDesc}
              onChangeText={setCustomDesc}
              multiline
            />
            <View style={styles.row}>
              <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setCustomModalVisible(false)}>
                <Text style={styles.btnLabel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.sendBtn]}
                onPress={() => submitSOS('CUSTOM', { title: customTitle, description: customDesc })}
              >
                <Text style={styles.sendBtnLabel}>Send SOS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

class SOSErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('SOSScreen crash:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.errorFallback}>
            <Text style={styles.errorTitle}>Something went wrong.</Text>
            <Text style={styles.errorText}>Please reload.</Text>
          </View>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

export default function SOSScreen({ goBack }) {
  return (
    <SOSErrorBoundary>
      <SOSScreenInner goBack={goBack} />
    </SOSErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 20 },
  warningBox: { backgroundColor: '#fee2e2', padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#fecaca' },
  warningTitle: { color: '#b91c1c', fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  warningText: { color: '#991b1b', fontSize: 14, lineHeight: 20 },
  quickAlertButton: { backgroundColor: '#ef4444', padding: 20, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
  quickAlertText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  sosCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 6, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  btnSymbol: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  btnContent: { flex: 1 },
  btnText: { fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  btnSubtext: { fontSize: 13, color: '#64748b', marginTop: 2 },
  chevron: { fontSize: 20, color: '#CBD5E1' },
  disabledBtn: { opacity: 0.6 },
  loader: { marginTop: 20 },
  activeBanner: { marginTop: 20, borderWidth: 1, borderColor: '#fca5a5', backgroundColor: '#fee2e2', borderRadius: 12, padding: 12 },
  activeBannerTitle: { fontWeight: '800', color: '#b91c1c', marginBottom: 4 },
  activeBannerText: { color: '#991b1b', fontSize: 13, fontWeight: '600' },
  historySection: { marginTop: 24 },
  historyTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
  historyItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#fff', padding: 12, borderRadius: 12 },
  historyDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  historyCopy: { flex: 1 },
  historyText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  historyTime: { fontSize: 12, color: '#64748b' },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusPillActive: { backgroundColor: '#fee2e2' },
  statusPillResolved: { backgroundColor: '#dcfce7' },
  statusPillText: { fontSize: 11, fontWeight: '800' },
  statusPillTextActive: { color: '#ef4444' },
  statusPillTextResolved: { color: '#16a34a' },
  recentLoading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 },
  recentLoadingText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  recentNotice: { backgroundColor: '#fff7ed', borderRadius: 12, padding: 12, marginTop: 16, borderWidth: 1, borderColor: '#fed7aa' },
  recentNoticeText: { color: '#9a3412', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  emptyState: { alignItems: 'center', marginTop: 24, padding: 16, backgroundColor: '#fff1f2', borderRadius: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#ef4444', marginBottom: 4 },
  emptyText: { fontSize: 13, color: '#64748b', textAlign: 'center' },
  errorFallback: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorTitle: { fontSize: 18, fontWeight: '800', color: '#ef4444', marginBottom: 6 },
  errorText: { fontSize: 14, color: '#64748b', textAlign: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
  input: { backgroundColor: '#f1f5f9', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16 },
  textArea: { height: 100 },
  row: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#e2e8f0' },
  sendBtn: { backgroundColor: '#ef4444' },
  btnLabel: { fontWeight: 'bold', fontSize: 16, color: '#1e293b' },
  sendBtnLabel: { fontWeight: 'bold', fontSize: 16, color: '#fff' },
});
