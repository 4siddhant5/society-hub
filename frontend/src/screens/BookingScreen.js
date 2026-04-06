import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { addDoc, collection, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';

const TABS = [
  { key: 'create', label: '✦ Book', icon: '🏟️' },
  { key: 'public', label: '👁 Public', icon: '📋' },
  { key: 'mine', label: '📌 Mine', icon: '🗂️' },
];

const FACILITIES = ['Gym', 'Community Hall', 'Swimming Pool'];
const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening', 'Night'];

const FACILITY_META = {
  Gym: { icon: '🏋️', color: '#7c3aed', accent: 'rgba(124,58,237,0.12)' },
  'Community Hall': { icon: '🏛️', color: '#0891b2', accent: 'rgba(8,145,178,0.12)' },
  'Swimming Pool': { icon: '🏊', color: '#0284c7', accent: 'rgba(2,132,199,0.12)' },
};

const SLOT_META = {
  Morning: { icon: '🌅', color: '#d97706' },
  Afternoon: { icon: '☀️', color: '#ea580c' },
  Evening: { icon: '🌆', color: '#7c3aed' },
  Night: { icon: '🌙', color: '#1d4ed8' },
};

const STATUS_META = {
  pending: { bg: '#fef3c7', text: '#92400e', label: 'Pending' },
  approved: { bg: '#dcfce7', text: '#166534', label: 'Approved' },
  rejected: { bg: '#fee2e2', text: '#991b1b', label: 'Rejected' },
};

const getFlatNumber = (userData) =>
  userData?.flatNumber ||
  userData?.flatNo ||
  userData?.flat ||
  userData?.apartmentNumber ||
  'N/A';

const normalizeBooking = (docSnap) => ({
  id: docSnap.id,
  ...docSnap.data(),
});

const sortByCreatedAtDesc = (list) =>
  [...list].sort((a, b) => {
    const aTime = typeof a.createdAt === 'number' ? a.createdAt : 0;
    const bTime = typeof b.createdAt === 'number' ? b.createdAt : 0;
    return bTime - aTime;
  });

const getStatusStyle = (status) => {
  switch (status) {
    case 'approved':
      return styles.statusApproved;
    case 'rejected':
      return styles.statusRejected;
    case 'pending':
    default:
      return styles.statusPending;
  }
};

const BookingCard = ({ item, isDark, showBookedBy, showRejectionReason, isCompact }) => {
  const status = STATUS_META[item.status] || STATUS_META.pending;
  const textColor = isDark ? '#ffffff' : '#1e293b';
  const subTextColor = isDark ? '#cbd5e1' : '#64748b';
  const facilityMeta = FACILITY_META[item.facility] || { icon: '🏢', color: '#2563eb', accent: 'rgba(37,99,235,0.1)' };
  const slotMeta = SLOT_META[item.timeSlot] || { icon: '⏰', color: '#64748b' };
  const metaItems = [
    { label: '📅 Date', value: item.date || 'N/A' },
    { label: `${slotMeta.icon} Time`, value: item.timeSlot || 'N/A' },
    { label: '🏠 Flat', value: item.flatNumber || 'N/A' },
  ];

  return (
    <Pressable
      style={({ hovered }) => [
        styles.bookingCard,
        isDark && styles.bookingCardDark,
        hovered && styles.bookingCardHovered,
      ]}
    >
      {/* Colored top accent bar */}
      <View style={[styles.cardAccentBar, { backgroundColor: facilityMeta.color }]} />

      <View style={[styles.cardInner]}>
        <View style={styles.cardHeader}>
          <View style={[styles.facilityIconBadge, { backgroundColor: facilityMeta.accent }]}>
            <Text style={styles.facilityIcon}>{facilityMeta.icon}</Text>
          </View>
          <Text style={[styles.cardTitle, { color: textColor }]}>{item.facility}</Text>
          <View style={[styles.status, getStatusStyle(item.status)]}>
            <Text style={styles.statusText}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.bookingInfo}>
          <Text style={[styles.userInfo, { color: subTextColor }]}>
            {showBookedBy
              ? `👤 Booked by ${item.userName || 'Resident'}`
              : `🏠 Flat ${item.flatNumber || 'N/A'}`}
          </Text>
        </View>

        <View style={[styles.metaGrid, isCompact && styles.metaGridCompact]}>
          {metaItems.map((meta) => (
            <View key={meta.label} style={[styles.metaItem, isCompact && styles.metaItemCompact]}>
              <Text style={[styles.metaLabel, { color: subTextColor }]}>{meta.label}</Text>
              <Text style={[styles.metaValue, { color: textColor }]}>{meta.value}</Text>
            </View>
          ))}
        </View>

        {showRejectionReason && item.status === 'rejected' && !!item.rejectionReason && (
          <View style={styles.reasonBox}>
            <Text style={styles.reasonText}>⚠️ Reason: {item.rejectionReason}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};

export default function BookingScreen({ goBack, initialTab = 'create' }) {
  const { user, userData } = useAuth();
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isCompact = width <= 768;

  const [activeTab, setActiveTab] = useState(initialTab);
  const [facility, setFacility] = useState('Gym');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [approvedBookings, setApprovedBookings] = useState([]);
  const [myBookings, setMyBookings] = useState([]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!userData?.societyId) return undefined;

    const approvedQuery = query(
      collection(db, 'bookings', userData.societyId, 'entries'),
      where('status', '==', 'approved')
    );

    const unsubscribeApproved = onSnapshot(approvedQuery, (snapshot) => {
      setApprovedBookings(sortByCreatedAtDesc(snapshot.docs.map(normalizeBooking)));
    });

    let unsubscribeMine = () => {};
    if (user?.uid) {
      const mineQuery = query(
        collection(db, 'bookings', userData.societyId, 'entries'),
        where('userId', '==', user.uid)
      );

      unsubscribeMine = onSnapshot(mineQuery, (snapshot) => {
        setMyBookings(sortByCreatedAtDesc(snapshot.docs.map(normalizeBooking)));
      });
    } else {
      setMyBookings([]);
    }

    return () => {
      unsubscribeApproved();
      unsubscribeMine();
    };
  }, [user?.uid, userData?.societyId]);

  const publicEmptyMessage = useMemo(
    () => (approvedBookings.length === 0 ? 'No approved bookings yet.' : null),
    [approvedBookings.length]
  );

  const myEmptyMessage = useMemo(
    () => (myBookings.length === 0 ? 'No personal bookings yet.' : null),
    [myBookings.length]
  );

  const tabCounts = useMemo(
    () => ({
      public: approvedBookings.length,
      mine: myBookings.length,
    }),
    [approvedBookings.length, myBookings.length]
  );

  const handleSubmit = async () => {
    if (!facility || !date || !time) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (!user?.uid || !userData?.societyId) {
      Alert.alert('Error', 'User details not found');
      return;
    }

    setLoading(true);
    try {
      const bookingCollection = collection(db, 'bookings', userData.societyId, 'entries');
      const conflictQuery = query(
        bookingCollection,
        where('facility', '==', facility),
        where('date', '==', date),
        where('timeSlot', '==', time)
      );

      const conflictSnapshot = await getDocs(conflictQuery);
      const hasConflict = conflictSnapshot.docs.some((docSnap) => {
        const status = docSnap.data()?.status;
        return status === 'approved' || status === 'pending';
      });

      if (hasConflict) {
        Alert.alert('Booking Unavailable', 'Slot already booked or pending approval');
        return;
      }

      const payload = {
        id: '',
        userId: user.uid,
        userName: userData?.name || userData?.fullName || 'Resident',
        flatNumber: getFlatNumber(userData),
        facility,
        date,
        timeSlot: time,
        status: 'pending',
        rejectionReason: '',
        createdAt: Date.now(),
        timestamp: serverTimestamp(),
      };

      const bookingRef = await addDoc(bookingCollection, payload);
      await updateDoc(bookingRef, { id: bookingRef.id });

      Alert.alert('Success', 'Booking request submitted for approval');
      setDate('');
      setTime('');
      setFacility('Gym');
      setActiveTab('mine');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const bg = isDark ? '#121212' : '#f8fafc';
  const textColor = isDark ? '#ffffff' : '#1e293b';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#e2e8f0';
  const subTextColor = isDark ? '#cbd5e1' : '#64748b';

  const renderCreateTab = () => (
    <View style={[styles.formCard, { backgroundColor: cardBg, borderColor }]}>
      {/* Section: Facility */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>🏟️</Text>
        <Text style={[styles.label, { color: textColor, marginBottom: 0, marginTop: 0 }]}>Choose Facility</Text>
      </View>
      <View style={styles.buttonGroup}>
        {FACILITIES.map((item) => {
          const fm = FACILITY_META[item];
          const isSelected = facility === item;
          return (
            <TouchableOpacity
              key={item}
              style={[
                styles.optionBtn,
                { borderColor: isSelected ? fm.color : borderColor },
                isSelected && { backgroundColor: fm.color, borderColor: fm.color },
              ]}
              onPress={() => setFacility(item)}
            >
              <Text style={{ fontSize: 16 }}>{fm.icon}</Text>
              <Text
                style={{
                  color: isSelected ? '#fff' : textColor,
                  fontWeight: isSelected ? '700' : '500',
                  fontSize: 13,
                }}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Section: Date */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>📅</Text>
        <Text style={[styles.label, { color: textColor, marginBottom: 0, marginTop: 0 }]}>Select Date</Text>
      </View>
      {Platform.OS === 'web' ? (
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            padding: '12px 14px',
            borderRadius: 10,
            border: `1.5px solid ${borderColor}`,
            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
            color: textColor,
            marginBottom: 20,
            marginTop: 8,
            width: '100%',
            boxSizing: 'border-box',
            fontSize: 15,
            fontFamily: 'inherit',
            outline: 'none',
            cursor: 'pointer',
          }}
        />
      ) : (
        <TextInput
          style={[styles.textInput, { color: textColor, borderColor, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#94a3b8"
        />
      )}

      {/* Section: Time Slot */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>⏰</Text>
        <Text style={[styles.label, { color: textColor, marginBottom: 0, marginTop: 0 }]}>Time Slot</Text>
      </View>
      <View style={styles.buttonGroup}>
        {TIME_SLOTS.map((slot) => {
          const sm = SLOT_META[slot];
          const isSelected = time === slot;
          return (
            <TouchableOpacity
              key={slot}
              style={[
                styles.optionBtn,
                { borderColor: isSelected ? sm.color : borderColor },
                isSelected && { backgroundColor: sm.color, borderColor: sm.color },
              ]}
              onPress={() => setTime(slot)}
            >
              <Text style={{ fontSize: 16 }}>{sm.icon}</Text>
              <Text
                style={{
                  color: isSelected ? '#fff' : textColor,
                  fontWeight: isSelected ? '700' : '500',
                  fontSize: 13,
                }}
              >
                {slot}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.helperContainer}>
        <Text style={styles.helperIcon}>ℹ️</Text>
        <Text style={[styles.helperText, { color: subTextColor, flex: 1 }]}>
          Requests are saved as pending until an admin approves them.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitText}>{loading ? '⏳ Submitting...' : '🚀 Submit Booking'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderList = (data, emptyMessage, options = {}) => (
    <View style={[styles.bookingList, isCompact && styles.bookingListCompact]}>
      {data.length === 0 ? (
        <View style={[styles.emptyContainer, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={[styles.emptyText, { color: subTextColor }]}>{emptyMessage}</Text>
        </View>
      ) : (
        data.map((item) => (
          <BookingCard
            key={item.id}
            item={item}
            isDark={isDark}
            isCompact={isCompact}
            showBookedBy={!!options.showBookedBy}
            showRejectionReason={!!options.showRejectionReason}
          />
        ))
      )}
    </View>
  );

  return (
    <View style={[styles.bookingPage, { backgroundColor: bg }]}>
      {/* Premium Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <View style={styles.headerLeft}>
          {goBack && (
            <TouchableOpacity onPress={goBack} style={styles.backBtn}>
              <Text style={styles.backText}>‹ Back</Text>
            </TouchableOpacity>
          )}
          <View>
            <Text style={[styles.headerTitle, { color: textColor }]}>🏟️ Bookings</Text>
            <Text style={[styles.headerSubtitle, { color: subTextColor }]}>Manage facility reservations</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.bookingScroll}
        contentContainerStyle={styles.bookingScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.filters}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = tabCounts[tab.key];

            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterBtn, isActive && styles.filterBtnActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.filterBtnText, isActive && styles.filterBtnTextActive]}>
                  {tab.label}
                </Text>
                {typeof count === 'number' && (
                  <View style={[styles.filterCount, !isActive && styles.filterCountInactive]}>
                    <Text style={[styles.filterCountText, !isActive && styles.filterCountTextInactive]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {activeTab === 'create' && renderCreateTab()}
        {activeTab === 'public' && renderList(approvedBookings, publicEmptyMessage, { showBookedBy: true })}
        {activeTab === 'mine' && renderList(myBookings, myEmptyMessage, { showRejectionReason: true })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bookingPage: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    flex: 1,
    minHeight: 0,
  },

  // ─── Header ───────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(135deg, rgba(37,99,235,0.04) 0%, rgba(59,130,246,0.02) 100%)',
      },
      default: {},
    }),
  },
  headerDark: {
    borderBottomColor: '#1e293b',
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(30,41,59,0.3) 100%)',
      },
      default: {},
    }),
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    marginRight: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(37,99,235,0.08)',
  },
  backText: { color: '#2563eb', fontSize: 15, fontWeight: '700' },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 12, marginTop: 2, fontWeight: '500' },

  // ─── Scroll ───────────────────────────────────────────────────────────────
  bookingScroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    ...Platform.select({
      web: {
        overflowY: 'auto',
        overflowX: 'hidden',
      },
      default: {},
    }),
  },
  bookingScrollContent: {
    paddingBottom: 32,
  },

  // ─── Filter Tabs ──────────────────────────────────────────────────────────
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transitionDuration: '200ms',
        transitionProperty: 'all',
        transitionTimingFunction: 'ease',
      },
      default: {},
    }),
  },
  filterBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#1d4ed8',
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
        boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
      },
      default: {
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
      },
    }),
  },
  filterBtnText: { fontSize: 13, color: '#475569', fontWeight: '700' },
  filterBtnTextActive: { color: '#fff' },
  filterCount: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    minWidth: 22,
    alignItems: 'center',
  },
  filterCountInactive: {
    backgroundColor: '#dbeafe',
  },
  filterCountText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  filterCountTextInactive: {
    color: '#2563eb',
  },

  // ─── Form Card ────────────────────────────────────────────────────────────
  formCard: {
    padding: 22,
    borderRadius: 20,
    borderWidth: 1.5,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 3,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 12,
  },
  sectionIcon: { fontSize: 18 },
  label: { fontSize: 15, fontWeight: '700', marginBottom: 10, marginTop: 10 },
  buttonGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderRadius: 12,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transitionDuration: '150ms',
        transitionProperty: 'all',
      },
      default: {},
    }),
  },
  optionSelected: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  textInput: {
    padding: 13,
    borderWidth: 1.5,
    borderRadius: 12,
    marginBottom: 8,
    marginTop: 8,
    fontSize: 15,
  },
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 12,
    marginBottom: 4,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(37,99,235,0.06)',
  },
  helperIcon: { fontSize: 14 },
  helperText: { fontSize: 13, lineHeight: 18 },
  submitBtn: {
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#16a34a',
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(135deg, #16a34a, #22c55e)',
        boxShadow: '0 4px 16px rgba(22,163,74,0.35)',
        cursor: 'pointer',
        transitionDuration: '200ms',
        transitionProperty: 'all',
      },
      default: {
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 5,
      },
    }),
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitText: { color: 'white', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },

  // ─── Booking List / Grid ──────────────────────────────────────────────────
  bookingList: {
    width: '100%',
    gap: 18,
    ...Platform.select({
      web: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      },
      default: {
        flexDirection: 'row',
        flexWrap: 'wrap',
      },
    }),
  },
  bookingListCompact: {
    ...Platform.select({
      web: {
        gridTemplateColumns: '1fr',
      },
      default: {},
    }),
  },

  // ─── Booking Card ─────────────────────────────────────────────────────────
  bookingCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        transitionDuration: '250ms',
        transitionProperty: 'all',
        transitionTimingFunction: 'ease',
        boxShadow: '0 8px 24px rgba(0,0,0,0.07)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.07,
        shadowRadius: 24,
        elevation: 4,
        width: '100%',
        marginBottom: 18,
      },
    }),
  },
  bookingCardDark: {
    backgroundColor: 'rgba(30,41,59,0.95)',
  },
  bookingCardHovered: {
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
    transform: [{ translateY: -4 }],
    ...Platform.select({
      web: {
        boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
      },
      default: {},
    }),
  },
  cardAccentBar: {
    height: 4,
    width: '100%',
  },
  cardInner: {
    padding: 18,
  },

  // ─── Card Header ──────────────────────────────────────────────────────────
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  facilityIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facilityIcon: { fontSize: 20 },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.2,
  },

  // ─── Status Badges ────────────────────────────────────────────────────────
  status: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusApproved: {
    backgroundColor: '#16a34a',
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(135deg, #22c55e, #16a34a)',
        boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
      },
      default: {},
    }),
  },
  statusRejected: {
    backgroundColor: '#dc2626',
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(135deg, #ef4444, #dc2626)',
        boxShadow: '0 2px 8px rgba(220,38,38,0.3)',
      },
      default: {},
    }),
  },
  statusPending: {
    backgroundColor: '#d97706',
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(135deg, #f59e0b, #d97706)',
        boxShadow: '0 2px 8px rgba(217,119,6,0.3)',
      },
      default: {},
    }),
  },
  statusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ─── Card Content ─────────────────────────────────────────────────────────
  bookingInfo: {
    marginTop: 10,
  },
  userInfo: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  metaGrid: {
    marginTop: 12,
    gap: 8,
    ...Platform.select({
      web: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
      },
      default: {
        flexDirection: 'row',
        flexWrap: 'wrap',
      },
    }),
  },
  metaGridCompact: {
    ...Platform.select({
      web: {
        gridTemplateColumns: '1fr',
      },
      default: {},
    }),
  },
  metaItem: {
    width: '48%',
    marginBottom: 4,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(100,116,139,0.06)',
  },
  metaItemCompact: {
    width: '100%',
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
  },

  // ─── Reason Box ───────────────────────────────────────────────────────────
  reasonBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff7ed',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  reasonText: {
    color: '#92400e',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },

  // ─── Empty State ──────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderRadius: 20,
    width: '100%',
    ...Platform.select({
      web: {
        gridColumn: '1 / -1',
      },
      default: {},
    }),
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
});
