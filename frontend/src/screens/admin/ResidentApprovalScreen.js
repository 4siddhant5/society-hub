import React, { useMemo, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import AppCard from '../../components/ui/AppCard';
import AppButton from '../../components/ui/AppButton';
import SectionHeader from '../../components/ui/SectionHeader';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import { FiUsers, FiSearch, FiShield } from 'react-icons/fi';

const formatFlatLabel = (item) => {
  const parts = [];
  if (item.flat) parts.push(`Flat ${item.flat}`);
  if (item.wing) parts.push(`Wing ${item.wing}`);
  return parts.join(' | ') || 'Flat not assigned';
};

const ResidentApprovalScreen = ({
  pendingResidents = [],
  residents = [],
  adminRequests = [],
  adminRequestFeedback = '',
  adminRequestSubmittingId = null,
  handleApprove,
  handleReject,
  onSendAdminRequest,
  loading = false,
}) => {
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');

  const filteredResidents = useMemo(() => {
    const value = search.trim().toLowerCase();
    const list = residents
      .filter((item) => item.role !== 'super_admin' && item.status !== 'deleted')
      .sort((a, b) => String(a.name || a.email || '').localeCompare(String(b.name || b.email || '')));

    if (!value) {
      return list;
    }

    return list.filter((item) => {
      const haystack = `${item.name || ''} ${item.email || ''} ${item.flat || ''} ${item.wing || ''}`.toLowerCase();
      return haystack.includes(value);
    });
  }, [residents, search]);

  const latestRequestByUser = useMemo(() => {
    const map = {};
    adminRequests.forEach((item) => {
      if (!map[item.userId] || (item.createdAt || 0) > (map[item.userId].createdAt || 0)) {
        map[item.userId] = item;
      }
    });
    return map;
  }, [adminRequests]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f8fafc' }]} contentContainerStyle={styles.content}>
      <SectionHeader title="Pending Approvals" subtitle="Review and act on resident requests first" />
      <View style={styles.sectionBody}>
        {loading ? (
          <AppCard style={[styles.loadingCard, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }]}>
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={[styles.loadingText, { color: isDark ? '#cbd5e1' : '#64748b' }]}>Loading approval queue...</Text>
          </AppCard>
        ) : pendingResidents.length ? (
          pendingResidents.map((item) => (
            <AppCard key={item.id} style={[styles.pendingCard, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff', borderColor: isDark ? '#334155' : '#dbeafe' }]}>
              <View style={styles.pendingInfo}>
                <View style={styles.pendingHeader}>
                  <Text style={[styles.name, { color: isDark ? '#ffffff' : '#0f172a' }]}>{item.name || 'Resident'}</Text>
                  <StatusBadge status={item.status || 'pending'} />
                </View>
                <Text style={[styles.meta, { color: isDark ? '#cbd5e1' : '#475569' }]}>{item.email || 'No email available'}</Text>
                <Text style={[styles.flatText, { color: isDark ? '#94a3b8' : '#64748b' }]}>{formatFlatLabel(item)}</Text>
              </View>
              <View style={styles.pendingActions}>
                <AppButton title="Approve" onPress={() => handleApprove(item.id)} type="success" style={styles.actionButton} textStyle={styles.actionButtonText} />
                <AppButton title="Reject" onPress={() => handleReject(item.id)} type="danger" style={styles.actionButton} textStyle={styles.actionButtonText} />
              </View>
            </AppCard>
          ))
        ) : (
          <AppCard style={[styles.emptyCard, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }]}>
            <EmptyState message="No pending approvals right now." icon={FiUsers} />
          </AppCard>
        )}
      </View>

      <SectionHeader title="All Residents" subtitle="Track current status and send admin-role requests contextually" />
      <View style={styles.sectionBody}>
        <AppCard style={[styles.directoryCard, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }]}>
          <View style={[styles.searchBox, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
            <FiSearch size={16} color={isDark ? '#94a3b8' : '#64748b'} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name, email, flat or wing"
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              style={[styles.searchInput, { color: isDark ? '#ffffff' : '#0f172a' }]}
            />
          </View>

          {adminRequestFeedback ? (
            <View style={[styles.feedbackBanner, { backgroundColor: isDark ? '#0f3b2e' : '#ecfdf5', borderColor: isDark ? '#166534' : '#bbf7d0' }]}>
              <FiShield size={16} color="#16a34a" />
              <Text style={[styles.feedbackText, { color: isDark ? '#dcfce7' : '#166534' }]}>{adminRequestFeedback}</Text>
            </View>
          ) : null}

          {filteredResidents.length ? (
            filteredResidents.map((item) => {
              const request = latestRequestByUser[item.id];
              const requestStatus = request?.status || null;
              const canPromote = item.role !== 'admin' && item.role !== 'super_admin' && item.status === 'approved';
              const requestLabel = requestStatus
                ? `Status: ${String(requestStatus).charAt(0).toUpperCase()}${String(requestStatus).slice(1)}`
                : 'No request sent';

              return (
                <View key={item.id} style={[styles.residentRow, { borderBottomColor: isDark ? '#334155' : '#e2e8f0' }]}>
                  <View style={styles.residentInfo}>
                    <View style={styles.residentHeader}>
                      <Text style={[styles.name, { color: isDark ? '#ffffff' : '#0f172a' }]}>{item.name || 'Resident'}</Text>
                      <StatusBadge status={item.status || 'pending'} />
                    </View>
                    <Text style={[styles.meta, { color: isDark ? '#cbd5e1' : '#475569' }]}>{item.email || 'No email available'}</Text>
                    <Text style={[styles.flatText, { color: isDark ? '#94a3b8' : '#64748b' }]}>{formatFlatLabel(item)}</Text>
                    <Text style={[styles.requestStatus, { color: requestStatus === 'rejected' ? '#dc2626' : requestStatus === 'approved' ? '#16a34a' : '#2563eb' }]}>
                      {request ? `Request sent for: ${request.userName || item.name || item.email || 'Resident'} | ${requestLabel}` : requestLabel}
                    </Text>
                  </View>

                  <View style={styles.rowActions}>
                    {canPromote ? (
                      <AppButton
                        title={adminRequestSubmittingId === item.id ? 'Sending...' : requestStatus === 'pending' ? 'Pending' : 'Promote to Admin'}
                        onPress={() => onSendAdminRequest(item)}
                        loading={adminRequestSubmittingId === item.id}
                        type={requestStatus === 'approved' ? 'secondary' : 'primary'}
                        style={styles.promoteButton}
                        textStyle={styles.promoteButtonText}
                      />
                    ) : (
                      <View style={[styles.rolePill, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]}>
                        <Text style={[styles.rolePillText, { color: isDark ? '#cbd5e1' : '#475569' }]}>{item.role === 'admin' ? 'Already Admin' : 'Approval Required'}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <EmptyState message="No residents match your search." icon={FiUsers} />
          )}
        </AppCard>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 28 },
  sectionBody: { paddingHorizontal: 16 },
  loadingCard: { alignItems: 'center', paddingVertical: 28 },
  loadingText: { marginTop: 12, fontSize: 14, fontWeight: '600' },
  pendingCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
  },
  pendingInfo: { marginBottom: 16 },
  pendingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  name: { fontSize: 16, fontWeight: '800' },
  meta: { fontSize: 13, marginTop: 8 },
  flatText: { fontSize: 13, marginTop: 4 },
  pendingActions: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, minHeight: 42 },
  actionButtonText: { fontSize: 14, fontWeight: '700' },
  emptyCard: { paddingVertical: 8 },
  directoryCard: { borderRadius: 22 },
  searchBox: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, paddingVertical: 0 },
  feedbackBanner: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  feedbackText: { marginLeft: 10, fontSize: 13, fontWeight: '700', flex: 1 },
  residentRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  residentInfo: { flex: 1 },
  residentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  requestStatus: { marginTop: 10, fontSize: 12, fontWeight: '700', lineHeight: 18 },
  rowActions: { width: 148, alignItems: 'flex-end' },
  promoteButton: { minWidth: 136, minHeight: 42 },
  promoteButtonText: { fontSize: 13, fontWeight: '700' },
  rolePill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10 },
  rolePillText: { fontSize: 12, fontWeight: '700' },
});

export default ResidentApprovalScreen;
