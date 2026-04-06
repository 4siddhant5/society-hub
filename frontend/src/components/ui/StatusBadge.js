import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import colors from '../../design/colors';
import spacing from '../../design/spacing';

const StatusBadge = ({ status }) => {
  const getStyles = () => {
    const s = status?.toLowerCase();
    if (s === 'resolved' || s === 'approved' || s === 'success') {
      return { bg: colors.successSurface, text: '#166534' };
    }
    if (s === 'pending' || s === 'in progress' || s === 'warning') {
      return { bg: colors.warningSurface, text: '#854d0e' };
    }
    if (s === 'rejected' || s === 'high' || s === 'danger') {
      return { bg: colors.dangerSurface, text: '#991b1b' };
    }
    return { bg: colors.primarySurface, text: colors.primary };
  };

  const tone = getStyles();

  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.text, { color: tone.text }]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});

export default memo(StatusBadge);
