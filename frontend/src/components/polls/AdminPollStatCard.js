import React, { memo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

const AdminPollStatCard = ({ icon: Icon, label, value, meta, accent }) => (
  <View style={styles.shell}>
    <View style={[styles.glow, { backgroundColor: accent }]} />
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: `${accent}26` }]}>
        <Icon size={18} color="#ffffff" />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.meta}>{meta}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    minWidth: 220,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  },
  glow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    right: -36,
    top: -54,
    opacity: 0.6,
  },
  card: {
    minHeight: 164,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 18,
    paddingVertical: 18,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(18px)',
      },
      default: {},
    }),
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  value: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
    color: '#ffffff',
  },
  label: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '800',
    color: '#e0f2fe',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  meta: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#dbeafe',
  },
});

export default memo(AdminPollStatCard);
