import React, { memo, useMemo, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import AppCard from '../../components/ui/AppCard';
import SectionHeader from '../../components/ui/SectionHeader';
import EmptyState from '../../components/ui/EmptyState';
import {
  FiCheck,
  FiChevronDown,
  FiClock,
  FiFilter,
  FiSearch,
  FiShield,
  FiUser,
  FiUsers,
  FiX,
  FiXCircle,
} from 'react-icons/fi';

const formatFlatLabel = (item) => {
  const parts = [];
  if (item.flat) parts.push(`Flat ${item.flat}`);
  if (item.wing) parts.push(`Wing ${item.wing}`);
  return parts.join(' | ') || 'Flat not assigned';
};

const formatStatusLabel = (status) => {
  if (!status) return 'Unknown';
  return String(status)
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const getStatusTone = (status) => {
  const value = String(status || '').toLowerCase();
  if (value === 'approved' || value === 'success') {
    return { backgroundColor: '#dcfce7', textColor: '#166534', borderColor: '#bbf7d0', icon: 'OK' };
  }
  if (value === 'rejected' || value === 'danger') {
    return { backgroundColor: '#fee2e2', textColor: '#b91c1c', borderColor: '#fecaca', icon: 'X' };
  }
  if (value === 'pending' || value === 'warning' || value === 'in progress') {
    return { backgroundColor: '#fef3c7', textColor: '#a16207', borderColor: '#fde68a', icon: '...' };
  }
  return { backgroundColor: '#e2e8f0', textColor: '#475569', borderColor: '#cbd5e1', icon: '-' };
};

const getRequestTone = (status) => {
  const value = String(status || '').toLowerCase();
  if (value === 'approved') {
    return { backgroundColor: '#ecfeff', textColor: '#0f766e', borderColor: '#a5f3fc', icon: FiShield };
  }
  if (value === 'rejected') {
    return { backgroundColor: '#fef2f2', textColor: '#b91c1c', borderColor: '#fecaca', icon: FiXCircle };
  }
  if (value === 'pending') {
    return { backgroundColor: '#fffbeb', textColor: '#b45309', borderColor: '#fde68a', icon: FiClock };
  }
  return { backgroundColor: '#f8fafc', textColor: '#64748b', borderColor: '#e2e8f0', icon: FiShield };
};

const Avatar = ({ label, isDark }) => (
  <View style={[styles.avatar, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.16)' : '#dbeafe' }]}>
    <Text style={[styles.avatarText, { color: isDark ? '#bfdbfe' : '#1d4ed8' }]}>
      {String(label || 'R').trim().charAt(0).toUpperCase()}
    </Text>
  </View>
);

const StatusBadge = memo(({ status }) => {
  const tone = getStatusTone(status);

  return (
    <View style={[styles.badge, { backgroundColor: tone.backgroundColor, borderColor: tone.borderColor }]}>
      <Text style={[styles.badgeIcon, { color: tone.textColor }]}>{tone.icon}</Text>
      <Text style={[styles.badgeText, { color: tone.textColor }]}>{formatStatusLabel(status)}</Text>
    </View>
  );
});

const AdminRequestBadge = memo(({ status }) => {
  const tone = getRequestTone(status);
  const Icon = tone.icon;

  return (
    <View style={[styles.requestBadge, { backgroundColor: tone.backgroundColor, borderColor: tone.borderColor }]}>
      <Icon size={13} color={tone.textColor} />
      <Text style={[styles.requestBadgeText, { color: tone.textColor }]}>
        {status ? `Admin Request ${formatStatusLabel(status)}` : 'Admin Request Not Sent'}
      </Text>
    </View>
  );
});

const ActionButton = ({ title, type, onPress, style, textStyle, loading, icon: Icon }) => {
  const backgroundColor =
    type === 'success' ? '#16a34a' :
    type === 'danger' ? '#dc2626' :
    type === 'warning' ? '#f59e0b' :
    type === 'secondary' ? '#64748b' :
    '#2563eb';

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ hovered, focused, pressed }) => [
        styles.actionButton,
        style,
        { backgroundColor },
        hovered && styles.actionButtonHover,
        focused && styles.actionButtonFocus,
        pressed && styles.actionButtonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <View style={styles.actionButtonInner}>
          {Icon ? <Icon style={styles.actionButtonIcon} /> : null}
          <Text style={[styles.actionButtonText, textStyle]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
};

const HoverCard = ({ children, baseStyle, hoverStyle }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [baseStyle, hovered && hoverStyle, pressed && styles.pressedScale]}
    >
      {children}
    </Pressable>
  );
};

const ApprovalCard = memo(({ item, handleApprove, handleReject, isDark, isCompact }) => (
  <HoverCard
    baseStyle={styles.interactiveShell}
    hoverStyle={[
      styles.cardHover,
      {
        transform: [{ translateY: -2 }],
      },
    ]}
  >
    <AppCard
      style={[
        styles.approvalCard,
        {
          backgroundColor: isDark ? '#172033' : '#ffffff',
          borderColor: isDark ? '#334155' : '#dbeafe',
        },
      ]}
    >
      <View style={[styles.approvalTint, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.10)' : 'rgba(219, 234, 254, 0.85)' }]} />
      <View style={[styles.approvalCardInner, isCompact && styles.approvalCardInnerCompact]}>
        <View style={styles.personBlock}>
          <Avatar label={item.name || item.email} isDark={isDark} />
          <View style={styles.personText}>
            <View style={[styles.titleRow, isCompact && styles.titleRowCompact]}>
              <Text style={[styles.name, styles.nameStrong, { color: isDark ? '#f8fafc' : '#0f172a' }]} numberOfLines={1}>
                {item.name || 'Resident'}
              </Text>
              <StatusBadge status={item.status || 'pending'} />
            </View>
            <Text style={[styles.meta, { color: isDark ? '#cbd5e1' : '#475569' }]} numberOfLines={1}>
              {item.email || 'No email available'}
            </Text>
            <Text style={[styles.flatText, { color: isDark ? '#94a3b8' : '#64748b' }]}>{formatFlatLabel(item)}</Text>
          </View>
        </View>

        <View style={[styles.approvalActions, isCompact && styles.approvalActionsCompact]}>
          <ActionButton
            title="Approve"
            onPress={() => handleApprove(item.id)}
            type="success"
            icon={FiCheck}
            style={[styles.actionButton, styles.approveButton]}
            textStyle={styles.actionButtonText}
          />
          <ActionButton
            title="Reject"
            onPress={() => handleReject(item.id)}
            type="danger"
            icon={FiX}
            style={[styles.actionButton, styles.rejectButton]}
            textStyle={styles.actionButtonText}
          />
        </View>
      </View>
    </AppCard>
  </HoverCard>
));

const ResidentCard = ({
  item,
  requestStatus,
  adminRequestSubmittingId,
  onSendAdminRequest,
  isDark,
  isCompact,
}) => {
  const canPromote = item.role !== 'admin' && item.role !== 'super_admin' && item.status === 'approved';
  const isSubmitting = adminRequestSubmittingId === item.id;
  const promoteTitle = isSubmitting ? 'Sending...' : requestStatus === 'pending' ? 'Pending' : 'Promote to Admin';

  return (
    <HoverCard
      baseStyle={styles.interactiveShell}
      hoverStyle={[
        styles.cardHover,
        {
          borderColor: isDark ? '#2563eb' : '#bfdbfe',
          transform: [{ translateY: -3 }],
        },
      ]}
    >
      <AppCard
        style={[
          styles.residentCard,
          {
            backgroundColor: isDark ? '#111827' : '#ffffff',
            borderColor: isDark ? '#1f2937' : '#e2e8f0',
          },
        ]}
      >
        <View style={[styles.residentCardInner, isCompact && styles.residentCardInnerCompact]}>
          <View style={styles.personBlock}>
            <Avatar label={item.name || item.email} isDark={isDark} />
            <View style={styles.personText}>
              <View style={[styles.titleRow, isCompact && styles.titleRowCompact]}>
                <Text style={[styles.name, styles.nameStrong, { color: isDark ? '#f8fafc' : '#0f172a' }]} numberOfLines={1}>
                  {item.name || 'Resident'}
                </Text>
              </View>
              <Text style={[styles.meta, { color: isDark ? '#cbd5e1' : '#475569' }]} numberOfLines={1}>
                {item.email || 'No email available'}
              </Text>
              <Text style={[styles.flatText, { color: isDark ? '#94a3b8' : '#64748b' }]}>{formatFlatLabel(item)}</Text>
              <AdminRequestBadge status={requestStatus} />
            </View>
          </View>

          <View style={[styles.residentActions, isCompact && styles.residentActionsCompact]}>
            <View style={[styles.statusActionStack, isCompact && styles.statusActionStackCompact]}>
              <StatusBadge status={item.status || 'pending'} />
              {canPromote ? (
                <ActionButton
                  title={promoteTitle}
                  onPress={() => onSendAdminRequest(item)}
                  loading={isSubmitting}
                  type={requestStatus === 'approved' ? 'secondary' : 'primary'}
                  icon={FiShield}
                  style={styles.promoteButton}
                  textStyle={styles.promoteButtonText}
                />
              ) : (
                <View style={[styles.rolePill, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
                  <FiUser size={14} color={isDark ? '#cbd5e1' : '#475569'} />
                  <Text style={[styles.rolePillText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                    {item.role === 'admin' ? 'Already Admin' : 'Approval Required'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </AppCard>
    </HoverCard>
  );
};

const FilterSelect = ({ label, value, options, isDark, fullWidth }) => {
  const [visible, setVisible] = useState(false);
  const selected = options.find((option) => option.value === value) || options[0];

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setVisible(true)}
        style={[
          styles.filterSelect,
          fullWidth && styles.filterSelectFull,
          {
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderColor: isDark ? '#334155' : '#dbeafe',
          },
        ]}
      >
        <View style={styles.filterLabelRow}>
          <FiFilter size={14} color={isDark ? '#93c5fd' : '#2563eb'} />
          <Text style={[styles.filterLabel, { color: isDark ? '#93c5fd' : '#2563eb' }]}>{label}</Text>
        </View>
        <View style={styles.filterValueRow}>
          <Text style={[styles.filterValue, { color: isDark ? '#f8fafc' : '#0f172a' }]} numberOfLines={1}>
            {selected?.label || 'All'}
          </Text>
          <FiChevronDown size={16} color={isDark ? '#94a3b8' : '#64748b'} />
        </View>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setVisible(false)}>
          <Pressable
            style={[
              styles.filterModal,
              {
                backgroundColor: isDark ? '#111827' : '#ffffff',
                borderColor: isDark ? '#334155' : '#e2e8f0',
              },
            ]}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={[styles.filterModalTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{label}</Text>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.85}
                onPress={() => {
                  option.onSelect(option.value);
                  setVisible(false);
                }}
                style={[
                  styles.filterOption,
                  {
                    backgroundColor: option.value === value ? (isDark ? '#1d4ed8' : '#eff6ff') : 'transparent',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    { color: option.value === value ? (isDark ? '#dbeafe' : '#1d4ed8') : isDark ? '#e2e8f0' : '#334155' },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const FilterBar = ({
  search,
  setSearch,
  wing,
  setWing,
  status,
  setStatus,
  wingOptions,
  statusOptions,
  isDark,
  isCompact,
}) => {
  const mappedWingOptions = wingOptions.map((option) => ({ ...option, onSelect: setWing }));
  const mappedStatusOptions = statusOptions.map((option) => ({ ...option, onSelect: setStatus }));
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <View style={[styles.filterBar, !isCompact && styles.filterBarDesktop, isCompact && styles.filterBarCompact]}>
      <View
        style={[
          styles.searchBox,
          !isCompact && styles.searchBoxDesktop,
          isCompact && styles.searchBoxCompact,
          searchFocused && styles.searchBoxFocused,
          {
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderColor: searchFocused ? '#60a5fa' : isDark ? '#334155' : '#dbeafe',
          },
        ]}
      >
        <FiSearch size={18} color={isDark ? '#94a3b8' : '#64748b'} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Search by name, email, flat or wing"
          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
          style={[styles.searchInput, { color: isDark ? '#ffffff' : '#0f172a' }]}
        />
      </View>

      <View style={[styles.filterControls, isCompact && styles.filterControlsCompact]}>
        <FilterSelect label="Wing" value={wing} options={mappedWingOptions} isDark={isDark} fullWidth={isCompact} />
        <FilterSelect label="Status" value={status} options={mappedStatusOptions} isDark={isDark} fullWidth={isCompact} />
      </View>
    </View>
  );
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
  const { width } = useWindowDimensions();
  const isCompact = width < 820;

  const [search, setSearch] = useState('');
  const [selectedWing, setSelectedWing] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const residentBaseList = useMemo(
    () =>
      residents
        .filter((item) => item.role !== 'super_admin' && item.status !== 'deleted')
        .sort((a, b) => String(a.name || a.email || '').localeCompare(String(b.name || b.email || ''))),
    [residents]
  );

  const wingOptions = useMemo(() => {
    const wings = Array.from(new Set(residentBaseList.map((item) => String(item.wing || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    return [{ label: 'All Wings', value: 'all' }, ...wings.map((wing) => ({ label: `Wing ${wing}`, value: wing }))];
  }, [residentBaseList]);

  const statusOptions = useMemo(
    () => [
      { label: 'All Statuses', value: 'all' },
      { label: 'Approved', value: 'approved' },
      { label: 'Pending', value: 'pending' },
      { label: 'Rejected', value: 'rejected' },
    ],
    []
  );

  const filteredResidents = useMemo(() => {
    const value = search.trim().toLowerCase();

    return residentBaseList.filter((item) => {
      const haystack = `${item.name || ''} ${item.email || ''} ${item.flat || ''} ${item.wing || ''}`.toLowerCase();
      const matchesSearch = !value || haystack.includes(value);
      const matchesWing = selectedWing === 'all' || String(item.wing || '').trim() === selectedWing;
      const matchesStatus = selectedStatus === 'all' || String(item.status || '').toLowerCase() === selectedStatus;
      return matchesSearch && matchesWing && matchesStatus;
    });
  }, [residentBaseList, search, selectedWing, selectedStatus]);

  const latestRequestByUser = useMemo(() => {
    const map = {};
    adminRequests.forEach((item) => {
      if (!map[item.userId] || (item.createdAt || 0) > (map[item.userId].createdAt || 0)) {
        map[item.userId] = item;
      }
    });
    return map;
  }, [adminRequests]);

  const renderPendingSection = () => (
    <>
      <View style={styles.heroWrap}>
        <Text style={[styles.heroTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Residents</Text>
        <Text style={[styles.heroSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          Manage and approve residents in your society
        </Text>
      </View>
      <SectionHeader title="Pending Approvals" subtitle="Review new resident requests with a cleaner approval workflow" />
      <View style={styles.sectionBody}>
        <AppCard
          style={[
            styles.sectionPanel,
            {
              backgroundColor: isDark ? '#0f172a' : '#f8fbff',
              borderColor: isDark ? '#1e293b' : '#dbeafe',
            },
          ]}
        >
          <View style={[styles.sectionIntro, isCompact && styles.sectionIntroCompact]}>
            <View>
              <Text style={[styles.panelTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Approval Queue</Text>
              <Text style={[styles.panelSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                {loading ? 'Refreshing resident approvals...' : `${pendingResidents.length} resident${pendingResidents.length === 1 ? '' : 's'} waiting for review`}
              </Text>
            </View>
            <View style={[styles.queueBadge, { backgroundColor: isDark ? '#1e293b' : '#dbeafe' }]}>
              <Text style={[styles.queueBadgeText, { color: isDark ? '#bfdbfe' : '#1d4ed8' }]}>{pendingResidents.length}</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingPanel}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={[styles.loadingText, { color: isDark ? '#cbd5e1' : '#64748b' }]}>Loading approval queue...</Text>
            </View>
          ) : pendingResidents.length ? (
            pendingResidents.map((item) => (
              <ApprovalCard
                key={item.id}
                item={item}
                handleApprove={handleApprove}
                handleReject={handleReject}
                isDark={isDark}
                isCompact={isCompact}
              />
            ))
          ) : (
            <View style={[styles.inlineEmptyState, { backgroundColor: isDark ? '#111827' : '#ffffff', borderColor: isDark ? '#1f2937' : '#e2e8f0' }]}>
              <EmptyState message="No pending approvals right now." icon={FiUsers} />
            </View>
          )}
        </AppCard>
      </View>

      <SectionHeader title="Resident Directory" subtitle="Search, filter, and manage residents from one streamlined view" />
      <View style={styles.sectionBody}>
        <AppCard
          style={[
            styles.sectionPanel,
            styles.directoryPanel,
            {
              backgroundColor: isDark ? '#0f172a' : '#f8fbff',
              borderColor: isDark ? '#1e293b' : '#dbeafe',
            },
          ]}
        >
          <View style={[styles.sectionIntro, isCompact && styles.sectionIntroCompact]}>
            <View>
              <Text style={[styles.panelTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>All Residents</Text>
              <Text style={[styles.panelSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                {filteredResidents.length} result{filteredResidents.length === 1 ? '' : 's'} across your society
              </Text>
            </View>
            <View style={[styles.queueBadge, { backgroundColor: isDark ? '#1e293b' : '#dbeafe' }]}>
              <Text style={[styles.queueBadgeText, { color: isDark ? '#bfdbfe' : '#1d4ed8' }]}>{residentBaseList.length}</Text>
            </View>
          </View>

          <FilterBar
            search={search}
            setSearch={setSearch}
            wing={selectedWing}
            setWing={setSelectedWing}
            status={selectedStatus}
            setStatus={setSelectedStatus}
            wingOptions={wingOptions}
            statusOptions={statusOptions}
            isDark={isDark}
            isCompact={isCompact}
          />

          {adminRequestFeedback ? (
            <View style={[styles.feedbackBanner, { backgroundColor: isDark ? '#0f3b2e' : '#ecfdf5', borderColor: isDark ? '#166534' : '#bbf7d0' }]}>
              <FiShield size={16} color="#16a34a" />
              <Text style={[styles.feedbackText, { color: isDark ? '#dcfce7' : '#166534' }]}>{adminRequestFeedback}</Text>
            </View>
          ) : null}
        </AppCard>
      </View>
    </>
  );

  return (
    <FlatList
      data={filteredResidents}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.sectionBody}>
          <ResidentCard
            item={item}
            requestStatus={latestRequestByUser[item.id]?.status || null}
            adminRequestSubmittingId={adminRequestSubmittingId}
            onSendAdminRequest={onSendAdminRequest}
            isDark={isDark}
            isCompact={isCompact}
          />
        </View>
      )}
      ListHeaderComponent={renderPendingSection}
      ListEmptyComponent={
        <View style={styles.sectionBody}>
          <AppCard
            style={[
              styles.emptyResidentsCard,
              {
                backgroundColor: isDark ? '#111827' : '#ffffff',
                borderColor: isDark ? '#1f2937' : '#e2e8f0',
              },
            ]}
          >
              <EmptyState
              message={
                search || selectedWing !== 'all' || selectedStatus !== 'all'
                  ? 'No residents found'
                  : 'No residents found'
              }
              icon={FiUsers}
            />
          </AppCard>
        </View>
      }
      contentContainerStyle={[
        styles.content,
        filteredResidents.length === 0 && styles.emptyListContent,
        { backgroundColor: isDark ? '#020617' : '#f1f5f9' },
      ]}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={Platform.OS !== 'web'}
    />
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: 28,
  },
  heroWrap: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 6,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  emptyListContent: {
    flexGrow: 1,
  },
  sectionBody: {
    paddingHorizontal: 16,
  },
  sectionPanel: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 0,
  },
  directoryPanel: {
    marginBottom: 20,
  },
  sectionIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  sectionIntroCompact: {
    alignItems: 'flex-start',
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  panelSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  queueBadge: {
    minWidth: 46,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueBadgeText: {
    fontSize: 18,
    fontWeight: '800',
  },
  loadingPanel: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  inlineEmptyState: {
    borderWidth: 1,
    borderRadius: 18,
  },
  approvalCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
    padding: 20,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 8px 18px rgba(15,23,42,0.08)' },
      default: {
        shadowColor: '#0f172a',
        shadowOpacity: 0.08,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 2,
      },
    }),
  },
  approvalTint: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  approvalCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  approvalCardInnerCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  residentCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
    ...Platform.select({
      web: { boxShadow: '0 10px 16px rgba(15,23,42,0.06)' },
      default: {
        shadowColor: '#0f172a',
        shadowOpacity: 0.06,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 10 },
        elevation: 2,
      },
    }),
  },
  residentCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  residentCardInnerCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  personBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    minWidth: 0,
  },
  personText: {
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleRowCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
  },
  nameStrong: {
    fontSize: 18,
  },
  meta: {
    fontSize: 13,
    marginTop: 8,
    lineHeight: 19,
  },
  flatText: {
    fontSize: 13,
    marginTop: 5,
    lineHeight: 19,
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...Platform.select({
      web: { boxShadow: '0 3px 8px rgba(15,23,42,0.05)' },
      default: {
        shadowColor: '#0f172a',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      },
    }),
  },
  badgeIcon: {
    fontSize: 11,
    fontWeight: '900',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  requestBadge: {
    marginTop: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requestBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  interactiveShell: {
    borderRadius: 20,
  },
  cardHover: {
    ...Platform.select({
      web: { boxShadow: '0 12px 22px rgba(15,23,42,0.12)' },
      default: {
        shadowColor: '#0f172a',
        shadowOpacity: 0.12,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 12 },
        elevation: 3,
      },
    }),
  },
  pressedScale: {
    transform: [{ scale: 0.995 }],
  },
  approvalActions: {
    flexBasis: 220,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  approvalActionsCompact: {
    flexBasis: 'auto',
    width: '100%',
    flexDirection: 'column',
  },
  residentActions: {
    flexBasis: 220,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  residentActionsCompact: {
    flexBasis: 'auto',
    width: '100%',
    alignItems: 'stretch',
  },
  actionButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonIcon: {
    marginRight: 8,
    color: '#ffffff',
    fontSize: 18,
  },
  approveButton: {
    ...Platform.select({
      web: { boxShadow: '0 6px 12px rgba(22,163,74,0.18)' },
      default: {
        shadowColor: '#16a34a',
        shadowOpacity: 0.18,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
    }),
  },
  rejectButton: {
    ...Platform.select({
      web: { boxShadow: '0 6px 12px rgba(220,38,38,0.16)' },
      default: {
        shadowColor: '#dc2626',
        shadowOpacity: 0.16,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
    }),
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  actionButtonHover: {
    transform: [{ scale: 1.03 }],
    ...Platform.select({
      web: { boxShadow: '0 6px 16px rgba(0,0,0,0.24)' },
      default: { shadowOpacity: 0.24 },
    }),
  },
  actionButtonFocus: {
    ...Platform.select({
      web: { boxShadow: '0 0 14px rgba(147,197,253,0.22)' },
      default: {
        shadowColor: '#93c5fd',
        shadowOpacity: 0.22,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 0 },
      },
    }),
  },
  actionButtonPressed: {
    transform: [{ scale: 0.99 }],
  },
  promoteButton: {
    minHeight: 46,
    minWidth: 170,
    width: '100%',
  },
  promoteButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusActionStack: {
    width: '100%',
    alignItems: 'flex-end',
    gap: 10,
  },
  statusActionStackCompact: {
    alignItems: 'stretch',
  },
  rolePill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: 170,
    width: '100%',
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterBar: {
    gap: 14,
    marginBottom: 16,
  },
  filterBarDesktop: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  filterBarCompact: {
    gap: 12,
  },
  searchBox: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 8px 12px rgba(15,23,42,0.05)' },
      default: {
        shadowColor: '#0f172a',
        shadowOpacity: 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        elevation: 1,
      },
    }),
  },
  searchBoxDesktop: {
    flex: 1.35,
  },
  searchBoxCompact: {
    width: '100%',
  },
  searchBoxFocused: {
    ...Platform.select({
      web: { boxShadow: '0 0 14px rgba(96,165,250,0.18)' },
      default: {
        shadowColor: '#60a5fa',
        shadowOpacity: 0.18,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 0 },
        elevation: 2,
      },
    }),
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    paddingVertical: 0,
  },
  filterControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    flex: 1,
  },
  filterControlsCompact: {
    flexDirection: 'column',
  },
  filterSelect: {
    flex: 1,
    minWidth: 180,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  filterSelectFull: {
    width: '100%',
  },
  filterLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  filterValueRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  filterValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  filterModal: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  filterModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  filterOption: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 8,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  feedbackBanner: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackText: {
    marginLeft: 10,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    lineHeight: 18,
  },
  emptyResidentsCard: {
    borderRadius: 20,
    borderWidth: 1,
  },
});

export default ResidentApprovalScreen;
