import React, { memo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import colors from '../../design/colors';
import shadows from '../../design/shadows';
import spacing from '../../design/spacing';

const AppCard = ({ children, style, interactive = false, onPress, hoverLift = true }) => {
  const { isDark } = useTheme();
  const [hovered, setHovered] = useState(false);
  const cardContent = typeof children === 'string' || typeof children === 'number' ? <Text>{children}</Text> : children;
  const darkSurface = '#111827';
  const darkBorder = '#1f2937';

  if (interactive || onPress) {
    return (
      <Pressable
        onPress={onPress}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={({ pressed }) => [
          styles.card,
          shadows.card,
          {
            backgroundColor: isDark ? darkSurface : colors.card,
            borderColor: isDark ? darkBorder : colors.border,
          },
          hovered && hoverLift && styles.cardHovered,
          hovered && hoverLift && shadows.hover,
          pressed && styles.cardPressed,
          style,
        ]}
      >
        {cardContent}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.card,
        shadows.card,
        {
          backgroundColor: isDark ? darkSurface : colors.card,
          borderColor: isDark ? darkBorder : colors.border,
        },
        style,
      ]}
    >
      {cardContent}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    overflow: 'hidden',
    transitionDuration: Platform.OS === 'web' ? '180ms' : undefined,
  },
  cardHovered: {
    transform: [{ translateY: -4 }],
  },
  cardPressed: {
    transform: [{ scale: 0.995 }],
  },
});

export default memo(AppCard);
