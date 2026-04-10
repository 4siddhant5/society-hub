import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import spacing from '../../design/spacing';

const ResidentBroadcastCard = ({ broadcast, isDark, onClose, style }) => {
  if (!broadcast) return null;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#3f1d1d' : '#fff7ed',
          borderColor: isDark ? 'rgba(251, 146, 60, 0.22)' : 'rgba(249, 115, 22, 0.18)',
        },
        style,
      ]}
    >
      <View style={styles.copy}>
        <Text style={[styles.title, { color: isDark ? '#fed7aa' : '#9a3412' }]}>
          {broadcast.title || 'Broadcast'}
        </Text>
        {!!broadcast.message ? (
          <Text style={[styles.message, { color: isDark ? '#ffedd5' : '#7c2d12' }]}>
            {broadcast.message}
          </Text>
        ) : null}
      </View>

      {onClose ? (
        <TouchableOpacity
          onPress={onClose}
          style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.22)' : 'rgba(255, 255, 255, 0.7)' }]}
          activeOpacity={0.88}
        >
          <Text style={[styles.closeButtonText, { color: isDark ? '#fdba74' : '#c2410c' }]}>Close</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  message: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  closeButtonText: {
    fontSize: 12,
    fontWeight: '800',
  },
});

export default ResidentBroadcastCard;
