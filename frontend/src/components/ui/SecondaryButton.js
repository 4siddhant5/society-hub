import React, { memo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import colors from '../../design/colors';
import spacing from '../../design/spacing';

const SecondaryButton = ({ title, onPress, style, textStyle, icon: Icon, disabled = false }) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ hovered, pressed }) => [
        styles.button,
        { opacity: disabled ? 0.6 : 1 },
        hovered && styles.hovered,
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.content}>
        {Icon ? <Icon style={styles.icon} /> : null}
        <Text style={[styles.text, textStyle]}>{title}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
    transitionDuration: Platform.OS === 'web' ? '160ms' : undefined,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  text: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  icon: {
    color: colors.textSecondary,
    fontSize: 18,
  },
  hovered: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
});

export default memo(SecondaryButton);
