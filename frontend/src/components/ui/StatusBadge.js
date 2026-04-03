import React from 'react';
import {
  View,
  Text,
  StyleSheet
} from "react-native";

const StatusBadge = ({ status }) => {
  const getStyles = () => {
    const s = status?.toLowerCase();
    if (s === 'resolved' || s === 'approved' || s === 'success') {
      return { bg: '#dcfce7', text: '#166534' };
    }
    if (s === 'pending' || s === 'in progress' || s === 'warning') {
      return { bg: '#fef9c3', text: '#854d0e' };
    }
    if (s === 'rejected' || s === 'high' || s === 'danger') {
      return { bg: '#fee2e2', text: '#991b1b' };
    }
    return { bg: '#f1f5f9', text: '#475569' };
  };

  const colors = getStyles();

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});

export default StatusBadge;
