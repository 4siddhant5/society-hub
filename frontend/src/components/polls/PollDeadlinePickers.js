import React, { memo, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FiChevronLeft, FiChevronRight, FiX } from '../../utils/iconCompat';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const createDateAtMidnight = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const getDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateKey = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const addMonths = (date, amount) => {
  const next = new Date(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + amount);
  return next;
};

const buildCalendarDays = (displayMonth, minimumDate) => {
  const firstDay = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1);
  const daysInMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 0).getDate();
  const leadingSlots = firstDay.getDay();
  const cells = [];

  for (let index = 0; index < leadingSlots; index += 1) {
    cells.push({ key: `blank-${index}`, isBlank: true });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
    const disabled = createDateAtMidnight(date).getTime() < minimumDate.getTime();
    cells.push({
      key: getDateKey(date),
      label: day,
      date,
      disabled,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ key: `tail-${cells.length}`, isBlank: true });
  }

  return cells;
};

const toTimeParts = (value) => {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) {
    return { hour: 10, minute: 30, meridiem: 'AM' };
  }

  const [rawHour, rawMinute] = value.split(':').map(Number);
  const meridiem = rawHour >= 12 ? 'PM' : 'AM';
  const hour = rawHour % 12 || 12;
  return { hour, minute: rawMinute, meridiem };
};

const to24HourValue = ({ hour, minute, meridiem }) => {
  let hour24 = hour % 12;
  if (meridiem === 'PM') {
    hour24 += 12;
  }

  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

export const formatTimeDisplay = (value) => {
  if (!value) {
    return '';
  }

  const { hour, minute, meridiem } = toTimeParts(value);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${meridiem}`;
};

const PickerShell = ({ visible, title, subtitle, onClose, children, footer }) => {
  if (!visible) {
    return null;
  }

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation?.()}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>{title}</Text>
              {subtitle ? <Text style={styles.modalSubtitle}>{subtitle}</Text> : null}
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <FiX size={18} color="#64748b" />
            </Pressable>
          </View>
          <View style={styles.modalBody}>{children}</View>
          {footer ? <View style={styles.modalFooter}>{footer}</View> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export const DatePickerModal = memo(({ visible, value, onClose, onSelect }) => {
  const today = useMemo(() => createDateAtMidnight(new Date()), []);
  const [displayMonth, setDisplayMonth] = useState(value ? parseDateKey(value) || today : today);

  useEffect(() => {
    if (visible) {
      setDisplayMonth(value ? parseDateKey(value) || today : today);
    }
  }, [today, value, visible]);

  const days = useMemo(() => buildCalendarDays(displayMonth, today), [displayMonth, today]);
  const selectedKey = value || '';
  const isCurrentMonth =
    displayMonth.getFullYear() === today.getFullYear() &&
    displayMonth.getMonth() === today.getMonth();

  return (
    <PickerShell
      visible={visible}
      title="Select Deadline Date"
      subtitle="Past dates are disabled."
      onClose={onClose}
    >
      <View style={styles.calendarHeader}>
        <Pressable
          style={[styles.navButton, isCurrentMonth && styles.navButtonDisabled]}
          onPress={() => !isCurrentMonth && setDisplayMonth((current) => addMonths(current, -1))}
          disabled={isCurrentMonth}
        >
          <FiChevronLeft size={18} color={isCurrentMonth ? '#cbd5e1' : '#334155'} />
        </Pressable>
        <Text style={styles.calendarTitle}>
          {displayMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </Text>
        <Pressable style={styles.navButton} onPress={() => setDisplayMonth((current) => addMonths(current, 1))}>
          <FiChevronRight size={18} color="#334155" />
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={styles.weekdayCell}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {days.map((cell) =>
          cell.isBlank ? (
            <View key={cell.key} style={styles.calendarCell} />
          ) : (
            <Pressable
              key={cell.key}
              onPress={() => {
                if (cell.disabled) {
                  return;
                }
                onSelect?.(cell.key);
                onClose?.();
              }}
              disabled={cell.disabled}
              style={[
                styles.calendarCell,
                styles.dayCell,
                selectedKey === cell.key && styles.dayCellSelected,
                cell.disabled && styles.dayCellDisabled,
              ]}
            >
              <Text
                style={[
                  styles.dayCellText,
                  selectedKey === cell.key && styles.dayCellTextSelected,
                  cell.disabled && styles.dayCellTextDisabled,
                ]}
              >
                {cell.label}
              </Text>
            </Pressable>
          )
        )}
      </View>
    </PickerShell>
  );
});

export const TimePickerModal = memo(({ visible, value, onClose, onSelect }) => {
  const [selection, setSelection] = useState(toTimeParts(value));

  useEffect(() => {
    if (visible) {
      setSelection(toTimeParts(value));
    }
  }, [value, visible]);

  const hourOptions = useMemo(() => Array.from({ length: 12 }, (_, index) => index + 1), []);
  const minuteOptions = useMemo(() => Array.from({ length: 60 }, (_, index) => index), []);

  return (
    <PickerShell
      visible={visible}
      title="Select Deadline Time"
      subtitle="Choose the time residents should stop voting."
      onClose={onClose}
      footer={
        <View style={styles.footerActions}>
          <Pressable style={styles.footerSecondary} onPress={onClose}>
            <Text style={styles.footerSecondaryText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={styles.footerPrimary}
            onPress={() => {
              onSelect?.(to24HourValue(selection));
              onClose?.();
            }}
          >
            <Text style={styles.footerPrimaryText}>Apply Time</Text>
          </Pressable>
        </View>
      }
    >
      <View style={styles.timePreview}>
        <Text style={styles.timePreviewLabel}>Selected time</Text>
        <Text style={styles.timePreviewValue}>{formatTimeDisplay(to24HourValue(selection))}</Text>
      </View>

      <View style={styles.meridiemRow}>
        {['AM', 'PM'].map((period) => (
          <Pressable
            key={period}
            style={[styles.meridiemButton, selection.meridiem === period && styles.meridiemButtonActive]}
            onPress={() => setSelection((current) => ({ ...current, meridiem: period }))}
          >
            <Text
              style={[
                styles.meridiemText,
                selection.meridiem === period && styles.meridiemTextActive,
              ]}
            >
              {period}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.timeColumns}>
        <View style={styles.timeColumn}>
          <Text style={styles.timeColumnTitle}>Hour</Text>
          <ScrollView style={styles.timeList} showsVerticalScrollIndicator={false}>
            <View style={styles.timeChipGrid}>
              {hourOptions.map((hour) => (
                <Pressable
                  key={hour}
                  style={[styles.timeChip, selection.hour === hour && styles.timeChipActive]}
                  onPress={() => setSelection((current) => ({ ...current, hour }))}
                >
                  <Text style={[styles.timeChipText, selection.hour === hour && styles.timeChipTextActive]}>
                    {String(hour).padStart(2, '0')}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.timeColumn}>
          <Text style={styles.timeColumnTitle}>Minute</Text>
          <ScrollView style={styles.timeList} showsVerticalScrollIndicator={false}>
            <View style={styles.timeChipGrid}>
              {minuteOptions.map((minute) => (
                <Pressable
                  key={minute}
                  style={[styles.timeChip, selection.minute === minute && styles.timeChipActive]}
                  onPress={() => setSelection((current) => ({ ...current, minute }))}
                >
                  <Text
                    style={[
                      styles.timeChipText,
                      selection.minute === minute && styles.timeChipTextActive,
                    ]}
                  >
                    {String(minute).padStart(2, '0')}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </PickerShell>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 680,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 24px 60px rgba(15, 23, 42, 0.18)' },
      default: {
        shadowColor: '#020617',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#64748b',
    fontWeight: '600',
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 18,
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dbe3ef',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekdayCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 4,
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#eef2f7',
  },
  dayCellSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  dayCellDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#eef2f7',
    opacity: 0.4,
  },
  dayCellText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  dayCellTextSelected: {
    color: '#ffffff',
  },
  dayCellTextDisabled: {
    color: '#94a3b8',
  },
  timePreview: {
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  timePreviewLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1d4ed8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  timePreviewValue: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  meridiemRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  meridiemButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbe3ef',
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
  },
  meridiemButtonActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  meridiemText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  meridiemTextActive: {
    color: '#1d4ed8',
  },
  timeColumns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  timeColumn: {
    flex: 1,
    minWidth: 220,
  },
  timeColumnTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  timeList: {
    maxHeight: 260,
  },
  timeChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    minWidth: 54,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dbe3ef',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  timeChipActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  timeChipTextActive: {
    color: '#1d4ed8',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  footerSecondary: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerSecondaryText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  footerPrimary: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerPrimaryText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
});
