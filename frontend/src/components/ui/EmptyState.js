import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FiInbox } from '../../utils/iconCompat';
import colors from '../../design/colors';
import spacing from '../../design/spacing';
import typography from '../../design/typography';

const EmptyState = ({ message, icon: Icon = FiInbox }) => {
  return (
    <View style={styles.container}>
      <Icon size={48} color="#94a3b8" />
      <Text style={styles.text}>{message || 'No data found'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.bodyLarge,
    marginTop: spacing.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },
});

export default memo(EmptyState);
