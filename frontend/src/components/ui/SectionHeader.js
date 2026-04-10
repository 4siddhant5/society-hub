import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import colors from '../../design/colors';
import spacing from '../../design/spacing';
import typography from '../../design/typography';

const SectionHeader = ({ title, subtitle, rightComponent }) => {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {rightComponent ? (
        <View>{typeof rightComponent === 'string' || typeof rightComponent === 'number' ? <Text>{rightComponent}</Text> : rightComponent}</View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.section,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
});

export default memo(SectionHeader);
