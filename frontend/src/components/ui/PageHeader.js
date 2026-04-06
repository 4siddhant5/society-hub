import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppCard from './AppCard';
import colors from '../../design/colors';
import spacing from '../../design/spacing';
import typography from '../../design/typography';

const PageHeader = ({ eyebrow, title, subtitle, rightContent, style, contained = true }) => {
  const Wrapper = contained ? AppCard : View;

  return (
    <Wrapper style={[styles.card, style]}>
      <View style={styles.row}>
        <View style={styles.copy}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {rightContent ? <View style={styles.right}>{rightContent}</View> : null}
      </View>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
  },
  right: {
    alignSelf: 'center',
  },
  eyebrow: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.title,
    lineHeight: 30,
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.xs,
    maxWidth: 720,
  },
});

export default memo(PageHeader);
