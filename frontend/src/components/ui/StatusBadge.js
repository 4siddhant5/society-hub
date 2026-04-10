import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import colors from '../../design/colors';

const StatusBadge = ({ status }) => {
  const getStyles = () => {
    const s = String(status || '')
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, ' ');

    if (s === 'resolved' || s === 'approved' || s === 'success') {
      return { bg: '#dcfce7', text: '#15803d', border: '#86efac' };
    }
    if (s === 'in progress' || s === 'warning') {
      return { bg: '#fef9c3', text: '#854d0e', border: '#fde047' };
    }
    if (s === 'pending') {
      return { bg: '#ffedd5', text: '#c2410c', border: '#fb923c' };
    }
    if (s === 'rejected' || s === 'high' || s === 'danger') {
      return { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' };
    }
    if (s === 'closed') {
      return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
    }
    return { bg: colors.primarySurface, text: colors.primary, border: '#bfdbfe' };
  };

  const tone = getStyles();
  const label = String(status || 'Pending').replace(/[_-]+/g, ' ');

  return (
    <View style={[styles.badge, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <Text style={[styles.text, { color: tone.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
    letterSpacing: 0.2,
  },
});

export default memo(StatusBadge);
