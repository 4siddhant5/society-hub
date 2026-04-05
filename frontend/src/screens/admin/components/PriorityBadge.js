import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const PRIORITY_MAP = {
  high: { backgroundColor: '#fee2e2', color: '#b91c1c', borderColor: '#fecaca' },
  medium: { backgroundColor: '#ffedd5', color: '#c2410c', borderColor: '#fdba74' },
  low: { backgroundColor: '#e2e8f0', color: '#475569', borderColor: '#cbd5e1' },
  normal: { backgroundColor: '#e2e8f0', color: '#475569', borderColor: '#cbd5e1' },
};

const PriorityBadge = ({ priority }) => {
  const normalized = `${priority || 'Low'}`.trim().toLowerCase();
  const colors = PRIORITY_MAP[normalized] || PRIORITY_MAP.low;

  return (
    <View style={[styles.badge, colors]}>
      <Text style={[styles.text, { color: colors.color }]}>{`${priority || 'Low'}`.toUpperCase()}</Text>
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
    letterSpacing: 0.4,
  },
});

export default PriorityBadge;
