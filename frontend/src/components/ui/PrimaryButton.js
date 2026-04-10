import React, { memo } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import colors from '../../design/colors';
import shadows from '../../design/shadows';
import spacing from '../../design/spacing';

const BACKGROUNDS = {
  primary: colors.primary,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
};

const PrimaryButton = ({ title, onPress, loading = false, style, textStyle, icon: Icon, variant = 'primary', disabled = false }) => {
  const backgroundColor = BACKGROUNDS[variant] || colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ hovered, pressed }) => [
        styles.button,
        shadows.card,
        { backgroundColor, opacity: disabled ? 0.6 : 1 },
        hovered && styles.hovered,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <View style={styles.content}>
          {Icon ? <Icon style={styles.icon} /> : null}
          <Text style={[styles.text, textStyle]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    transitionDuration: Platform.OS === 'web' ? '160ms' : undefined,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  text: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  icon: {
    color: '#ffffff',
    fontSize: 18,
  },
  hovered: {
    transform: [{ translateY: -1 }],
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
});

export default memo(PrimaryButton);
