import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { SocietyHubLoader } from '../components/branding/SocietyHubLogo';
import spacing from '../design/spacing';

const SHOULD_USE_NATIVE_DRIVER = Platform.OS !== 'web';

export default function SplashScreen() {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.88)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(12)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
      }),
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1.04,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
        }),
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 1,
            duration: 520,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.8,
            duration: 480,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
          }),
        ]),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
        }),
        Animated.timing(titleTranslate, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
        }),
      ]),
    ]).start();
  }, [glowOpacity, logoOpacity, logoScale, taglineOpacity, titleOpacity, titleTranslate]);

  return (
    <View style={styles.page}>
      <View style={StyleSheet.absoluteFillObject}>
        <Svg height="100%" preserveAspectRatio="none" width="100%">
          <Defs>
            <LinearGradient id="splashBg" x1="0%" x2="100%" y1="100%" y2="0%">
              <Stop offset="0%" stopColor="#0F172A" />
              <Stop offset="48%" stopColor="#1D4ED8" />
              <Stop offset="100%" stopColor="#10B981" />
            </LinearGradient>
          </Defs>
          <Rect fill="url(#splashBg)" height="100%" width="100%" x="0" y="0" />
          <Path d="M-40 620C94 516 216 494 326 554C418 605 526 618 700 501V900H-40V620Z" fill="#FFFFFF" opacity="0.06" />
          <Path d="M-80 170C72 96 192 94 292 156C384 213 486 220 650 114V-80H-80V170Z" fill="#FFFFFF" opacity="0.04" />
        </Svg>
      </View>

      <Animated.View
        style={[
          styles.logoGlow,
          styles.pointerEventsNone,
          {
            opacity: glowOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.centerWrap,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <SocietyHubLoader gradient="dark" labelTone="dark" size={124} />
      </Animated.View>

      <Animated.View
        style={[
          styles.textWrap,
          {
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslate }],
          },
        ]}
      >
        <Text style={styles.title}>SocietyHub</Text>
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>Smarter living for modern communities</Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: '#0F172A',
  },
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    ...Platform.select({
      web: {
        boxShadow: '0 12px 34px rgba(96, 165, 250, 0.18)',
        filter: 'blur(42px)',
      },
      default: {
        shadowColor: '#60A5FA',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 34,
      },
    }),
  },
  pointerEventsNone: {
    pointerEvents: 'none',
  },
  textWrap: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  tagline: {
    marginTop: spacing.xs,
    color: '#D5E7F6',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
});
