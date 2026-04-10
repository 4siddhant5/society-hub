import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { addDoc, collection, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const TABS = [{ key: 'book', label: 'Book' }, { key: 'mine', label: 'My Bookings' }, { key: 'calendar', label: 'Calendar' }];
const DEFAULT_FACILITY = 'Gym';
const OTHER_FACILITY = 'Other';
const FACILITIES = ['Gym', 'Community Hall', 'Swimming Pool', 'Parking', 'Garden Area', OTHER_FACILITY];
const FACILITY_META = {
  Gym: { short: 'GY', color: '#2563eb', accent: 'rgba(37,99,235,0.12)' },
  'Community Hall': { short: 'CH', color: '#0f766e', accent: 'rgba(15,118,110,0.12)' },
  'Swimming Pool': { short: 'SP', color: '#0284c7', accent: 'rgba(2,132,199,0.12)' },
  Parking: { short: 'PK', color: '#ea580c', accent: 'rgba(234,88,12,0.12)' },
  'Garden Area': { short: 'GA', color: '#15803d', accent: 'rgba(21,128,61,0.12)' },
  Other: { short: '+', color: '#7c3aed', accent: 'rgba(124,58,237,0.12)' },
};
const STATUS_LABEL = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };
const LEGACY_SLOT_ORDER = { Morning: 480, Afternoon: 780, Evening: 1020, Night: 1260 };

const pad = (value) => String(value).padStart(2, '0');
const todayString = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const getFlatNumber = (u) => u?.flatNumber || u?.flatNo || u?.flat || u?.apartmentNumber || 'N/A';
const normalizeBooking = (docSnap) => ({ id: docSnap.id, ...docSnap.data() });
const normalizeTabKey = (v) => (v === 'create' ? 'book' : v === 'public' ? 'calendar' : v === 'mine' || v === 'calendar' || v === 'book' ? v : 'book');
const sortByCreatedAtDesc = (list) => [...list].sort((a, b) => (b?.createdAt || 0) - (a?.createdAt || 0));
const getDateValue = (value) => {
  if (!value) return 0;
  const iso = new Date(`${value}T00:00:00`).getTime();
  if (!Number.isNaN(iso)) return iso;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};
const formatDate = (value, options = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  const time = getDateValue(value);
  return time ? new Date(time).toLocaleDateString(undefined, options) : value || 'Upcoming';
};
const isTodayDate = (value) => getDateValue(value) === getDateValue(todayString());
const isUpcomingDate = (value) => getDateValue(value) > getDateValue(todayString());
const timeToMinutes = (value) => {
  const [h, m] = String(value || '').split(':').map(Number);
  return Number.isNaN(h) || Number.isNaN(m) ? NaN : h * 60 + m;
};
const timeToDate = (value) => {
  const d = new Date();
  const [h, m] = String(value || '09:00').split(':').map(Number);
  d.setHours(Number.isNaN(h) ? 9 : h, Number.isNaN(m) ? 0 : m, 0, 0);
  return d;
};
const dateToTime = (value) => `${pad(value.getHours())}:${pad(value.getMinutes())}`;
const displayTime = (value) => {
  const mins = timeToMinutes(value);
  if (Number.isNaN(mins)) return value || 'Select time';
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;
  return `${h12}:${pad(m)} ${suffix}`;
};
const parseDisplayMinutes = (value) => {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return NaN;
  const h = Number(match[1]);
  const m = Number(match[2]);
  const s = match[3].toUpperCase();
  const normalized = s === 'PM' && h !== 12 ? h + 12 : s === 'AM' && h === 12 ? 0 : h;
  return normalized * 60 + m;
};
const timeRangeLabel = (start, end) => `${displayTime(start)} - ${displayTime(end)}`;
const sortSlotValue = (slot) => {
  if (!slot) return Number.MAX_SAFE_INTEGER;
  if (LEGACY_SLOT_ORDER[slot]) return LEGACY_SLOT_ORDER[slot];
  const parsed = parseDisplayMinutes(String(slot).split(' - ')[0]);
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
};
const groupBookingsByDate = (bookings) => {
  const groups = bookings.reduce((acc, booking) => {
    const key = booking.date || 'Upcoming';
    if (!acc[key]) acc[key] = [];
    acc[key].push(booking);
    return acc;
  }, {});
  return Object.entries(groups)
    .sort((a, b) => getDateValue(a[0]) - getDateValue(b[0]))
    .map(([date, items]) => ({ date, items: items.sort((a, b) => sortSlotValue(a.timeSlot) - sortSlotValue(b.timeSlot)) }));
};
const facilityMeta = (facility) => FACILITY_META[facility] || {
  short: String(facility || 'BK').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'BK',
  color: '#4f46e5',
  accent: 'rgba(79,70,229,0.12)',
};

const OverviewStat = ({ label, value, tone }) => (
  <View style={[styles.stat, { backgroundColor: tone.bg, borderColor: tone.border }]}>
    <Text style={[styles.statValue, { color: tone.value }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: tone.label }]}>{label}</Text>
  </View>
);

const PickerField = ({ isDark, label, value, placeholder, mode, min, onWebChange, onPress, containerStyle }) => {
  const borderColor = isDark ? '#334155' : '#dbe4f0';
  const surface = isDark ? '#0f172a' : '#f8fafc';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const muted = isDark ? '#94a3b8' : '#64748b';
  return (
    <View style={[styles.field, containerStyle]}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      {Platform.OS === 'web' ? (
        <View style={[styles.webField, { borderColor, backgroundColor: surface }]}>
          <input
            type={mode}
            value={value}
            min={min}
            onChange={(e) => onWebChange(e.target.value)}
            style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', color: textColor, fontSize: 15, fontFamily: 'inherit', padding: 0 }}
          />
          <Text style={[styles.fieldHint, { color: value ? textColor : muted }]}>{value ? (mode === 'date' ? formatDate(value) : displayTime(value)) : placeholder}</Text>
        </View>
      ) : (
        <Pressable onPress={onPress} style={({ hovered, pressed }) => [styles.nativeField, { borderColor, backgroundColor: surface }, hovered && styles.hoverLift, pressed && styles.pressed]}>
          <Text style={[styles.nativeValue, { color: value ? textColor : muted }]}>{value ? (mode === 'date' ? formatDate(value) : displayTime(value)) : placeholder}</Text>
          <Text style={[styles.fieldHint, { color: muted }]}>{mode === 'date' ? 'Calendar' : 'Time picker'}</Text>
        </Pressable>
      )}
    </View>
  );
};

const BookingCard = ({ item, isDark, showBookedBy, showRejectionReason, compact, highlight }) => {
  const meta = facilityMeta(item.facility);
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subtle = isDark ? '#cbd5e1' : '#64748b';
  const flatLabel = `Flat ${item.flatNumber || 'N/A'}`;
  const bookedByLabel = `Booked by ${item.userName || 'Resident'}`;
  return (
    <Pressable style={({ hovered }) => [styles.card, isDark && styles.cardDark, highlight === 'today' && styles.cardToday, highlight === 'upcoming' && styles.cardUpcoming, hovered && styles.cardHover]}>
      <View style={[styles.cardBar, { backgroundColor: meta.color }]} />
      <View style={styles.cardBody}>
        <View style={[styles.cardHead, compact && styles.cardHeadCompact]}>
          <View style={styles.cardHeadLeft}>
            <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={2}>{item.facility}</Text>
          </View>
          <View style={[styles.status, styles[`status_${item.status || 'pending'}`]]}><Text style={styles.statusText}>{STATUS_LABEL[item.status] || STATUS_LABEL.pending}</Text></View>
        </View>
        <View style={[styles.cardMetaRow, compact && styles.cardMetaRowCompact]}>
          <Text style={[styles.cardMetaText, { color: subtle }]} numberOfLines={compact ? 2 : 1}>{formatDate(item.date, { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
          {!compact ? <Text style={[styles.cardMetaDivider, { color: subtle }]}>|</Text> : null}
          <Text style={[styles.cardMetaText, { color: subtle }]} numberOfLines={compact ? 2 : 1}>{item.timeSlot || 'N/A'}</Text>
          {!compact ? <Text style={[styles.cardMetaDivider, { color: subtle }]}>|</Text> : null}
          <Text style={[styles.cardMetaText, { color: subtle }]} numberOfLines={1}>{flatLabel}</Text>
        </View>
        {showBookedBy ? <Text style={[styles.cardAuxText, { color: subtle }]} numberOfLines={1}>{bookedByLabel}</Text> : null}
        {showRejectionReason && item.status === 'rejected' && !!item.rejectionReason ? (
          <View style={styles.reasonBox}><Text style={styles.reasonText}>Reason: {item.rejectionReason}</Text></View>
        ) : null}
      </View>
    </Pressable>
  );
};

export default function BookingScreen({ goBack, initialTab = 'create' }) {
  const { user, userData } = useAuth();
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width <= 768;
  const today = useMemo(() => todayString(), []);

  const [activeTab, setActiveTab] = useState(normalizeTabKey(initialTab));
  const [facility, setFacility] = useState(DEFAULT_FACILITY);
  const [otherFacility, setOtherFacility] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [approvedBookings, setApprovedBookings] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [iosPicker, setIosPicker] = useState(null);

  useEffect(() => { setActiveTab(normalizeTabKey(initialTab)); }, [initialTab]);

  useEffect(() => {
    if (!userData?.societyId) return undefined;
    const approvedQuery = query(collection(db, 'bookings', userData.societyId, 'entries'), where('status', '==', 'approved'));
    const unsubApproved = onSnapshot(approvedQuery, (snapshot) => setApprovedBookings(sortByCreatedAtDesc(snapshot.docs.map(normalizeBooking))));

    let unsubMine = () => {};
    if (user?.uid) {
      const mineQuery = query(collection(db, 'bookings', userData.societyId, 'entries'), where('userId', '==', user.uid));
      unsubMine = onSnapshot(mineQuery, (snapshot) => setMyBookings(sortByCreatedAtDesc(snapshot.docs.map(normalizeBooking))));
    } else {
      setMyBookings([]);
    }

    return () => {
      unsubApproved();
      unsubMine();
    };
  }, [user?.uid, userData?.societyId]);

  const selectedFacility = facility === OTHER_FACILITY ? otherFacility.trim() : facility;
  const pendingCount = useMemo(() => myBookings.filter((item) => item.status === 'pending').length, [myBookings]);
  const calendarGroups = useMemo(() => groupBookingsByDate(approvedBookings), [approvedBookings]);
  const timeError = useMemo(() => !startTime || !endTime ? '' : timeToMinutes(endTime) <= timeToMinutes(startTime) ? 'End time must be later than start time.' : '', [endTime, startTime]);
  const timeSlot = useMemo(() => (!startTime || !endTime || timeError ? '' : timeRangeLabel(startTime, endTime)), [endTime, startTime, timeError]);
  const tabCounts = useMemo(() => ({ mine: myBookings.length, calendar: approvedBookings.length }), [approvedBookings.length, myBookings.length]);

  const pickerConfig = (field) => field === 'date'
    ? { field, mode: 'date', title: 'Select booking date', value: date ? new Date(`${date}T12:00:00`) : new Date(`${today}T12:00:00`), minimumDate: new Date(`${today}T00:00:00`) }
    : { field, mode: 'time', title: field === 'start' ? 'Select start time' : 'Select end time', value: timeToDate(field === 'start' ? startTime : endTime) };

  const applyPickerValue = (field, selected) => {
    if (!selected) return;
    if (field === 'date') {
      setDate(`${selected.getFullYear()}-${pad(selected.getMonth() + 1)}-${pad(selected.getDate())}`);
      return;
    }
    if (field === 'start') {
      setStartTime(dateToTime(selected));
      return;
    }
    setEndTime(dateToTime(selected));
  };

  const openPicker = (field) => {
    const config = pickerConfig(field);
    if (Platform.OS === 'web') return;
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: config.value,
        mode: config.mode,
        display: config.mode === 'date' ? 'default' : 'clock',
        is24Hour: false,
        minimumDate: config.minimumDate,
        onChange: (event, selected) => {
          if (event.type === 'set' && selected) applyPickerValue(field, selected);
        },
      });
      return;
    }
    setIosPicker(config);
  };

  const handleSubmit = async () => {
    if (!selectedFacility || !date || !timeSlot) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (timeError) {
      Alert.alert('Invalid time range', timeError);
      return;
    }
    if (!user?.uid || !userData?.societyId) {
      Alert.alert('Error', 'User details not found');
      return;
    }

    setLoading(true);
    try {
      const bookingCollection = collection(db, 'bookings', userData.societyId, 'entries');
      const conflictQuery = query(bookingCollection, where('facility', '==', selectedFacility), where('date', '==', date), where('timeSlot', '==', timeSlot));
      const conflictSnapshot = await getDocs(conflictQuery);
      const hasConflict = conflictSnapshot.docs.some((docSnap) => ['approved', 'pending'].includes(docSnap.data()?.status));

      if (hasConflict) {
        Alert.alert('Booking Unavailable', 'Slot already booked or pending approval');
        return;
      }

      const payload = {
        id: '',
        userId: user.uid,
        userName: userData?.name || userData?.fullName || 'Resident',
        flatNumber: getFlatNumber(userData),
        facility: selectedFacility,
        date,
        timeSlot,
        status: 'pending',
        rejectionReason: '',
        createdAt: Date.now(),
        timestamp: serverTimestamp(),
      };

      const bookingRef = await addDoc(bookingCollection, payload);
      await updateDoc(bookingRef, { id: bookingRef.id });

      Alert.alert('Success', 'Booking request submitted for approval');
      setFacility(DEFAULT_FACILITY);
      setOtherFacility('');
      setDate('');
      setStartTime('');
      setEndTime('');
      setActiveTab('mine');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const bg = isDark ? '#020617' : '#f8fbff';
  const cardBg = isDark ? '#0f172a' : '#ffffff';
  const surface = isDark ? '#111827' : '#f8fafc';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subtle = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? '#334155' : '#dbe4f0';
  const helperBg = isDark ? 'rgba(37,99,235,0.12)' : '#eff6ff';

  const renderCreate = () => (
    <View style={[styles.formCard, { backgroundColor: cardBg, borderColor: border }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Facility</Text>
        <View style={[styles.facilityGrid, compact && styles.facilityGridCompact]}>
          {FACILITIES.map((item) => {
            const meta = facilityMeta(item);
            const selected = facility === item;
            return (
              <Pressable
                key={item}
                onPress={() => setFacility(item)}
                style={({ hovered, pressed }) => [styles.facilityOption, compact && styles.facilityOptionCompact, { borderColor: selected ? meta.color : border, backgroundColor: selected ? meta.color : surface }, hovered && styles.hoverLift, pressed && styles.pressed]}
              >
                <View style={[styles.optionBadge, { backgroundColor: selected ? 'rgba(255,255,255,0.18)' : meta.accent }]}>
                  <Text style={[styles.optionBadgeText, { color: selected ? '#ffffff' : meta.color }]}>{meta.short}</Text>
                </View>
                <Text style={[styles.optionText, { color: selected ? '#ffffff' : textColor }]}>{item === OTHER_FACILITY ? '+ Other' : item}</Text>
              </Pressable>
            );
          })}
        </View>

        {facility === OTHER_FACILITY ? (
          <View style={styles.otherField}>
            <Text style={[styles.label, { color: textColor }]}>Other facility</Text>
            <TextInput
              value={otherFacility}
              onChangeText={setOtherFacility}
              placeholder="Enter facility name"
              placeholderTextColor="#94a3b8"
              style={[styles.textInput, { color: textColor, borderColor: border, backgroundColor: surface }]}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Schedule</Text>
        <View style={[styles.scheduleGrid, compact && styles.scheduleGridCompact]}>
          <PickerField
            isDark={isDark}
            label="Date"
            value={date}
            placeholder="Select date"
            mode="date"
            min={today}
            onWebChange={setDate}
            onPress={() => openPicker('date')}
            containerStyle={styles.scheduleFieldFull}
          />
          <PickerField
            isDark={isDark}
            label="Start time"
            value={startTime}
            placeholder="Select start time"
            mode="time"
            onWebChange={setStartTime}
            onPress={() => openPicker('start')}
            containerStyle={styles.scheduleField}
          />
          <PickerField
            isDark={isDark}
            label="End time"
            value={endTime}
            placeholder="Select end time"
            mode="time"
            onWebChange={setEndTime}
            onPress={() => openPicker('end')}
            containerStyle={styles.scheduleField}
          />
        </View>
        {timeSlot ? (
          <View style={[styles.preview, { backgroundColor: helperBg }]}>
            <Text style={styles.previewLabel}>Selected time range</Text>
            <Text style={[styles.previewValue, { color: textColor }]}>{timeSlot}</Text>
          </View>
        ) : null}
        {timeError ? <Text style={styles.inlineError}>{timeError}</Text> : null}
      </View>

      <TouchableOpacity style={[styles.submit, (loading || !!timeError) && styles.disabled]} onPress={handleSubmit} disabled={loading || !!timeError}>
        <Text style={styles.submitText}>{loading ? 'Submitting...' : 'Submit Booking'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderList = (data, emptyMessage, options = {}) => (
    <View style={[styles.list, compact && styles.listCompact]}>
      {data.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: surface }]}><Text style={[styles.emptyText, { color: subtle }]}>{emptyMessage}</Text></View>
      ) : data.map((item) => (
        <BookingCard
          key={item.id}
          item={item}
          isDark={isDark}
          compact={compact}
          showBookedBy={!!options.showBookedBy}
          showRejectionReason={!!options.showRejectionReason}
          highlight={isTodayDate(item.date) ? 'today' : isUpcomingDate(item.date) ? 'upcoming' : null}
        />
      ))}
    </View>
  );

  const renderCalendar = () => (
    <View style={styles.calendar}>
      {calendarGroups.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: surface }]}><Text style={[styles.emptyText, { color: subtle }]}>No approved bookings in the calendar yet.</Text></View>
      ) : calendarGroups.map((group) => {
        const todayGroup = isTodayDate(group.date);
        const upcomingGroup = isUpcomingDate(group.date);
        return (
          <View key={group.date} style={[styles.dayGroup, { backgroundColor: cardBg, borderColor: todayGroup ? '#60a5fa' : border }]}>
            <View style={[styles.dayHead, compact && styles.dayHeadCompact]}>
              <View style={styles.dayHeadLeft}>
                <Text style={[styles.dayTitle, { color: textColor }]}>{formatDate(group.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                <View style={styles.dayTags}>
                  {todayGroup ? <View style={[styles.dayTag, styles.dayTagToday]}><Text style={styles.dayTagText}>Today</Text></View> : null}
                  {!todayGroup && upcomingGroup ? <View style={[styles.dayTag, styles.dayTagUpcoming]}><Text style={styles.dayTagText}>Upcoming</Text></View> : null}
                </View>
              </View>
              <Text style={[styles.dayCount, { color: subtle }]}>{group.items.length} booking{group.items.length === 1 ? '' : 's'}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: border }]} />
            <View style={[styles.list, compact && styles.listCompact]}>
              {group.items.map((item) => (
                <BookingCard key={item.id} item={item} isDark={isDark} compact={compact} highlight={todayGroup ? 'today' : upcomingGroup ? 'upcoming' : null} />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={[styles.page, { backgroundColor: bg }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          {goBack ? <TouchableOpacity onPress={goBack} style={styles.backBtn}><Text style={styles.backText}>Back</Text></TouchableOpacity> : null}
        </View>

        <View style={styles.topSection}>
          <View style={styles.stats}>
            <OverviewStat label="Approved" value={approvedBookings.length} tone={{ bg: '#eff6ff', border: '#bfdbfe', value: '#1d4ed8', label: '#2563eb' }} />
            <OverviewStat label="My Requests" value={myBookings.length} tone={{ bg: '#ecfeff', border: '#a5f3fc', value: '#0f766e', label: '#0891b2' }} />
            <OverviewStat label="Pending" value={pendingCount} tone={{ bg: '#fff7ed', border: '#fed7aa', value: '#c2410c', label: '#ea580c' }} />
          </View>

          <View style={[styles.tabs, { backgroundColor: cardBg, borderColor: border }]}>
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              const count = tabCounts[tab.key];
              return (
                <TouchableOpacity key={tab.key} style={[styles.tab, active && styles.tabActive]} onPress={() => setActiveTab(tab.key)}>
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
                  {typeof count === 'number' ? (
                    <View style={[styles.tabCount, !active && styles.tabCountIdle]}>
                      <Text style={[styles.tabCountText, !active && styles.tabCountTextIdle]}>{count}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {activeTab === 'book' ? renderCreate() : null}
        {activeTab === 'mine' ? renderList(myBookings, 'No personal bookings yet.', { showRejectionReason: true }) : null}
        {activeTab === 'calendar' ? renderCalendar() : null}
      </ScrollView>

      {Platform.OS === 'ios' && iosPicker ? (
        <Modal transparent animationType="fade" visible onRequestClose={() => setIosPicker(null)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={styles.modalHead}>
                <Text style={[styles.modalTitle, { color: textColor }]}>{iosPicker.title}</Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity onPress={() => setIosPicker(null)} style={styles.modalBtn}><Text style={[styles.modalBtnText, { color: subtle }]}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => { applyPickerValue(iosPicker.field, iosPicker.value); setIosPicker(null); }} style={styles.modalBtn}><Text style={styles.modalBtnPrimary}>Done</Text></TouchableOpacity>
                </View>
              </View>
              <DateTimePicker
                value={iosPicker.value}
                mode={iosPicker.mode}
                display="spinner"
                minimumDate={iosPicker.minimumDate}
                onChange={(_, selected) => selected && setIosPicker((current) => current ? { ...current, value: selected } : current)}
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, minHeight: 0 },
  scroll: { flex: 1, paddingHorizontal: 20, ...Platform.select({ web: { overflowY: 'auto', overflowX: 'hidden' }, default: {} }) },
  scrollContent: { paddingTop: 18, paddingBottom: 32 },
  topBar: { marginBottom: 10 },
  backBtn: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(37,99,235,0.09)' },
  backText: { color: '#2563eb', fontSize: 14, fontWeight: '800' },
  topSection: { marginBottom: 20, gap: 14 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: { flexGrow: 1, minWidth: 160, paddingHorizontal: 18, paddingVertical: 16, borderRadius: 20, borderWidth: 1 },
  statValue: { fontSize: 26, lineHeight: 30, fontWeight: '900' },
  statLabel: { marginTop: 5, fontSize: 12, fontWeight: '800' },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 8, borderRadius: 22, borderWidth: 1.5 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexGrow: 1,
    minWidth: 120,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    ...Platform.select({ web: { cursor: 'pointer', transitionDuration: '220ms', transitionProperty: 'transform, box-shadow, background-color' }, default: {} }),
  },
  tabActive: {
    backgroundColor: '#2563eb',
    ...Platform.select({
      web: { backgroundImage: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', boxShadow: '0 12px 24px rgba(37,99,235,0.22)' },
      default: { shadowColor: '#2563eb', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.24, shadowRadius: 18, elevation: 4 },
    }),
  },
  tabText: { color: '#475569', fontSize: 13, fontWeight: '800' },
  tabTextActive: { color: '#ffffff' },
  tabCount: { minWidth: 24, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.24)' },
  tabCountIdle: { backgroundColor: '#dbeafe' },
  tabCountText: { color: '#ffffff', fontSize: 11, fontWeight: '900' },
  tabCountTextIdle: { color: '#2563eb' },
  formCard: {
    borderRadius: 28,
    borderWidth: 1.5,
    padding: 22,
    ...Platform.select({
      web: { boxShadow: '0 18px 40px rgba(15,23,42,0.08)' },
      default: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4 },
    }),
  },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 17, lineHeight: 22, fontWeight: '800' },
  facilityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14, ...Platform.select({ web: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }, default: {} }) },
  facilityGridCompact: { ...Platform.select({ web: { gridTemplateColumns: '1fr' }, default: {} }) },
  facilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexGrow: 1,
    flexBasis: 180,
    maxWidth: '100%',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    ...Platform.select({ web: { cursor: 'pointer', transitionDuration: '180ms', transitionProperty: 'transform, box-shadow, border-color, background-color' }, default: {} }),
  },
  facilityOptionCompact: { flexBasis: '100%' },
  optionBadge: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  optionBadgeText: { fontSize: 13, fontWeight: '900' },
  optionText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '800', ...Platform.select({ web: { wordBreak: 'keep-all' }, default: {} }) },
  otherField: { marginTop: 18 },
  field: { width: '100%', marginTop: 0 },
  label: { marginBottom: 10, textAlign: 'left', fontSize: 14, lineHeight: 18, fontWeight: '800' },
  webField: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    ...Platform.select({ web: { display: 'grid', gap: 6, transitionDuration: '180ms', transitionProperty: 'box-shadow, border-color, transform' }, default: {} }),
  },
  nativeField: { borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 15 },
  nativeValue: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
  fieldHint: { marginTop: 4, fontSize: 12, fontWeight: '600' },
  hoverLift: { ...Platform.select({ web: { transform: [{ translateY: -1 }], boxShadow: '0 10px 24px rgba(37,99,235,0.08)' }, default: {} }) },
  pressed: { opacity: 0.92 },
  textInput: { width: '100%', borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, lineHeight: 20, ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }) },
  scheduleGrid: { marginTop: 14, gap: 16, ...Platform.select({ web: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', alignItems: 'start' }, default: { flexDirection: 'row', flexWrap: 'wrap' } }) },
  scheduleGridCompact: { ...Platform.select({ web: { gridTemplateColumns: '1fr' }, default: { flexDirection: 'column' } }) },
  scheduleField: { ...Platform.select({ default: { flexBasis: '48%', flexGrow: 1 }, web: {} }) },
  scheduleFieldFull: { width: '100%', ...Platform.select({ web: { gridColumn: '1 / -1' }, default: {} }) },
  preview: { marginTop: 16, padding: 14, borderRadius: 16 },
  previewLabel: { color: '#2563eb', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  previewValue: { marginTop: 6, fontSize: 15, lineHeight: 20, fontWeight: '800' },
  inlineError: { marginTop: 12, color: '#dc2626', fontSize: 13, fontWeight: '700' },
  submit: {
    width: '100%',
    marginTop: 8,
    paddingVertical: 17,
    borderRadius: 18,
    alignItems: 'center',
    backgroundColor: '#16a34a',
    ...Platform.select({
      web: { backgroundImage: 'linear-gradient(135deg, #16a34a, #22c55e)', boxShadow: '0 14px 24px rgba(22,163,74,0.24)', cursor: 'pointer' },
      default: { shadowColor: '#16a34a', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.22, shadowRadius: 18, elevation: 5 },
    }),
  },
  disabled: { opacity: 0.6 },
  submitText: { color: '#ffffff', fontSize: 15, fontWeight: '900', letterSpacing: 0.2 },
  list: { width: '100%', gap: 18, ...Platform.select({ web: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }, default: { flexDirection: 'row', flexWrap: 'wrap' } }) },
  listCompact: { ...Platform.select({ web: { gridTemplateColumns: '1fr' }, default: {} }) },
  card: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 22,
    overflow: 'hidden',
    ...Platform.select({
      web: { transitionDuration: '220ms', transitionProperty: 'transform, box-shadow, border-color', boxShadow: '0 14px 28px rgba(15,23,42,0.08)' },
      default: { width: '100%', marginBottom: 18, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 18, elevation: 4 },
    }),
  },
  cardDark: { backgroundColor: 'rgba(15,23,42,0.96)' },
  cardHover: { ...Platform.select({ web: { transform: [{ translateY: -3 }], boxShadow: '0 18px 36px rgba(15,23,42,0.12)' }, default: { elevation: 6 } }) },
  cardToday: { borderWidth: 1.5, borderColor: 'rgba(37,99,235,0.26)' },
  cardUpcoming: { borderWidth: 1.5, borderColor: 'rgba(14,165,233,0.2)' },
  cardBar: { width: '100%', height: 4 },
  cardBody: { padding: 18, gap: 12 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  cardHeadCompact: { alignItems: 'flex-start' },
  cardHeadLeft: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 18, lineHeight: 24, fontWeight: '900', letterSpacing: -0.2, ...Platform.select({ web: { wordBreak: 'keep-all' }, default: {} }) },
  status: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, alignSelf: 'flex-start' },
  status_pending: { backgroundColor: '#d97706', ...Platform.select({ web: { backgroundImage: 'linear-gradient(135deg, #f59e0b, #d97706)' }, default: {} }) },
  status_approved: { backgroundColor: '#16a34a', ...Platform.select({ web: { backgroundImage: 'linear-gradient(135deg, #22c55e, #16a34a)' }, default: {} }) },
  status_rejected: { backgroundColor: '#dc2626', ...Platform.select({ web: { backgroundImage: 'linear-gradient(135deg, #ef4444, #dc2626)' }, default: {} }) },
  statusText: { color: '#ffffff', fontSize: 11, fontWeight: '900' },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap', gap: 10, minWidth: 0 },
  cardMetaRowCompact: { flexDirection: 'column', alignItems: 'flex-start', gap: 6 },
  cardMetaText: { flexShrink: 1, fontSize: 14, lineHeight: 20, fontWeight: '700', ...Platform.select({ web: { wordBreak: 'keep-all' }, default: {} }) },
  cardMetaDivider: { fontSize: 13, fontWeight: '700' },
  cardAuxText: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  reasonBox: { marginTop: 14, padding: 12, borderRadius: 14, backgroundColor: '#fff7ed', borderLeftWidth: 4, borderLeftColor: '#f59e0b' },
  reasonText: { color: '#92400e', fontSize: 13, lineHeight: 18, fontWeight: '700' },
  calendar: { gap: 18 },
  dayGroup: {
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 18,
    ...Platform.select({
      web: { boxShadow: '0 16px 34px rgba(15,23,42,0.08)' },
      default: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 18, elevation: 4 },
    }),
  },
  dayHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  dayHeadCompact: { flexDirection: 'column', alignItems: 'flex-start' },
  dayHeadLeft: { flex: 1 },
  dayTitle: { fontSize: 18, lineHeight: 24, fontWeight: '900' },
  dayTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  dayTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  dayTagToday: { backgroundColor: '#dbeafe' },
  dayTagUpcoming: { backgroundColor: '#e0f2fe' },
  dayTagText: { color: '#1d4ed8', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  dayCount: { fontSize: 13, fontWeight: '800' },
  divider: { height: 1, opacity: 0.85, marginVertical: 16 },
  empty: { width: '100%', borderRadius: 22, paddingHorizontal: 24, paddingVertical: 48, alignItems: 'center', justifyContent: 'center', ...Platform.select({ web: { gridColumn: '1 / -1' }, default: {} }) },
  emptyText: { textAlign: 'center', fontSize: 15, lineHeight: 22, fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(2,6,23,0.42)', justifyContent: 'center', padding: 20 },
  modalCard: { borderWidth: 1, borderRadius: 24, padding: 18 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 },
  modalTitle: { flex: 1, fontSize: 17, fontWeight: '800' },
  modalActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modalBtn: { paddingHorizontal: 10, paddingVertical: 8 },
  modalBtnText: { fontSize: 14, fontWeight: '700' },
  modalBtnPrimary: { color: '#2563eb', fontSize: 14, fontWeight: '800' },
});
