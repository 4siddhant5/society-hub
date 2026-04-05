import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const STATUS_MAP = {
  pending: { backgroundColor: '#fef3c7', color: '#a16207', borderColor: '#fde68a' },
  'in progress': { backgroundColor: '#dbeafe', color: '#1d4ed8', borderColor: '#bfdbfe' },
  resolved: { backgroundColor: '#dcfce7', color: '#15803d', borderColor: '#bbf7d0' },
};

const StatusBadge = ({ status }) => {
  const normalized = `${status || 'Pending'}`.trim().toLowerCase();
  const colors = STATUS_MAP[normalized] || STATUS_MAP.pending;

  return (
    <View style={[styles.badge, colors]}>
      <Text style={[styles.text, { color: colors.color }]}>{status || 'Pending'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '800',
  },
});

export default StatusBadge;
