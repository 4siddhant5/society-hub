import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

const SHOULD_USE_NATIVE_DRIVER = false;

const GRADIENTS = {
  brand: ['#2563EB', '#10B981'],
  dark: ['#60A5FA', '#2DD4BF'],
};

const SocietyHubMarkArtwork = ({ size = 96, gradient = 'brand' }) => {
  const palette = GRADIENTS[gradient] || GRADIENTS.brand;

  return (
    <Svg height={size} viewBox="0 0 160 160" width={size}>
      <Defs>
        <LinearGradient id="societyhubGradient" x1="12%" x2="88%" y1="92%" y2="8%">
          <Stop offset="0%" stopColor={palette[0]} />
          <Stop offset="100%" stopColor={palette[1]} />
        </LinearGradient>
        <LinearGradient id="societyhubShadow" x1="0%" x2="100%" y1="100%" y2="0%">
          <Stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.3" />
          <Stop offset="100%" stopColor="#0F766E" stopOpacity="0.15" />
        </LinearGradient>
      </Defs>

      <Ellipse cx="48" cy="92" fill="url(#societyhubShadow)" opacity="0.22" rx="42" ry="34" />
      <Ellipse cx="112" cy="92" fill="url(#societyhubShadow)" opacity="0.18" rx="40" ry="32" />

      <Path
        d="M80 10L134 46C145 53 151 66 151 81V124C151 148 136 168 110 181L80 196L50 181C24 168 9 148 9 124V81C9 66 15 53 26 46L80 10Z"
        fill="url(#societyhubGradient)"
      />

      <Path
        d="M42 128C42 107 53 96 72 91L86 87C97 83 102 78 102 69C102 57 92 48 76 48C61 48 51 55 46 69L22 58C30 35 49 22 77 22C112 22 129 42 129 66C129 87 117 99 96 104L82 108C71 111 67 116 67 126V130H42V128Z"
        fill="#FFFFFF"
        opacity="0.92"
      />

      <Path
        d="M64 25H92L111 43V113H88V61L80 54L72 61V113H49V43L64 25Z"
        fill="#FFFFFF"
        opacity="0.92"
      />

      <Path
        d="M81 133L81 95M81 95L64 112M81 95L98 112"
        fill="none"
        stroke="#FFFFFF"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="12"
      />
    </Svg>
  );
};

export const SocietyHubMark = ({ size = 96, gradient = 'brand' }) => (
  <View style={[styles.markWrap, { width: size, height: size }]}>
    <SocietyHubMarkArtwork gradient={gradient} size={size} />
  </View>
);

export const SocietyHubLoader = ({
  size = 84,
  gradient = 'brand',
  label,
  labelTone = 'light',
}) => {
  const arrowLift = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowLift, {
          toValue: -4,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
        }),
        Animated.timing(arrowLift, {
          toValue: 6,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [arrowLift]);

  const textStyle = labelTone === 'dark' ? styles.loaderLabelDark : styles.loaderLabelLight;

  return (
    <View style={styles.loaderWrap}>
      <Animated.View style={{ transform: [{ translateY: arrowLift }] }}>
        <SocietyHubMarkArtwork gradient={gradient} size={size} />
      </Animated.View>
      {label ? <Text style={textStyle}>{label}</Text> : null}
    </View>
  );
};

export default function SocietyHubLogo({
  markSize = 58,
  theme = 'light',
  stacked = false,
  showTagline = false,
  titleStyle,
  subtitleStyle,
}) {
  const tone = theme === 'dark' ? styles.titleDark : styles.titleLight;
  const subTone = theme === 'dark' ? styles.subtitleDark : styles.subtitleLight;
  const gradient = theme === 'dark' ? 'dark' : 'brand';
  const containerStyle = useMemo(
    () => [styles.logoRow, stacked && styles.logoStack],
    [stacked]
  );
  const wordmarkStyle = useMemo(
    () => [styles.wordmarkWrap, stacked && styles.wordmarkWrapStacked],
    [stacked]
  );

  return (
    <View style={containerStyle}>
      <SocietyHubMark gradient={gradient} size={markSize} />
      <View style={wordmarkStyle}>
        <Text style={[tone, titleStyle]}>SocietyHub</Text>
        {showTagline ? (
          <Text style={[subTone, subtitleStyle]}>Connected operations for modern communities</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  markWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderLabelLight: {
    marginTop: 12,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  loaderLabelDark: {
    marginTop: 12,
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoStack: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  wordmarkWrap: {
    marginLeft: 14,
  },
  wordmarkWrapStacked: {
    marginLeft: 0,
    marginTop: 10,
    alignItems: 'center',
  },
  titleLight: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  titleDark: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  subtitleLight: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  subtitleDark: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
});
