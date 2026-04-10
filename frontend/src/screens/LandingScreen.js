import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import {
  FiActivity,
  FiAlertTriangle,
  FiArrowRight,
  FiBarChart2,
  FiBell,
  FiCheckCircle,
  FiClock,
  FiGrid,
  FiHome,
  FiLayers,
  FiMessageCircle,
  FiPlay,
  FiSettings,
  FiShield,
  FiTrendingUp,
  FiUsers,
  FiZap,
} from '../utils/iconCompat';

const NAV_ITEMS = [['Features', 'features'], ['How It Works', 'how-it-works'], ['Safety', 'sos'], ['Admin', 'admin']];
const VALUE_ITEMS = [
  { accent: ['#0EA5E9', '#2DD4BF'], icon: FiActivity, stat: '24/7', title: 'Real-time Operations', description: 'Live updates, instant routing, and shared visibility for residents and admins.' },
  { accent: ['#2563EB', '#06B6D4'], icon: FiMessageCircle, stat: '1 Hub', title: 'Seamless Communication', description: 'Announcements, chat, and requests flow through one elegant communication layer.' },
  { accent: ['#14B8A6', '#34D399'], icon: FiTrendingUp, stat: 'Smart', title: 'Operational Intelligence', description: 'Automated workflows and analytics keep the community running smoothly.' },
];
const ROLE_ITEMS = [
  { title: 'Resident', description: 'Report, connect, and stay effortlessly informed.', accent: ['#14B8A6', '#22D3EE'], shadow: 'rgba(20,184,166,0.22)', icon: FiHome, features: ['Submit and track issues', 'Book facilities', 'Participate in polls', 'Stay informed with announcements'] },
  { title: 'Admin', description: 'Manage operations with speed and confidence.', accent: ['#3B82F6', '#6366F1'], shadow: 'rgba(59,130,246,0.22)', icon: FiShield, features: ['Approve resident requests', 'Manage facility bookings', 'Create announcements', 'Handle issue resolution'] },
  { title: 'Super Admin', description: 'Oversee the full ecosystem with clarity.', accent: ['#6366F1', '#8B5CF6'], shadow: 'rgba(99,102,241,0.22)', icon: FiLayers, features: ['Manage multiple societies', 'Access analytics dashboard', 'Configure system settings', 'Oversee all operations'] },
];
const FEATURE_ITEMS = [
  { title: 'Issue Tracking', description: 'Report and resolve maintenance concerns with real-time status updates and clear ownership.', accent: ['#3B82F6', '#06B6D4'], icon: FiAlertTriangle },
  { title: 'SOS Emergency', description: 'Priority emergency alerts route instantly to admins, security, and designated responders.', accent: ['#EF4444', '#F97316'], icon: FiZap },
  { title: 'Facility Booking', description: 'Reserve amenities with smart scheduling, live availability, and approval workflows.', accent: ['#14B8A6', '#10B981'], icon: FiGrid },
  { title: 'Polls & Voting', description: 'Run transparent community decisions with simple participation and trustworthy results.', accent: ['#6366F1', '#8B5CF6'], icon: FiCheckCircle },
  { title: 'Announcements', description: 'Broadcast important updates to every resident through one polished communication center.', accent: ['#F59E0B', '#F97316'], icon: FiBell },
  { title: 'Chat System', description: 'Keep residents and management aligned with direct, real-time conversations.', accent: ['#EC4899', '#F43F5E'], icon: FiMessageCircle },
];
const STEP_ITEMS = [
  { step: 1, title: 'Register Account', description: 'Create your account with your core details and preferred contact info.', icon: FiUsers },
  { step: 2, title: 'Enter Society Code', description: 'Use the secure code shared by your society admin to join the right community.', icon: FiShield },
  { step: 3, title: 'Get Approved', description: 'Admins verify membership so every resident space stays trusted and secure.', icon: FiCheckCircle },
  { step: 4, title: 'Start Using', description: 'Access requests, announcements, bookings, and emergency tools right away.', icon: FiZap },
];
const RECENT_ACTIVITY = [
  ['New poll created', '2m ago', '#3B82F6', FiBarChart2],
  ['Issue #45 resolved', '15m ago', '#10B981', FiCheckCircle],
  ['Facility booked', '1h ago', '#F59E0B', FiClock],
];
const SOS_ITEMS = [
  ['Instant Alerts', 'Real-time notifications', '#EF4444', FiBell],
  ['Direct Contact', 'Quick emergency calls', '#F97316', FiMessageCircle],
  ['24/7 Monitoring', 'Always on protection', '#DC2626', FiShield],
  ['Priority Routing', 'Urgent case handling', '#FB7185', FiZap],
];
const ADMIN_ITEMS = [
  ['Multi-Society Management', 'Oversee multiple communities from a single dashboard', FiLayers],
  ['Advanced Analytics', 'Deep insights into community operations and trends', FiBarChart2],
  ['User Management', 'Complete control over resident and admin accounts', FiUsers],
  ['System Configuration', 'Customize every aspect of your society setup', FiSettings],
  ['Security Controls', 'Role-based permissions and access management', FiShield],
  ['Bulk Operations', 'Efficient handling of large-scale actions', FiGrid],
];
const TESTIMONIALS = [
  { name: 'Priya Sharma', role: 'Resident, Sunrise Apartments', content: 'SocietyHub has completely transformed how we interact with our building management. Issues get resolved so much faster now!', avatar: 'PS' },
  { name: 'Rajesh Kumar', role: 'Admin, Green Valley Society', content: 'Managing our 200+ unit society used to be a nightmare. Now everything is streamlined and organized in one place.', avatar: 'RK' },
  { name: 'Anita Desai', role: 'Super Admin, Property Management Co.', content: 'The multi-society feature is a game changer. We can now manage all our properties from a single dashboard.', avatar: 'AD' },
  { name: 'Vikram Singh', role: 'Resident, Palm Gardens', content: 'The SOS feature gives me peace of mind knowing help is just a tap away. Great for families with elderly members.', avatar: 'VS' },
  { name: 'Meera Patel', role: 'Admin, Lakeside Residency', content: 'The polling system has made community decisions so much more democratic and transparent. Highly recommended!', avatar: 'MP' },
];
const FOOTER_LINKS = {
  Product: [
    { label: 'Features', action: { type: 'scroll', target: 'features' } },
    { label: 'Security', action: { type: 'scroll', target: 'sos' } },
    { label: 'Roadmap', action: { type: 'info', target: 'roadmap' } },
  ],
  Company: [
    { label: 'About', action: { type: 'scroll', target: 'features' } },
    { label: 'Blog', action: { type: 'info', target: 'blog' } },
    { label: 'Careers', action: { type: 'info', target: 'careers' } },
    { label: 'Contact', action: { type: 'scroll', target: 'contact' } },
  ],
  Legal: [
    { label: 'Privacy Policy', action: { type: 'legal', target: 'privacy' } },
    { label: 'Terms', action: { type: 'legal', target: 'terms' } },
    { label: 'Cookies', action: { type: 'legal', target: 'cookies' } },
  ],
  Support: [
    { label: 'Help Center', action: { type: 'info', target: 'help' } },
    { label: 'Documentation', action: { type: 'info', target: 'documentation' } },
    { label: 'Status', action: { type: 'info', target: 'status' } },
  ],
};
const INFO_CONTENT = {
  roadmap: { title: 'Roadmap', text: 'Product roadmap details are available during demos and onboarding conversations.' },
  blog: { title: 'Blog', text: 'Editorial content is coming soon with launch updates, case studies, and operations playbooks.' },
  careers: { title: 'Careers', text: 'Hiring information will be published here as the team expands.' },
  help: { title: 'Help Center', text: 'Support articles and quick-start guides are being prepared for self-serve onboarding.' },
  documentation: { title: 'Documentation', text: 'Detailed setup and workflow documentation will be published in the documentation hub.' },
  status: { title: 'Status', text: 'All demo services are presented as healthy and operational for the current experience.' },
};
const LEGAL_CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    text: 'Resident details, requests, and operational activity stay visible only to authorized roles with audit-ready access controls.',
  },
  terms: {
    title: 'Terms',
    text: 'SocietyHub is provided for community coordination, administration, and emergency workflows with role-based usage expectations.',
  },
  cookies: {
    title: 'Cookies',
    text: 'Lightweight session and analytics cookies help keep sign-in, navigation, and product performance smooth across the experience.',
  },
};
const PARTICLES = [{ left: '7%', top: '12%', size: 7, delay: 0 }, { left: '14%', top: '66%', size: 6, delay: 0.4 }, { left: '24%', top: '22%', size: 10, delay: 0.9 }, { left: '33%', top: '77%', size: 5, delay: 1.3 }, { left: '42%', top: '14%', size: 9, delay: 0.2 }, { left: '49%', top: '56%', size: 8, delay: 1.1 }, { left: '57%', top: '28%', size: 7, delay: 0.6 }, { left: '66%', top: '72%', size: 6, delay: 1.7 }, { left: '74%', top: '16%', size: 8, delay: 0.8 }, { left: '82%', top: '46%', size: 5, delay: 1.4 }, { left: '89%', top: '69%', size: 7, delay: 0.3 }, { left: '94%', top: '24%', size: 6, delay: 1.6 }];
const FINAL_PARTICLES = [{ left: '12%', top: '30%', size: 4, delay: 0.2 }, { left: '24%', top: '70%', size: 3, delay: 0.8 }, { left: '36%', top: '18%', size: 4, delay: 1.1 }, { left: '49%', top: '62%', size: 3, delay: 0.4 }, { left: '58%', top: '36%', size: 4, delay: 1.5 }, { left: '69%', top: '72%', size: 3, delay: 0.9 }, { left: '82%', top: '26%', size: 4, delay: 0.1 }, { left: '89%', top: '56%', size: 3, delay: 1.2 }];
const SHOULD_USE_NATIVE_DRIVER = Platform.OS !== 'web';
const GLASS_STYLE = Platform.OS === 'web' ? { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } : null;
const NAVBAR_HEIGHT = 88;
const HERO_GRADIENT_TEXT = Platform.OS === 'web'
  ? { color: '#FFFFFF' }
  : { color: '#FFFFFF' };

function hexToRgba(hex, alpha) {
  const clean = hex.replace('#', '');
  const parts = clean.length === 3 ? clean.split('').map((x) => parseInt(x + x, 16)) : [clean.slice(0, 2), clean.slice(2, 4), clean.slice(4, 6)].map((x) => parseInt(x, 16));
  return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
}

function useLoop(duration, outputRange, delay = 0) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.delay(delay * 1000),
      Animated.timing(value, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: SHOULD_USE_NATIVE_DRIVER }),
      Animated.timing(value, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: SHOULD_USE_NATIVE_DRIVER }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [delay, duration, value]);
  return value.interpolate({ inputRange: [0, 1], outputRange });
}

function useHoverAnimation(enabled = true, lift = 10, scaleTo = 1.03, rotateDeg = 0) {
  const progress = useRef(new Animated.Value(0)).current;
  const onHoverChange = (nextValue) => {
    if (!enabled || Platform.OS !== 'web') return;
    Animated.spring(progress, { toValue: nextValue, friction: 8, tension: 90, useNativeDriver: SHOULD_USE_NATIVE_DRIVER }).start();
  };
  const transforms = [
    { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -lift] }) },
    { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, scaleTo] }) },
  ];
  if (rotateDeg) {
    transforms.push({ rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${rotateDeg}deg`] }) });
  }
  return {
    bind: { onHoverIn: () => onHoverChange(1), onHoverOut: () => onHoverChange(0) },
    animatedStyle: {
      transform: transforms,
    },
  };
}

function usePulse(duration = 2400, min = 1, max = 1.08) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(value, { toValue: 1, duration: duration / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: SHOULD_USE_NATIVE_DRIVER }),
      Animated.timing(value, { toValue: 0, duration: duration / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: SHOULD_USE_NATIVE_DRIVER }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [duration, value]);
  return value.interpolate({ inputRange: [0, 1], outputRange: [min, max] });
}

function IconMark({ Icon, color = '#0F172A', size = 18 }) {
  if (Platform.OS !== 'web' || !Icon) return null;
  return <Icon color={color} size={size} />;
}

function Particle({ config, final = false }) {
  const translateY = useLoop(2500 + config.delay * 400, [0, final ? -18 : -26], config.delay);
  const opacity = useLoop(2500 + config.delay * 400, [final ? 0.18 : 0.16, final ? 0.4 : 0.34], config.delay);
  return <Animated.View style={[styles.particle, { width: config.size, height: config.size, borderRadius: config.size / 2, left: config.left, top: config.top, opacity, transform: [{ translateY }] }]} />;
}

function FloatingBlock({ style, delay = 0, distance = 10, children }) {
  const translateY = useLoop(2200 + delay * 500, [0, -distance], delay);
  return <Animated.View style={[style, { transform: [{ translateY }] }]}>{children}</Animated.View>;
}

function RevealSection({ children, scrollY, viewportHeight, style, threshold = 120 }) {
  const [layoutY, setLayoutY] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (revealed || layoutY == null) return;
    if (scrollY + viewportHeight >= layoutY + threshold) {
      setRevealed(true);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: SHOULD_USE_NATIVE_DRIVER }),
        Animated.timing(translateY, { toValue: 0, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: SHOULD_USE_NATIVE_DRIVER }),
      ]).start();
    }
  }, [layoutY, opacity, revealed, scrollY, threshold, translateY, viewportHeight]);

  return <Animated.View onLayout={(e) => setLayoutY(e.nativeEvent.layout.y)} style={[style, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

function StaggerIn({ children, delay = 0, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 520, delay, easing: Easing.out(Easing.cubic), useNativeDriver: SHOULD_USE_NATIVE_DRIVER }),
      Animated.timing(translateY, { toValue: 0, duration: 520, delay, easing: Easing.out(Easing.cubic), useNativeDriver: SHOULD_USE_NATIVE_DRIVER }),
    ]).start();
  }, [delay, opacity, translateY]);

  return <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

function GrowLine({ style, delay = 0 }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: 700, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [delay, progress]);
  return <Animated.View style={[style, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />;
}

function AnimatedBar({ value, delay = 0, color = '#14B8A6', gradient = false }) {
  const progress = useRef(new Animated.Value(0)).current;
  const hover = useHoverAnimation(Platform.OS === 'web', 0, 1.05);

  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: 600, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [delay, progress]);

  const targetHeight = (104 * value) / 100;

  return (
    <Animated.View style={[styles.chartBarWrap, hover.animatedStyle]}>
      <Pressable {...hover.bind} style={styles.chartBarHitArea}>
        <Animated.View
          style={[
            styles.chartBar,
            gradient ? styles.chartBarGradient : { backgroundColor: color },
            {
              height: targetHeight,
              transform: [{ scaleY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) }],
            },
          ]}
        />
      </Pressable>
    </Animated.View>
  );
}

function CountUpNumber({ value, suffix = '', prefix = '', duration = 900, style }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frame;
    const start = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setDisplayValue(Math.round(value * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    tick();
    return () => {
      if (frame) cancelAnimationFrame(frame);
    };
  }, [duration, value]);

  return <Text style={style}>{`${prefix}${displayValue}${suffix}`}</Text>;
}

function Container({ children, style, wide = false }) {
  return <View style={[styles.container, wide && styles.containerWide, style]}>{children}</View>;
}

function GlassPanel({ children, style }) {
  return <View style={[styles.glassPanel, style]}>{children}</View>;
}

function SoftDivider({ style }) {
  return <View style={[styles.sectionDivider, style]} />;
}

function IconBubble({ Icon, accent, size = 20, style }) {
  return (
    <View style={[styles.iconBubble, { backgroundColor: accent[0], boxShadow: `0 16px 30px ${hexToRgba(accent[0], 0.28)}` }, style]}>
      <View style={[styles.iconBubbleOverlay, { backgroundColor: accent[1] }]} />
      <IconMark Icon={Icon} color="#FFFFFF" size={size} />
    </View>
  );
}

function SectionHeader({ title, accent, subtitle, badge, style }) {
  return (
    <View style={[styles.sectionHeader, style]}>
      {badge ? (
        <GlassPanel style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{badge}</Text>
        </GlassPanel>
      ) : null}
      <Text style={styles.sectionTitle}>
        {title}
        {accent ? <Text style={styles.sectionAccent}> {accent}</Text> : null}
      </Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

function AnimatedButton({ label, secondary = false, onPress, icon, style, textStyle }) {
  const hover = useHoverAnimation(Platform.OS === 'web', 4, 1.05);
  return (
    <Animated.View style={[hover.animatedStyle, style]}>
      <Pressable {...hover.bind} onPress={onPress} style={({ pressed }) => [styles.button, secondary ? styles.secondaryButton : styles.primaryButton, pressed && styles.buttonPressed]}>
        <View style={[styles.buttonGlow, secondary ? styles.secondaryButtonGlow : styles.primaryButtonGlow]} />
        {icon ? <IconMark Icon={icon} color={secondary ? '#0F172A' : '#FFFFFF'} size={16} /> : null}
        <Text style={[secondary ? styles.secondaryButtonText : styles.primaryButtonText, textStyle]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function HoverCard({ children, style, pressableStyle, lift = 10, scaleTo = 1.02, rotateDeg = 0 }) {
  const hover = useHoverAnimation(Platform.OS === 'web', lift, scaleTo, rotateDeg);
  return (
    <Animated.View style={[hover.animatedStyle, style]}>
      <Pressable {...hover.bind} style={pressableStyle}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

function MetricCard({ item, style }) {
  const hover = useHoverAnimation(Platform.OS === 'web', 8, 1.02);
  return (
    <Animated.View style={[hover.animatedStyle, style]}>
      <Pressable {...hover.bind} style={styles.valueCard}>
        <IconBubble Icon={item.icon} accent={item.accent} />
        <View style={styles.valueCopy}>
          <Text style={styles.valueStat}>{item.stat}</Text>
          <Text style={styles.valueTitle}>{item.title}</Text>
          <Text style={styles.valueText}>{item.description}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function RatingRow() {
  return <View style={styles.ratingRow}>{Array.from({ length: 5 }).map((_, i) => <Text key={i} style={styles.star}>★</Text>)}</View>;
}

export default function LandingScreen({ navigation, onNavigate }) {
  const { width, height } = useWindowDimensions();
  const [scrollY, setScrollY] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalContent, setModalContent] = useState(null);
  const isWeb = Platform.OS === 'web';
  const isLargeDesktop = width >= 1100;
  const isDesktop = width >= 900;
  const isTablet = width >= 768;
  const isMobile = width < 768;
  const testimonialFade = useRef(new Animated.Value(1)).current;
  const ctaGlow = useLoop(3200, [0.72, 1], 0.1);
  const finalUnderlineWidth = useRef(new Animated.Value(0)).current;
  const stepIconPulse = usePulse(2600, 1, 1.08);
  const chartHeights = useMemo(() => [40, 65, 45, 80, 55, 70, 60], []);
  const heroChartHeights = useMemo(() => [36, 56, 48, 72, 60, 84, 67], []);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(testimonialFade, { toValue: 0, duration: 150, easing: Easing.out(Easing.ease), useNativeDriver: SHOULD_USE_NATIVE_DRIVER }),
      Animated.timing(testimonialFade, { toValue: 1, duration: 260, easing: Easing.out(Easing.ease), useNativeDriver: SHOULD_USE_NATIVE_DRIVER }),
    ]).start();
  }, [currentIndex, testimonialFade]);

  useEffect(() => {
    Animated.timing(finalUnderlineWidth, { toValue: 1, duration: 700, delay: 220, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [finalUnderlineWidth]);

  useEffect(() => {
    if (!isWeb || typeof window === 'undefined' || typeof document === 'undefined') return undefined;

    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousRootHeight = root.style.height;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyHeight = body.style.height;

    root.style.overflow = 'auto';
    root.style.height = 'auto';
    body.style.overflow = 'auto';
    body.style.height = 'auto';

    const handleWindowScroll = () => setScrollY(window.scrollY || window.pageYOffset || 0);
    handleWindowScroll();
    window.addEventListener('scroll', handleWindowScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleWindowScroll);
      root.style.overflow = previousRootOverflow;
      root.style.height = previousRootHeight;
      body.style.overflow = previousBodyOverflow;
      body.style.height = previousBodyHeight;
    };
  }, [isWeb]);

  const sectionProps = useMemo(() => (id) => ({ nativeID: id, id }), []);
  if (!isWeb) return null;

  const goTo = (routeName) => {
    if (navigation?.navigate) return navigation.navigate(routeName);
    if (typeof onNavigate === 'function') onNavigate(routeName);
    return null;
  };

  const scrollToSection = (id) => {
    if (typeof document === 'undefined') return;
    const element = document.getElementById(id);
    if (!element) return;
    const top = element.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0) - NAVBAR_HEIGHT - 20;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  };

  const handleFooterAction = (action) => {
    if (!action) return;
    if (action.type === 'scroll') {
      scrollToSection(action.target);
      return;
    }
    if (action.type === 'legal') {
      setModalContent(LEGAL_CONTENT[action.target]);
      return;
    }
    if (action.type === 'info') {
      setModalContent(INFO_CONTENT[action.target]);
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator
      nestedScrollEnabled
      scrollEnabled
      onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
      scrollEventThrottle={16}
    >
      <View style={styles.page}>
        <Container wide style={styles.navbarShell}>
          <GlassPanel style={[styles.navbar, scrollY > 24 && styles.navbarScrolled, !isDesktop && styles.navbarStack]}>
            <View style={styles.brandWrap}>
              <View style={styles.brandOrb}><Text style={styles.brandOrbText}>S</Text></View>
              <View>
                <Text style={styles.brand}>SocietyHub</Text>
                <Text style={styles.brandMeta}>Modern society operations</Text>
              </View>
            </View>
            {isDesktop ? (
              <View style={styles.navLinks}>
                {NAV_ITEMS.map(([label, id]) => (
                  <Pressable key={label} onPress={() => scrollToSection(id)} style={styles.navLinkButton}>
                    <Text style={styles.navLinkText}>{label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <View style={styles.navActions}>
              <AnimatedButton label="Login" secondary onPress={() => goTo('Login')} style={styles.navCta} />
              <AnimatedButton label="Get Started" onPress={() => goTo('Register')} icon={FiArrowRight} style={styles.navCta} />
            </View>
          </GlassPanel>
        </Container>

        <View style={styles.heroSection}>
          <View style={styles.heroBackground}>
            <View style={styles.heroImageLayer} />
            <View style={styles.heroImageOverlay} />
          </View>

          <Container wide>
            <RevealSection scrollY={scrollY} viewportHeight={height} style={[styles.heroGlassWrap, !isLargeDesktop && styles.heroContentStack]}>
              <View style={[styles.heroContent, !isLargeDesktop && styles.heroContentStack]}>
              <View style={[styles.heroCopy, !isLargeDesktop && styles.heroCopyCentered]}>
                <Text style={[styles.heroTitle, !isDesktop && styles.heroTitleCompact]}>
                  Your society. <Text style={HERO_GRADIENT_TEXT}>Smarter. Connected.</Text>
                </Text>
                <Text style={[styles.heroSubtitle, !isLargeDesktop && styles.heroSubtitleCentered]}>
                  One calm platform for operations, communication, and emergency response.
                </Text>

                <View style={[styles.heroTrustRow, isMobile && styles.heroActionsStack]}>
                  {['Resident-first UX', '6-digit access', 'Emergency ready'].map((item) => (
                    <GlassPanel key={item} style={styles.heroTrustChip}>
                      <Text style={styles.heroTrustChipText}>{item}</Text>
                    </GlassPanel>
                  ))}
                </View>

                <View style={[styles.heroActions, isMobile && styles.heroActionsStack]}>
                  <AnimatedButton label="Get Started" onPress={() => goTo('Register')} icon={FiArrowRight} />
                  <AnimatedButton label="Login" secondary onPress={() => goTo('Login')} icon={FiPlay} />
                </View>

                <View style={[styles.heroStatsRow, isMobile && styles.stackGrid]}>
                  {[
                    ['99.9%', 'Uptime'],
                    ['2 min', 'Avg response'],
                    ['All roles', 'One workspace'],
                  ].map(([value, label]) => (
                    <GlassPanel key={label} style={[styles.heroStatCard, isMobile && styles.fullWidth]}>
                      <Text style={styles.heroStatValue}>{value}</Text>
                      <Text style={styles.heroStatLabel}>{label}</Text>
                    </GlassPanel>
                  ))}
                </View>
              </View>

              <View style={[styles.heroVisualColumn, !isLargeDesktop && styles.heroVisualColumnStack]}>
                <FloatingBlock style={styles.heroMockTilt} delay={0.1} distance={isMobile ? 3 : 10}>
                  <View style={[styles.heroMockFrame, GLASS_STYLE]}>
                  <View style={styles.heroMockFrameGlow} />
                  <View style={styles.heroMockTop}>
                    <View style={styles.browserDots}>
                      <View style={[styles.browserDot, { backgroundColor: '#FB7185' }]} />
                      <View style={[styles.browserDot, { backgroundColor: '#FBBF24' }]} />
                      <View style={[styles.browserDot, { backgroundColor: '#34D399' }]} />
                    </View>
                    <GlassPanel style={styles.browserAddress}><Text style={styles.browserAddressText}>societyhub.app/workspace</Text></GlassPanel>
                  </View>

                  <View style={[styles.heroMockBody, !isDesktop && styles.stackGrid]}>
                    <GlassPanel style={[styles.heroSidebarCard, !isDesktop && styles.fullWidth]}>
                      <View style={styles.sidebarPill}>
                        <IconMark Icon={FiGrid} color="#0EA5E9" size={16} />
                        <Text style={styles.sidebarPillText}>Community Hub</Text>
                      </View>
                      {['Dashboard', 'Requests', 'Announcements', 'Facilities'].map((item, index) => (
                        <View key={item} style={[styles.sidebarItem, index === 0 && styles.sidebarItemActive]}>
                          <View style={[styles.sidebarItemDot, index === 0 && styles.sidebarItemDotActive]} />
                          <Text style={[styles.sidebarItemText, index === 0 && styles.sidebarItemTextActive]}>{item}</Text>
                        </View>
                      ))}
                    </GlassPanel>

                    <View style={[styles.heroMainPanel, !isDesktop && styles.fullWidth]}>
                      <View style={styles.heroMainMetrics}>
                        {[
                          ['Open issues', '12', '#0EA5E9'],
                          ['Bookings', '28', '#14B8A6'],
                          ['Approvals', '04', '#8B5CF6'],
                        ].map(([label, value, color]) => (
                          <GlassPanel key={label} style={styles.heroMiniStat}>
                            <View style={[styles.heroMiniStatAccent, { backgroundColor: color }]} />
                            <Text style={styles.heroMiniStatValue}>{value}</Text>
                            <Text style={styles.heroMiniStatLabel}>{label}</Text>
                          </GlassPanel>
                        ))}
                      </View>

                      <GlassPanel style={styles.heroChartCard}>
                        <View style={styles.panelHeaderRow}>
                          <View>
                            <Text style={styles.panelEyebrow}>Operations</Text>
                            <Text style={styles.panelTitle}>This week</Text>
                          </View>
                          <GlassPanel style={styles.pulseBadge}>
                            <View style={styles.liveDot} />
                            <Text style={styles.pulseBadgeText}>Live</Text>
                          </GlassPanel>
                        </View>
                        <View style={styles.chartBars}>
                          {heroChartHeights.map((bar, index) => (
                            <AnimatedBar key={`hero-bar-${index}`} value={bar} delay={index * 70} gradient />
                          ))}
                        </View>
                        <View style={styles.chartLabels}>
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => <Text key={label} style={styles.chartLabel}>{label}</Text>)}
                        </View>
                      </GlassPanel>
                    </View>
                  </View>
                  </View>
                </FloatingBlock>
              </View>
              </View>
            </RevealSection>
          </Container>
          <View style={styles.heroFade} />
        </View>

        <RevealSection scrollY={scrollY} viewportHeight={height} style={{ width: '100%' }}>
          <Container>
            <View style={[styles.valueGrid, !isTablet && styles.stackGrid]}>
              {VALUE_ITEMS.map((item) => <MetricCard key={item.title} item={item} style={[styles.flexCard, !isTablet && styles.fullWidth]} />)}
            </View>
          </Container>
        </RevealSection>
        <SoftDivider />

        <RevealSection scrollY={scrollY} viewportHeight={height} style={[styles.sectionMuted, { width: '100%' }]}>
          <Container>
            <SectionHeader title="Built for" accent="Every Role" subtitle="Whether you're a resident, admin, or managing multiple communities, SocietyHub adapts with clarity, speed, and polish." />
            <View style={[styles.roleGrid, !isTablet && styles.stackGrid]}>
              {ROLE_ITEMS.map((role) => {
                return (
                    <HoverCard key={role.title} style={[styles.flexCard, !isTablet && styles.fullWidth]} pressableStyle={[styles.roleCard, { boxShadow: `0 28px 48px ${role.shadow}` }]} lift={10} scaleTo={1.02}>
                      <View style={[styles.roleGlow, { backgroundColor: hexToRgba(role.accent[0], 0.11) }]} />
                      <View style={styles.roleCardTop}>
                        <IconBubble Icon={role.icon} accent={role.accent} size={22} />
                        <GlassPanel style={styles.roleTag}><Text style={styles.roleTagText}>{role.title}</Text></GlassPanel>
                      </View>
                      <Text style={styles.roleTitle}>{role.title}</Text>
                      <Text style={styles.roleDescription}>{role.description}</Text>
                      <View style={styles.roleList}>
                        {role.features.map((feature) => (
                          <View key={feature} style={styles.roleListItem}>
                            <View style={[styles.roleDot, { backgroundColor: role.accent[0] }]} />
                            <Text style={styles.roleListText}>{feature}</Text>
                          </View>
                        ))}
                      </View>
                  </HoverCard>
                );
              })}
            </View>
          </Container>
        </RevealSection>
        <SoftDivider />

        <RevealSection {...sectionProps('features')} scrollY={scrollY} viewportHeight={height} style={{ width: '100%' }}>
          <Container>
            <SectionHeader title="Everything You Need," accent="All in One Place" subtitle="Premium workflows designed to streamline society management without adding complexity." />
            <View style={[styles.featureGrid, !isDesktop && styles.stackGrid]}>
              {FEATURE_ITEMS.map((feature) => {
                return (
                  <HoverCard key={feature.title} style={[styles.flexCard, !isDesktop && styles.fullWidth]} pressableStyle={styles.featureCard} lift={12} scaleTo={1.025}>
                      <View style={styles.featureGlowWrap}>
                        <View style={[styles.featureGlow, { backgroundColor: hexToRgba(feature.accent[0], 0.18) }]} />
                      </View>
                      <IconBubble Icon={feature.icon} accent={feature.accent} size={20} />
                      <Text style={styles.featureTitle}>{feature.title}</Text>
                      <Text style={styles.featureDescription}>{feature.description}</Text>
                  </HoverCard>
                );
              })}
            </View>
          </Container>
        </RevealSection>
        <SoftDivider />

        <RevealSection {...sectionProps('how-it-works')} scrollY={scrollY} viewportHeight={height} style={[styles.sectionMuted, { width: '100%' }]}>
          <Container>
            <SectionHeader title="Get Started in" accent="4 Simple Steps" subtitle="A clean onboarding path with just enough structure to keep communities secure and moving fast." />
            <View style={styles.stepsWrap}>
              {isLargeDesktop ? <GrowLine style={styles.stepsLine} delay={180} /> : null}
              <View style={[styles.stepsGrid, !isDesktop && styles.stackGrid]}>
                {STEP_ITEMS.map((step, index) => (
                  <StaggerIn key={step.title} delay={index * 100} style={[styles.stepCard, !isDesktop && styles.fullWidth]}>
                    <FloatingBlock style={styles.fullWidth} delay={index * 0.16} distance={isMobile ? 2 : 8}>
                      <GlassPanel style={styles.stepCardInner}>
                        <View style={styles.stepCircleWrap}>
                          <View style={styles.stepConnectorGlow} />
                          <View style={styles.stepOuterCircle}>
                            <Animated.View style={[styles.stepInnerCircle, { transform: [{ scale: stepIconPulse }] }]}>
                              <IconMark Icon={step.icon} color="#FFFFFF" size={20} />
                            </Animated.View>
                          </View>
                          <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>{step.step}</Text></View>
                        </View>
                        <Text style={styles.stepTitle}>{step.title}</Text>
                        <Text style={styles.stepDescription}>{step.description}</Text>
                      </GlassPanel>
                    </FloatingBlock>
                  </StaggerIn>
                ))}
              </View>
            </View>

            <View style={[styles.codeExplainer, !isDesktop && styles.stackGrid]}>
              <FloatingBlock style={[styles.codeVisualCard, !isDesktop && styles.fullWidth]} delay={0.2} distance={8}>
                <View style={styles.codeVisualGlow} />
                <GlassPanel style={styles.codeVisualInner}>
                  <View style={styles.codeVisualHeader}>
                    <IconBubble Icon={FiShield} accent={['#2563EB', '#22D3EE']} size={22} />
                    <GlassPanel style={styles.codeBadge}>
                      <Text style={styles.codeBadgeText}>6-digit code</Text>
                    </GlassPanel>
                  </View>
                  <Text style={styles.codeDigits}>482 761</Text>
                  <Text style={styles.codeVisualCopy}>Secure join code verified by your society admin</Text>
                  <View style={styles.codeFlowRow}>
                    {['Invite', 'Verify', 'Join'].map((label) => (
                      <View key={label} style={styles.codeFlowItem}>
                        <Text style={styles.codeFlowText}>{label}</Text>
                      </View>
                    ))}
                  </View>
                </GlassPanel>
              </FloatingBlock>

              <View style={[styles.codeCopy, !isDesktop && styles.fullWidth]}>
                <Text style={styles.codeEyebrow}>What is a Society Code?</Text>
                <Text style={styles.codeTitle}>A trusted shortcut into the right community.</Text>
                <Text style={styles.codeDescription}>
                  Residents enter one short code and land in the correct building, workflow, and approval queue.
                </Text>
              </View>
            </View>
          </Container>
        </RevealSection>
        <SoftDivider style={styles.dashboardDivider} />

        <RevealSection scrollY={scrollY} viewportHeight={height} style={{ width: '100%' }}>
          <Container>
            <SectionHeader title="A Dashboard That" accent="Works for You" subtitle="Focused panels, live numbers, and quick actions for the moments that matter most." style={styles.dashboardHeader} />
            <View style={styles.dashboardShell}>
              <GlassPanel style={[styles.dashboardBrowser, GLASS_STYLE]}>
                <View style={styles.dashboardBrowserTop}>
                  <View style={styles.browserDots}>
                    <View style={[styles.browserDot, { backgroundColor: '#FB7185' }]} />
                    <View style={[styles.browserDot, { backgroundColor: '#FBBF24' }]} />
                    <View style={[styles.browserDot, { backgroundColor: '#34D399' }]} />
                  </View>
                  <GlassPanel style={styles.browserAddress}>
                    <Text style={styles.browserAddressText}>societyhub.app/dashboard</Text>
                  </GlassPanel>
                </View>

                <View style={styles.dashboardBody}>
                  <View style={[styles.dashboardTopGrid, !isDesktop && styles.stackGrid]}>
                    <View style={[styles.statsGrid, !isDesktop && styles.fullWidth]}>
                      {[
                        [FiAlertTriangle, 'Open Issues', 12, '#2563EB', '3 high priority', styles.statBlue],
                        [FiCheckCircle, 'Resolved', 48, '#059669', 'This month', styles.statGreen],
                        [FiClock, 'Pending', 5, '#D97706', 'Awaiting approval', styles.statAmber],
                      ].map(([Icon, label, value, metaColor, metaText, toneStyle], index) => (
                        <StaggerIn key={label} delay={index * 100} style={styles.statCardWrap}>
                          <HoverCard pressableStyle={[styles.statCard, toneStyle]} lift={6} scaleTo={1.02}>
                            <View style={styles.statHeader}>
                              <IconBubble Icon={Icon} accent={index === 0 ? ['#3B82F6', '#60A5FA'] : index === 1 ? ['#10B981', '#34D399'] : ['#F59E0B', '#FBBF24']} size={16} style={styles.statIconWrap} />
                              <Text style={styles.statLabel}>{label}</Text>
                            </View>
                            <CountUpNumber value={value} style={styles.statValue} />
                            <Text style={[styles.statMeta, { color: metaColor }]}>{metaText}</Text>
                          </HoverCard>
                        </StaggerIn>
                      ))}
                    </View>

                    <HoverCard style={[styles.recentCardWrap, !isDesktop && styles.fullWidth]} pressableStyle={styles.recentCard} lift={6} scaleTo={1.02}>
                      <View style={styles.recentHeader}>
                        <IconMark Icon={FiActivity} color="#0EA5E9" size={16} />
                        <Text style={styles.recentTitle}>Recent Activity</Text>
                      </View>
                      {RECENT_ACTIVITY.map(([textValue, timeValue, dotColor, Icon], index) => (
                        <StaggerIn key={textValue} delay={index * 120}>
                          <View style={styles.recentItem}>
                            <View style={[styles.recentIconShell, { backgroundColor: hexToRgba(dotColor, 0.14) }]}>
                              <IconMark Icon={Icon} color={dotColor} size={14} />
                            </View>
                            <Text style={styles.recentText}>{textValue}</Text>
                            <Text style={styles.recentTime}>{timeValue}</Text>
                          </View>
                        </StaggerIn>
                      ))}
                    </HoverCard>
                  </View>

                  <View style={[styles.dashboardBottomGrid, !isDesktop && styles.stackGrid]}>
                    <HoverCard style={[styles.announcementCardWrap, !isDesktop && styles.fullWidth]} pressableStyle={styles.announcementCard} lift={6} scaleTo={1.02}>
                      <View style={styles.recentHeader}>
                        <IconMark Icon={FiBell} color="#14B8A6" size={16} />
                        <Text style={styles.recentTitle}>Latest Announcements</Text>
                      </View>
                      <View style={styles.announcementItem}>
                        <Text style={styles.announcementHeadline}>Water supply maintenance scheduled</Text>
                        <Text style={styles.announcementText}>Building A-C will have water supply interruption on Saturday from 10 AM to 2 PM.</Text>
                      </View>
                      <View style={styles.announcementItem}>
                        <Text style={styles.announcementHeadline}>Annual general meeting</Text>
                        <Text style={styles.announcementText}>All residents are invited to attend the AGM next Sunday at the community hall.</Text>
                      </View>
                    </HoverCard>

                    <HoverCard style={[styles.chartCardWrap, !isDesktop && styles.fullWidth]} pressableStyle={styles.chartCard} lift={6} scaleTo={1.02}>
                      <View style={styles.recentHeader}>
                        <IconMark Icon={FiBarChart2} color="#3B82F6" size={16} />
                        <Text style={styles.recentTitle}>This Week</Text>
                      </View>
                      <View style={styles.chartBars}>
                        {chartHeights.map((bar, index) => (
                          <AnimatedBar key={`bar-${index}`} value={bar} delay={index * 80} gradient />
                        ))}
                      </View>
                      <View style={styles.chartLabels}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => <Text key={label} style={styles.chartLabel}>{label}</Text>)}</View>
                    </HoverCard>
                  </View>
                </View>
              </GlassPanel>
            </View>
          </Container>
        </RevealSection>
        <SoftDivider />

        <RevealSection {...sectionProps('sos')} scrollY={scrollY} viewportHeight={height} style={{ width: '100%' }}>
          <View style={styles.sosSection}>
            <View style={styles.sosBackground} />
            <View style={styles.sosOverlay} />
            <View style={styles.sosPulseWrap}>{[0, 1, 2].map((index) => <FloatingBlock key={`sos-pulse-${index}`} style={[styles.sosPulse, styles[`sosPulse${index}`]]} delay={index} distance={1} />)}</View>
            <Container>
              <View style={[styles.sosGrid, !isDesktop && styles.stackGrid]}>
                <View style={[styles.sosCopy, !isDesktop && styles.fullWidth]}>
                  <GlassPanel style={styles.sosPill}>
                    <View style={styles.sosPingWrap}>
                      <View style={styles.sosPingPulse} />
                      <View style={styles.sosPingCore} />
                    </View>
                    <Text style={styles.sosPillText}>Emergency Response System</Text>
                  </GlassPanel>
                  <Text style={styles.sosTitle}>Instant Help <Text style={styles.sosAccent}>When It Matters Most</Text></Text>
                  <Text style={styles.sosSubtitle}>Our SOS emergency system ensures help is just a tap away. Alert security, management, and designated contacts instantly during critical situations.</Text>
                  <View style={[styles.sosFeaturesGrid, isMobile && styles.stackGrid]}>
                    {SOS_ITEMS.map(([title, description, color, Icon]) => (
                      <GlassPanel key={title} style={[styles.sosFeatureCard, isMobile && styles.fullWidth]}>
                        <View style={[styles.sosFeatureIcon, { backgroundColor: hexToRgba(color, 0.2) }]}>
                          <IconMark Icon={Icon} color={color} size={18} />
                        </View>
                        <View style={styles.sosFeatureCopy}>
                          <Text style={styles.sosFeatureTitle}>{title}</Text>
                          <Text style={styles.sosFeatureText}>{description}</Text>
                        </View>
                      </GlassPanel>
                    ))}
                  </View>
                </View>

                <View style={[styles.phoneWrap, !isDesktop && styles.fullWidth]}>
                  <View style={styles.phoneGlow} />
                  <FloatingBlock style={styles.phoneFrame} delay={0.25} distance={12}>
                    <View style={styles.phoneScreen}>
                      <View style={styles.phoneStatus}>
                        <Text style={styles.phoneStatusText}>9:41</Text>
                        <View style={styles.phoneSignal}>
                          <View style={styles.phoneSignalBar} />
                          <View style={[styles.phoneSignalBar, styles.phoneSignalDim]} />
                        </View>
                      </View>
                      <View style={styles.phoneContent}>
                        <Text style={styles.phonePrompt}>Need emergency assistance?</Text>
                        <FloatingBlock style={styles.sosButtonOuter} delay={0.3} distance={6}>
                          <View style={styles.sosButtonHalo} />
                          <View style={styles.sosButtonInner}><Text style={styles.sosButtonText}>SOS</Text></View>
                        </FloatingBlock>
                        <Text style={styles.phoneHint}>Press and hold for 3 seconds{`\n`}to send emergency alert</Text>
                        <View style={styles.quickContacts}>
                          {['Security', 'Medical', 'Fire'].map((label) => (
                            <GlassPanel key={label} style={styles.quickContact}>
                              <View style={styles.quickContactIcon}><Text style={styles.quickContactIconText}>•</Text></View>
                              <Text style={styles.quickContactLabel}>{label}</Text>
                            </GlassPanel>
                          ))}
                        </View>
                      </View>
                    </View>
                  </FloatingBlock>
                </View>
              </View>
            </Container>
          </View>
        </RevealSection>
        <SoftDivider />

        <RevealSection {...sectionProps('admin')} scrollY={scrollY} viewportHeight={height} style={{ width: '100%' }}>
          <Container>
            <SectionHeader badge="Admin & Super Admin" title="Powerful Tools for" accent="Complete Control" subtitle="Enterprise-grade management capabilities for administrators who need full visibility, insight, and confidence." />
            <View style={[styles.adminSplit, !isDesktop && styles.stackGrid]}>
              <View style={[styles.adminCopyColumn, !isDesktop && styles.fullWidth]}>
                <Text style={styles.adminLead}>From one society to a full portfolio, SocietyHub gives admins deep control without clutter.</Text>
                <View style={[styles.adminGrid, !isDesktop && styles.stackGrid]}>
                  {ADMIN_ITEMS.map(([title, description, Icon]) => {
                    return (
                      <HoverCard key={title} style={[styles.adminGridItem, !isDesktop && styles.fullWidth]} pressableStyle={styles.adminCard} lift={8} scaleTo={1.02}>
                        <View style={styles.adminCardRow}>
                          <IconBubble Icon={Icon} accent={['#2563EB', '#14B8A6']} size={18} />
                          <View style={styles.adminCopy}>
                            <Text style={styles.adminTitle}>{title}</Text>
                            <Text style={styles.adminDescription}>{description}</Text>
                          </View>
                        </View>
                      </HoverCard>
                    );
                  })}
                </View>
              </View>

              <View style={[styles.adminPreviewWrap, !isDesktop && styles.fullWidth]}>
                <FloatingBlock style={styles.adminPreviewShell} delay={0.4} distance={10}>
                  <View style={styles.adminPreviewGlow} />
                  <GlassPanel style={styles.adminPreviewCard}>
                    <View style={styles.adminPreviewHeader}>
                      <View>
                        <Text style={styles.adminPreviewEyebrow}>Admin command center</Text>
                        <Text style={styles.adminPreviewTitle}>Live operational overview</Text>
                      </View>
                      <GlassPanel style={styles.adminPreviewBadge}>
                        <Text style={styles.adminPreviewBadgeText}>Live</Text>
                      </GlassPanel>
                    </View>
                    <View style={styles.adminPreviewStats}>
                      {[
                        ['14', 'Societies'],
                        ['2.4k', 'Residents'],
                        ['98%', 'Resolved SLA'],
                      ].map(([value, label]) => (
                        <View key={label} style={styles.adminPreviewStatCard}>
                          <Text style={styles.adminPreviewStatValue}>{value}</Text>
                          <Text style={styles.adminPreviewStatLabel}>{label}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={styles.adminPreviewList}>
                      {['Approval queues across all sites', 'Broadcasts and policy updates', 'Security and role management'].map((item) => (
                        <View key={item} style={styles.adminPreviewListItem}>
                          <View style={styles.adminPreviewDot} />
                          <Text style={styles.adminPreviewListText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </GlassPanel>
                </FloatingBlock>
              </View>
            </View>
            <View style={[styles.statsShowcase, !isTablet && styles.stackGrid]}>
              {[['99.9%', 'Uptime guarantee'], ['< 50ms', 'Response time'], ['256-bit', 'Encryption']].map(([value, label]) => (
                <GlassPanel key={label} style={[styles.showcaseItem, !isTablet && styles.fullWidth]}>
                  <Text style={styles.showcaseValue}>{value}</Text>
                  <Text style={styles.showcaseLabel}>{label}</Text>
                </GlassPanel>
              ))}
            </View>
          </Container>
        </RevealSection>
        <SoftDivider />

        <RevealSection scrollY={scrollY} viewportHeight={height} style={[styles.sectionMuted, { width: '100%' }]}>
          <Container>
            <SectionHeader title="Trusted by" accent="Communities" subtitle="Residents and management teams rely on SocietyHub to keep daily operations calm, clear, and modern." />
            <HoverCard rotateDeg={-1.5} lift={8} scaleTo={1.02} pressableStyle={styles.testimonialCard}>
              <Animated.View style={{ opacity: testimonialFade, transform: [{ translateY: testimonialFade.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
                <GlassPanel style={[styles.testimonialGlass, GLASS_STYLE]}>
                  <RatingRow />
                  <Text style={styles.quoteMark}>“</Text>
                  <Text style={styles.testimonialText}>{TESTIMONIALS[currentIndex].content}</Text>
                  <View style={styles.testimonialTopRow}>
                    <View style={styles.testimonialAvatar}><Text style={styles.testimonialAvatarText}>{TESTIMONIALS[currentIndex].avatar}</Text></View>
                    <View>
                      <Text style={styles.testimonialName}>{TESTIMONIALS[currentIndex].name}</Text>
                      <Text style={styles.testimonialRole}>{TESTIMONIALS[currentIndex].role}</Text>
                    </View>
                  </View>
                </GlassPanel>
              </Animated.View>
            </HoverCard>
            <View style={styles.avatarRow}>
              {TESTIMONIALS.slice(0, 4).map((item, index) => (
                <Pressable key={item.name} onPress={() => setCurrentIndex(index)} style={[styles.avatarButton, index === currentIndex && styles.avatarButtonActive]}>
                  <Text style={[styles.avatarButtonText, index === currentIndex && styles.avatarButtonTextActive]}>{item.avatar}</Text>
                </Pressable>
              ))}
            </View>
          </Container>
        </RevealSection>
        <SoftDivider />

        <RevealSection scrollY={scrollY} viewportHeight={height} style={{ width: '100%' }}>
          <View style={styles.finalSection}>
            <View style={styles.finalBackground} />
            <View style={styles.finalOverlay} />
            <Container style={styles.finalContainer}>
              <Animated.View style={[styles.finalGlowOrb, { opacity: ctaGlow }]} />
              <View style={styles.finalInner}>
                <Text style={styles.finalTitle}>Transform Your Society <Text style={styles.finalAccent}>Today</Text></Text>
                <Animated.View style={[styles.finalUnderline, { width: finalUnderlineWidth.interpolate({ inputRange: [0, 1], outputRange: [0, 80] }) }]} />
                <Text style={styles.finalSubtitle}>Join communities that have already modernized their operations with a platform built for calm coordination and faster response.</Text>
                <View style={[styles.finalActions, isMobile && styles.heroActionsStack]}>
                  <AnimatedButton label="Get Started Free" onPress={() => goTo('Register')} icon={FiArrowRight} />
                  <AnimatedButton label="Login" secondary onPress={() => goTo('Login')} icon={FiPlay} />
                </View>
                <View style={[styles.trustRow, !isTablet && styles.stackGrid]}>
                  {[
                    [FiShield, 'Enterprise Security'],
                    [FiClock, '24/7 Support'],
                    [FiTrendingUp, 'Cloud Hosted'],
                  ].map(([Icon, label], index) => (
                    <StaggerIn key={label} delay={index * 120}>
                      <GlassPanel style={[styles.trustItem, !isTablet && styles.fullWidth]}>
                        <IconMark Icon={Icon} color="#D6F6FF" size={16} />
                        <Text style={styles.trustText}>{label}</Text>
                      </GlassPanel>
                    </StaggerIn>
                  ))}
                </View>
              </View>
            </Container>
          </View>
        </RevealSection>

        <RevealSection {...sectionProps('contact')} scrollY={scrollY} viewportHeight={height} style={{ width: '100%' }}>
          <View style={styles.footer}>
            <Container>
              <View style={[styles.footerGrid, !isDesktop && styles.stackGrid]}>
                <View style={[styles.footerBrandCol, !isDesktop && styles.fullWidth]}>
                  <View style={styles.footerBrandRow}>
                    <View style={styles.footerLogo}><Text style={styles.footerLogoText}>S</Text></View>
                    <Text style={styles.footerBrandText}>SocietyHub</Text>
                  </View>
                  <Text style={styles.footerBrandCopy}>The modern platform for smarter society management. Connect, manage, and thrive together.</Text>
                </View>
                {Object.entries(FOOTER_LINKS).map(([title, links]) => (
                  <View key={title} style={[styles.footerLinkCol, !isDesktop && styles.fullWidth]}>
                    <Text style={styles.footerColTitle}>{title}</Text>
                    {links.map((link) => (
                      <Pressable key={link.label} onPress={() => handleFooterAction(link.action)} style={styles.footerLinkButton}>
                        <Text style={styles.footerLinkText}>{link.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                ))}
              </View>
              <View style={[styles.footerBottom, !isTablet && styles.footerBottomStack]}>
                <Text style={styles.footerBottomText}>© {new Date().getFullYear()} SocietyHub. All rights reserved.</Text>
                <View style={styles.footerBottomLinks}>
                  {[
                    ['Privacy', 'privacy'],
                    ['Terms', 'terms'],
                    ['Cookies', 'cookies'],
                  ].map(([label, key]) => (
                    <Pressable key={label} onPress={() => handleFooterAction({ type: 'legal', target: key })}>
                      <Text style={styles.footerBottomLink}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </Container>
          </View>
        </RevealSection>
        <Modal animationType="fade" transparent visible={Boolean(modalContent)} onRequestClose={() => setModalContent(null)}>
          <View style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalContent(null)} />
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{modalContent?.title}</Text>
              <Text style={styles.modalText}>{modalContent?.text}</Text>
              <AnimatedButton label="Close" onPress={() => setModalContent(null)} secondary style={styles.modalButton} />
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  absoluteFill: { ...StyleSheet.absoluteFillObject, pointerEvents: 'none' },
  container: { alignSelf: 'center', maxWidth: 1200, paddingHorizontal: 20, width: '100%' },
  containerWide: { maxWidth: 1200, paddingHorizontal: 20 },
  page: { backgroundColor: '#F5FAFF', flexGrow: 1, width: '100%' },
  stackGrid: { alignItems: 'stretch', flexDirection: 'column' },
  fullWidth: { flexBasis: '100%', minWidth: 0, width: '100%' },
  flexCard: { flexBasis: '31%', minWidth: 260 },
  navbarShell: { left: 0, paddingTop: 18, position: 'fixed', right: 0, top: 0, zIndex: 999 },
  glassPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8EDF3',
    borderRadius: 22,
    borderWidth: 1,
  },
  sectionDivider: {
    alignSelf: 'center',
    height: 2,
    marginHorizontal: 24,
    marginVertical: 36,
    maxWidth: 1180,
    opacity: 0.4,
    width: '100%',
    ...(Platform.OS === 'web' ? { backgroundImage: 'linear-gradient(90deg, rgba(59,130,246,0) 0%, rgba(59,130,246,0.55) 48%, rgba(59,130,246,0) 100%)' } : { backgroundColor: 'rgba(59,130,246,0.18)' }),
  },
  particle: { backgroundColor: 'rgba(14,165,233,0.18)', position: 'absolute' },
  heroSection: { minHeight: 860, paddingBottom: 72, paddingTop: NAVBAR_HEIGHT + 48, position: 'relative' },
  heroBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: '#F7FBFF' },
  heroImageLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 1,
    ...(Platform.OS === 'web'
      ? {
          backgroundImage: "url('https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1600&q=80')",
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
        }
      : null),
  },
  heroImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    ...(Platform.OS === 'web'
      ? {
          backgroundImage: 'linear-gradient(90deg, rgba(0,0,0,0.56) 0%, rgba(0,0,0,0.45) 42%, rgba(0,0,0,0.24) 100%)',
        }
      : { backgroundColor: 'rgba(0,0,0,0.45)' }),
  },
  navbar: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
    boxShadow: 'none',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: NAVBAR_HEIGHT,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  navbarScrolled: { boxShadow: '0 10px 24px rgba(15,23,42,0.08)' },
  navbarStack: { alignItems: 'flex-start', gap: 16 },
  brandWrap: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  brandOrb: { alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 14, height: 42, justifyContent: 'center', width: 42 },
  brandOrbText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  brand: { color: '#0F172A', fontSize: 22, fontWeight: '800' },
  brandMeta: { color: '#64748B', fontSize: 12, marginTop: 2 },
  navLinks: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  navLinkButton: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  navLinkText: { color: '#475569', fontSize: 14, fontWeight: '600' },
  navActions: { flexDirection: 'row', gap: 12 },
  navCta: { minWidth: 120 },
  button: { alignItems: 'center', borderRadius: 14, flexDirection: 'row', gap: 10, justifyContent: 'center', minHeight: 52, overflow: 'hidden', paddingHorizontal: 22, position: 'relative' },
  buttonPressed: { transform: [{ scale: 0.985 }] },
  buttonGlow: { borderRadius: 999, height: 78, opacity: 0.22, position: 'absolute', right: -16, top: -20, width: 78 },
  primaryButtonGlow: { backgroundColor: 'rgba(255,255,255,0.2)' },
  secondaryButtonGlow: { backgroundColor: 'rgba(15,23,42,0.08)' },
  primaryButton: { backgroundColor: '#0F172A', boxShadow: '0 14px 32px rgba(15,23,42,0.2)' },
  secondaryButton: { backgroundColor: '#FFFFFF', borderColor: '#DDD', borderWidth: 1, boxShadow: '0 12px 28px rgba(15,23,42,0.1)' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondaryButtonText: { color: '#0F172A', fontSize: 16, fontWeight: '600' },
  heroGlassWrap: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 28,
    paddingVertical: 28,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } : { backgroundColor: 'rgba(255,255,255,0.08)' }),
  },
  heroContent: { alignItems: 'center', flexDirection: 'row', gap: 24, justifyContent: 'space-between' },
  heroContentStack: { alignItems: 'stretch', gap: 28 },
  heroCopy: { flex: 1, maxWidth: 540, zIndex: 2 },
  heroCopyCentered: { maxWidth: '100%', width: '100%' },
  heroPill: { display: 'none' },
  heroPingWrap: { alignItems: 'center', height: 8, justifyContent: 'center', width: 8 },
  heroPingPulse: { backgroundColor: 'rgba(14,165,233,0.22)', borderRadius: 10, height: 18, left: -5, position: 'absolute', top: -5, width: 18 },
  heroPingCore: { backgroundColor: '#0EA5E9', borderRadius: 4, height: 8, width: 8 },
  heroPillText: { color: '#0F172A', fontSize: 14, fontWeight: '700' },
  heroTitle: { color: '#FFFFFF', fontSize: 68, fontWeight: '800', letterSpacing: -2, lineHeight: 72, marginBottom: 16 },
  heroTitleCompact: { fontSize: 48, lineHeight: 54 },
  heroSubtitle: { color: 'rgba(255,255,255,0.84)', fontSize: 18, lineHeight: 28, marginBottom: 20, maxWidth: 480 },
  heroSubtitleCentered: { maxWidth: 720 },
  heroTrustRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  heroTrustChip: { backgroundColor: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.14)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  heroTrustChipText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  heroActions: { flexDirection: 'row', gap: 16, marginBottom: 28 },
  heroActionsStack: { alignItems: 'stretch', flexDirection: 'column' },
  heroStatsRow: { flexDirection: 'row', gap: 14 },
  heroStatCard: { backgroundColor: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.14)', flex: 1, minWidth: 140, paddingHorizontal: 16, paddingVertical: 16 },
  heroStatValue: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  heroStatLabel: { color: 'rgba(226,232,240,0.8)', fontSize: 13, marginTop: 4 },
  heroVisualColumn: { flex: 1, minHeight: 480, position: 'relative', zIndex: 3 },
  heroVisualColumnStack: { minHeight: 360 },
  heroMockTilt: Platform.OS === 'web' ? { transform: [{ rotate: '-2deg' }] } : null,
  heroMockFrame: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 28,
    borderWidth: 1,
    boxShadow: '0 22px 50px rgba(15,23,42,0.26)',
    maxWidth: 520,
    overflow: 'visible',
    padding: 20,
    position: 'relative',
    zIndex: 2,
  },
  heroMockFrameGlow: {
    backgroundColor: 'rgba(103,232,249,0.12)',
    borderRadius: 28,
    bottom: -8,
    left: -8,
    position: 'absolute',
    right: -8,
    top: -8,
  },
  heroMockTop: { alignItems: 'center', flexDirection: 'row', gap: 14, marginBottom: 18 },
  browserDots: { flexDirection: 'row', gap: 8 },
  browserDot: { borderRadius: 999, height: 12, width: 12 },
  browserAddress: { backgroundColor: 'rgba(255,255,255,0.16)', flex: 1, paddingHorizontal: 16, paddingVertical: 10 },
  browserAddressText: { color: 'rgba(255,255,255,0.82)', fontSize: 13 },
  heroMockBody: { alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: 12, overflow: 'visible' },
  heroSidebarCard: { backgroundColor: 'rgba(255,255,255,0.12)', minWidth: 150, padding: 16 },
  sidebarPill: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 999, flexDirection: 'row', gap: 8, marginBottom: 18, paddingHorizontal: 12, paddingVertical: 9 },
  sidebarPillText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  sidebarItem: { alignItems: 'center', borderRadius: 14, flexDirection: 'row', gap: 10, marginBottom: 10, paddingHorizontal: 12, paddingVertical: 10 },
  sidebarItemActive: { backgroundColor: 'rgba(15,23,42,0.92)' },
  sidebarItemDot: { backgroundColor: 'rgba(255,255,255,0.26)', borderRadius: 999, height: 8, width: 8 },
  sidebarItemDotActive: { backgroundColor: '#34D399' },
  sidebarItemText: { color: 'rgba(255,255,255,0.72)', fontSize: 13, fontWeight: '600' },
  sidebarItemTextActive: { color: '#FFFFFF' },
  heroMainPanel: { flex: 1, gap: 16, minWidth: 0 },
  heroMainMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  heroMiniStat: { backgroundColor: 'rgba(255,255,255,0.14)', flex: 1, minWidth: 108, overflow: 'visible', paddingHorizontal: 16, paddingVertical: 16, position: 'relative' },
  heroMiniStatAccent: { borderRadius: 999, height: 56, opacity: 0.14, position: 'absolute', right: -10, top: -10, width: 56 },
  heroMiniStatValue: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  heroMiniStatLabel: { color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 6 },
  heroChartCard: { backgroundColor: 'rgba(255,255,255,0.14)', overflow: 'visible', padding: 20 },
  panelHeaderRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  panelEyebrow: { color: '#BAE6FD', fontSize: 12, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
  panelTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  pulseBadge: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  pulseBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  liveDot: { backgroundColor: '#10B981', borderRadius: 999, height: 8, width: 8 },
  floatingNoticeTop: { display: 'none' },
  floatingNoticeCenter: { display: 'none' },
  floatingNoticeBottom: { display: 'none' },
  floatingNoticeFar: { display: 'none' },
  floatingCard: { display: 'none' },
  floatingCardIcon: { height: 40, width: 40 },
  floatingCardTitle: { color: '#0F172A', fontSize: 14, fontWeight: '700' },
  floatingCardMeta: { color: '#64748B', fontSize: 12, marginTop: 2 },
  floatingBadge: { display: 'none' },
  floatingBadgeValue: { color: '#0F172A', fontSize: 26, fontWeight: '800' },
  floatingBadgeLabel: { color: '#64748B', fontSize: 12, textAlign: 'center' },
  heroFade: {
    ...(Platform.OS === 'web' ? { backgroundImage: 'linear-gradient(180deg, rgba(245,250,255,0) 0%, rgba(245,250,255,0.92) 75%, rgba(245,250,255,1) 100%)' } : { backgroundColor: 'rgba(245,250,255,0.9)' }),
    bottom: 0,
    height: 160,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  valueGrid: { flexDirection: 'row', gap: 20, marginBottom: 36, marginTop: -18 },
  valueCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.74)',
    borderColor: 'rgba(255,255,255,0.84)',
    borderRadius: 26,
    borderWidth: 1,
    boxShadow: '0 20px 40px rgba(15,23,42,0.08)',
    flexDirection: 'row',
    padding: 22,
  },
  iconBubble: { alignItems: 'center', borderRadius: 18, height: 54, justifyContent: 'center', overflow: 'hidden', width: 54 },
  iconBubbleOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.38 },
  valueCopy: { flex: 1, marginLeft: 16 },
  valueStat: { color: '#0EA5E9', fontSize: 12, fontWeight: '800', marginBottom: 6, textTransform: 'uppercase' },
  valueTitle: { color: '#0F172A', fontSize: 18, fontWeight: '800', marginBottom: 6 },
  valueText: { color: '#64748B', fontSize: 14, lineHeight: 22 },
  sectionMuted: { backgroundColor: 'rgba(228,244,255,0.56)', paddingVertical: 104 },
  sectionHeader: { alignItems: 'center', marginBottom: 58 },
  dashboardHeader: { marginBottom: 20 },
  headerBadge: { borderRadius: 999, marginBottom: 22, paddingHorizontal: 16, paddingVertical: 10 },
  headerBadgeText: { color: '#0EA5E9', fontSize: 13, fontWeight: '700' },
  sectionTitle: { color: '#0F172A', fontSize: 44, fontWeight: '800', letterSpacing: -1.2, lineHeight: 52, marginBottom: 14, textAlign: 'center' },
  sectionAccent: { color: '#14B8A6' },
  sectionSubtitle: { color: '#64748B', fontSize: 17, lineHeight: 26, maxWidth: 680, textAlign: 'center' },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between' },
  roleCard: {
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderColor: 'rgba(255,255,255,0.88)',
    borderRadius: 30,
    borderWidth: 1,
    justifyContent: 'space-between',
    minHeight: 360,
    overflow: 'hidden',
    padding: 28,
    position: 'relative',
  },
  roleGlow: { ...StyleSheet.absoluteFillObject },
  roleCardTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  roleTag: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  roleTagText: { color: '#475569', fontSize: 12, fontWeight: '700' },
  roleTitle: { color: '#0F172A', fontSize: 30, fontWeight: '800', marginBottom: 8 },
  roleDescription: { color: '#64748B', fontSize: 15, lineHeight: 22, marginBottom: 18 },
  roleList: { gap: 12 },
  roleListItem: { flexDirection: 'row', gap: 12 },
  roleDot: { borderRadius: 999, height: 9, marginTop: 7, width: 9 },
  roleListText: { color: '#475569', flex: 1, fontSize: 14, lineHeight: 20 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between' },
  featureCard: {
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderColor: 'rgba(255,255,255,0.9)',
    borderRadius: 26,
    borderWidth: 1,
    boxShadow: '0 14px 28px rgba(15,23,42,0.06)',
    minHeight: 246,
    justifyContent: 'space-between',
    overflow: 'hidden',
    padding: 24,
    position: 'relative',
  },
  featureGlowWrap: { ...StyleSheet.absoluteFillObject, pointerEvents: 'none' },
  featureGlow: { borderRadius: 120, height: 140, opacity: 0.6, position: 'absolute', right: -30, top: -30, width: 140 },
  featureTitle: { color: '#0F172A', fontSize: 22, fontWeight: '800', marginBottom: 12, marginTop: 18 },
  featureDescription: { color: '#64748B', fontSize: 15, lineHeight: 22 },
  stepsWrap: { marginBottom: 40, position: 'relative' },
  stepsLine: {
    ...(Platform.OS === 'web' ? { backgroundImage: 'linear-gradient(90deg, rgba(59,130,246,0) 0%, rgba(59,130,246,0.4) 15%, rgba(45,212,191,0.45) 50%, rgba(59,130,246,0.4) 85%, rgba(59,130,246,0) 100%)' } : { backgroundColor: 'rgba(14,165,233,0.16)' }),
    height: 4,
    left: 92,
    position: 'absolute',
    top: 60,
    width: 'calc(100% - 184px)',
  },
  stepsGrid: { flexDirection: 'row', gap: 24 },
  stepCard: { flex: 1, minWidth: 220 },
  stepCardInner: { alignItems: 'center', backgroundColor: '#FFFFFF', minHeight: 246, paddingHorizontal: 18, paddingVertical: 24 },
  stepCircleWrap: { marginBottom: 24, position: 'relative' },
  stepConnectorGlow: { backgroundColor: 'rgba(20,184,166,0.18)', borderRadius: 999, height: 96, left: -8, position: 'absolute', top: -8, width: 96 },
  stepOuterCircle: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: 'rgba(14,165,233,0.18)', borderRadius: 42, borderWidth: 1, height: 84, justifyContent: 'center', width: 84 },
  stepInnerCircle: { alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 32, height: 64, justifyContent: 'center', width: 64 },
  stepBadge: { alignItems: 'center', backgroundColor: '#14B8A6', borderRadius: 999, height: 34, justifyContent: 'center', position: 'absolute', right: -6, top: -4, width: 34 },
  stepBadgeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  stepTitle: { color: '#0F172A', fontSize: 22, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  stepDescription: { color: '#64748B', fontSize: 15, lineHeight: 24, textAlign: 'center' },
  codeExplainer: { alignItems: 'center', flexDirection: 'row', gap: 28, justifyContent: 'space-between' },
  codeVisualCard: { flex: 0.9, minWidth: 300, position: 'relative' },
  codeVisualGlow: { display: 'none' },
  codeVisualInner: { backgroundColor: '#FFFFFF', minHeight: 300, padding: 24 },
  codeVisualHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 26 },
  codeBadge: { backgroundColor: 'rgba(37,99,235,0.1)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  codeBadgeText: { color: '#2563EB', fontSize: 13, fontWeight: '800' },
  codeDigits: { color: '#0F172A', fontSize: 56, fontWeight: '900', letterSpacing: 6, marginBottom: 14 },
  codeVisualCopy: { color: '#64748B', fontSize: 15, lineHeight: 22, marginBottom: 20, maxWidth: 320 },
  codeFlowRow: { flexDirection: 'row', gap: 12 },
  codeFlowItem: { backgroundColor: '#0F172A', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  codeFlowText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  codeCopy: { flex: 1, maxWidth: 560 },
  codeEyebrow: { color: '#0EA5E9', fontSize: 13, fontWeight: '800', letterSpacing: 1.4, marginBottom: 12, textTransform: 'uppercase' },
  codeTitle: { color: '#0F172A', fontSize: 38, fontWeight: '800', letterSpacing: -1.1, lineHeight: 44, marginBottom: 14 },
  codeDescription: { color: '#475569', fontSize: 16, lineHeight: 24, maxWidth: 460 },
  dashboardDivider: { marginTop: 28 },
  dashboardShell: { marginTop: 24, position: 'relative' },
  dashboardBrowser: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderColor: 'rgba(255,255,255,0.9)',
    borderRadius: 34,
    borderWidth: 1,
    boxShadow: '0 16px 36px rgba(15,23,42,0.08)',
  },
  dashboardBrowserTop: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.4)', borderBottomColor: 'rgba(226,232,240,0.8)', borderBottomWidth: 1, flexDirection: 'row', gap: 14, paddingHorizontal: 22, paddingVertical: 16 },
  dashboardBody: { justifyContent: 'space-between', padding: 20 },
  dashboardTopGrid: { flexDirection: 'row', gap: 24 },
  statsGrid: { flex: 2, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCardWrap: { flex: 1, minWidth: 180 },
  statCard: { borderRadius: 24, flex: 1, minWidth: 180, padding: 20 },
  statBlue: { backgroundColor: 'rgba(59,130,246,0.08)' },
  statGreen: { backgroundColor: 'rgba(16,185,129,0.08)' },
  statAmber: { backgroundColor: 'rgba(245,158,11,0.08)' },
  statHeader: { alignItems: 'center', flexDirection: 'row', gap: 10, marginBottom: 12 },
  statIconWrap: { height: 42, width: 42 },
  statLabel: { color: '#64748B', fontSize: 13, fontWeight: '700' },
  statValue: { color: '#0F172A', fontSize: 34, fontWeight: '800' },
  statMeta: { fontSize: 12, marginTop: 6 },
  recentCardWrap: { flex: 1, minWidth: 270 },
  recentCard: { flex: 1, minWidth: 270, padding: 20 },
  recentHeader: { alignItems: 'center', flexDirection: 'row', gap: 8, marginBottom: 18 },
  recentTitle: { color: '#0F172A', fontSize: 16, fontWeight: '800' },
  recentItem: { alignItems: 'center', flexDirection: 'row', gap: 10, marginBottom: 14 },
  recentIconShell: { alignItems: 'center', borderRadius: 12, height: 34, justifyContent: 'center', width: 34 },
  recentText: { color: '#475569', flex: 1, fontSize: 14 },
  recentTime: { color: 'rgba(100,116,139,0.8)', fontSize: 12 },
  dashboardBottomGrid: { flexDirection: 'row', gap: 24, marginTop: 24 },
  announcementCardWrap: { flex: 2, minWidth: 320 },
  announcementCard: { flex: 2, minWidth: 320, padding: 20 },
  announcementItem: { backgroundColor: 'rgba(255,255,255,0.72)', borderColor: 'rgba(255,255,255,0.88)', borderRadius: 18, borderWidth: 1, marginTop: 12, padding: 16 },
  announcementHeadline: { color: '#0F172A', fontSize: 15, fontWeight: '800', marginBottom: 6 },
  announcementText: { color: '#64748B', fontSize: 14, lineHeight: 22 },
  chartCardWrap: { flex: 1, minWidth: 260 },
  chartCard: { flex: 1, minWidth: 260, padding: 20 },
  chartBars: { alignItems: 'flex-end', flexDirection: 'row', gap: 6, height: 120, justifyContent: 'space-between', marginTop: 10, paddingBottom: 10 },
  chartBarWrap: { alignItems: 'flex-end', flex: 1, justifyContent: 'flex-end' },
  chartBarHitArea: { alignItems: 'flex-end', flex: 1, justifyContent: 'flex-end' },
  chartBar: { backgroundColor: '#14B8A6', borderRadius: 6, opacity: 0.9, transformOrigin: 'bottom', width: 14 },
  chartBarGradient: Platform.OS === 'web' ? { backgroundImage: 'linear-gradient(to top, #00c6ff, #0072ff)' } : { backgroundColor: '#0EA5E9' },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 2 },
  chartLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '500', marginTop: 6, textShadow: '0 1px 2px rgba(0,0,0,0.4)' },
  dashboardGlowTop: { display: 'none' },
  dashboardGlowBottom: { display: 'none' },
  sosSection: { overflow: 'hidden', position: 'relative' },
  sosBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#071521',
    ...(Platform.OS === 'web'
      ? {
          backgroundImage: "linear-gradient(135deg, rgba(7,21,33,0.96) 0%, rgba(14,22,35,0.88) 55%, rgba(28,25,42,0.86) 100%), url('https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1400&q=80')",
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
        }
      : null),
  },
  sosOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sosPulseWrap: { display: 'none' },
  sosPulse: { borderColor: 'rgba(239,68,68,0.16)', borderRadius: 999, borderWidth: 1, height: 260, position: 'absolute', width: 260 },
  sosPulse0: { opacity: 0.4, transform: [{ scale: 1 }] },
  sosPulse1: { opacity: 0.22, transform: [{ scale: 1.5 }] },
  sosPulse2: { opacity: 0.1, transform: [{ scale: 2 }] },
  sosGrid: { alignItems: 'center', flexDirection: 'row', gap: 36, justifyContent: 'space-between', paddingVertical: 104, position: 'relative' },
  sosCopy: { flex: 1, maxWidth: 560 },
  sosPill: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.12)', borderRadius: 999, flexDirection: 'row', gap: 10, marginBottom: 24, paddingHorizontal: 16, paddingVertical: 10 },
  sosPingWrap: { alignItems: 'center', height: 8, justifyContent: 'center', width: 8 },
  sosPingPulse: { backgroundColor: 'rgba(248,113,113,0.28)', borderRadius: 8, height: 16, left: -4, position: 'absolute', top: -4, width: 16 },
  sosPingCore: { backgroundColor: '#F87171', borderRadius: 4, height: 8, width: 8 },
  sosPillText: { color: '#FCA5A5', fontSize: 14, fontWeight: '700' },
  sosTitle: { color: '#FFFFFF', fontSize: 48, fontWeight: '800', lineHeight: 58, marginBottom: 18 },
  sosAccent: { color: '#F87171' },
  sosSubtitle: { color: 'rgba(255,255,255,0.88)', fontSize: 17, lineHeight: 26, marginBottom: 32, maxWidth: 460 },
  sosFeaturesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  sosFeatureCard: { alignItems: 'center', backgroundColor: 'rgba(10,15,24,0.42)', borderColor: 'rgba(255,255,255,0.08)', flexBasis: '47%', flexDirection: 'row', gap: 14, minHeight: 92, minWidth: 220, padding: 16 },
  sosFeatureIcon: { alignItems: 'center', borderRadius: 12, height: 42, justifyContent: 'center', width: 42 },
  sosFeatureCopy: { flex: 1 },
  sosFeatureTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  sosFeatureText: { color: 'rgba(255,255,255,0.72)', fontSize: 13 },
  phoneWrap: { alignItems: 'center', flex: 1, justifyContent: 'center', minWidth: 320, position: 'relative' },
  phoneGlow: { display: 'none' },
  phoneFrame: { backgroundColor: '#0B1220', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 48, borderWidth: 1, boxShadow: '0 30px 50px rgba(0,0,0,0.34)', height: 500, padding: 12, width: 288 },
  phoneScreen: { backgroundColor: '#071521', borderRadius: 38, flex: 1, overflow: 'hidden' },
  phoneStatus: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 14 },
  phoneStatusText: { color: 'rgba(255,255,255,0.82)', fontSize: 12 },
  phoneSignal: { flexDirection: 'row', gap: 4 },
  phoneSignalBar: { backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 3, height: 8, width: 18 },
  phoneSignalDim: { opacity: 0.4 },
  phoneContent: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  phonePrompt: { color: 'rgba(255,255,255,0.62)', fontSize: 14, marginBottom: 28 },
  sosButtonOuter: { alignItems: 'center', backgroundColor: '#DC2626', borderRadius: 84, boxShadow: '0 12px 28px rgba(239,68,68,0.35)', height: 168, justifyContent: 'center', position: 'relative', width: 168 },
  sosButtonHalo: { display: 'none' },
  sosButtonInner: { alignItems: 'center', backgroundColor: '#F87171', borderRadius: 66, height: 132, justifyContent: 'center', width: 132 },
  sosButtonText: { color: '#FFFFFF', fontSize: 38, fontWeight: '800' },
  phoneHint: { color: 'rgba(255,255,255,0.46)', fontSize: 12, lineHeight: 18, marginTop: 28, textAlign: 'center' },
  quickContacts: { flexDirection: 'row', gap: 12, marginTop: 28 },
  quickContact: { alignItems: 'center', backgroundColor: 'rgba(10,15,24,0.52)', gap: 8, paddingHorizontal: 10, paddingVertical: 12 },
  quickContactIcon: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 24, height: 44, justifyContent: 'center', width: 44 },
  quickContactIconText: { color: 'rgba(255,255,255,0.75)', fontSize: 18 },
  quickContactLabel: { color: 'rgba(255,255,255,0.58)', fontSize: 12 },
  adminSplit: { alignItems: 'stretch', flexDirection: 'row', gap: 28 },
  adminCopyColumn: { flex: 1 },
  adminLead: { color: '#475569', fontSize: 18, lineHeight: 30, marginBottom: 24, maxWidth: 640 },
  adminGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, justifyContent: 'space-between' },
  adminGridItem: { flexBasis: '48%', minWidth: 250 },
  adminCard: {
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderColor: 'rgba(255,255,255,0.9)',
    borderRadius: 24,
    borderWidth: 1,
    boxShadow: '0 20px 36px rgba(15,23,42,0.08)',
    minHeight: 144,
    padding: 24,
  },
  adminCardRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 16 },
  adminCopy: { flex: 1 },
  adminTitle: { color: '#0F172A', fontSize: 18, fontWeight: '800', marginBottom: 6 },
  adminDescription: { color: '#64748B', fontSize: 14, lineHeight: 22 },
  adminPreviewWrap: { flex: 0.95, minWidth: 320, position: 'relative' },
  adminPreviewShell: { flex: 1, position: 'relative' },
  adminPreviewGlow: { display: 'none' },
  adminPreviewCard: { backgroundColor: '#071521', borderColor: 'rgba(255,255,255,0.08)', minHeight: 420, overflow: 'hidden', padding: 28 },
  adminPreviewHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  adminPreviewEyebrow: { color: '#67E8F9', fontSize: 12, fontWeight: '800', letterSpacing: 1.2, marginBottom: 6, textTransform: 'uppercase' },
  adminPreviewTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  adminPreviewBadge: { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  adminPreviewBadgeText: { color: '#BAE6FD', fontSize: 12, fontWeight: '800' },
  adminPreviewStats: { flexDirection: 'row', gap: 14, marginBottom: 24 },
  adminPreviewStatCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 18, flex: 1, minHeight: 96, padding: 16 },
  adminPreviewStatValue: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', marginBottom: 8 },
  adminPreviewStatLabel: { color: 'rgba(255,255,255,0.64)', fontSize: 13 },
  adminPreviewList: { gap: 14 },
  adminPreviewListItem: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18, flexDirection: 'row', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  adminPreviewDot: { backgroundColor: '#22D3EE', borderRadius: 999, height: 10, width: 10 },
  adminPreviewListText: { color: 'rgba(255,255,255,0.82)', flex: 1, fontSize: 14, lineHeight: 22 },
  statsShowcase: { flexDirection: 'row', gap: 24, marginTop: 56 },
  showcaseItem: { alignItems: 'center', flex: 1, paddingHorizontal: 18, paddingVertical: 24 },
  showcaseValue: { color: '#0EA5E9', fontSize: 40, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  showcaseLabel: { color: '#64748B', fontSize: 16, textAlign: 'center' },
  testimonialDesktopTrack: { display: 'none' },
  testimonialDesktopCard: { display: 'none' },
  testimonialCard: { alignSelf: 'center', backgroundColor: 'transparent', borderRadius: 30, maxWidth: 720, width: '100%' },
  testimonialGlass: { backgroundColor: 'rgba(255,255,255,0.6)', borderColor: 'rgba(103,232,249,0.36)', borderRadius: 30, borderWidth: 1, boxShadow: '0 22px 44px rgba(15,23,42,0.12)', minHeight: 0, padding: 32, width: '100%' },
  testimonialTopRow: { alignItems: 'center', flexDirection: 'row', gap: 14, marginTop: 18 },
  quoteMark: { color: 'rgba(14,165,233,0.18)', fontSize: 48, fontWeight: '800', lineHeight: 44, marginBottom: 8 },
  testimonialText: { color: '#0F172A', fontSize: 18, lineHeight: 30, maxWidth: 560 },
  testimonialAvatar: { alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 24, height: 48, justifyContent: 'center', width: 48 },
  testimonialAvatarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  testimonialName: { color: '#0F172A', fontSize: 16, fontWeight: '800' },
  testimonialRole: { color: '#64748B', fontSize: 13 },
  ratingRow: { flexDirection: 'row', gap: 4, marginTop: 18 },
  star: { color: '#FBBF24', fontSize: 16 },
  dotsRow: { display: 'none' },
  dotButton: { display: 'none' },
  dotButtonActive: { display: 'none' },
  avatarRow: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'center', marginTop: 22 },
  avatarButton: { alignItems: 'center', backgroundColor: '#E2E8F0', borderColor: '#E2E8F0', borderRadius: 999, borderWidth: 1, boxShadow: '0 8px 18px rgba(15,23,42,0.08)', height: 44, justifyContent: 'center', width: 44 },
  avatarButtonActive: { backgroundColor: '#0F172A', borderColor: '#67E8F9', boxShadow: '0 12px 24px rgba(103,232,249,0.22)' },
  avatarButtonText: { color: '#475569', fontSize: 14, fontWeight: '700' },
  avatarButtonTextActive: { color: '#FFFFFF' },
  finalSection: { overflow: 'hidden', position: 'relative', paddingVertical: 24 },
  finalBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
  },
  finalOverlay: { display: 'none' },
  finalContainer: { paddingVertical: 40, position: 'relative' },
  finalGlowOrb: { alignSelf: 'center', backgroundColor: 'rgba(34,211,238,0.12)', borderRadius: 220, height: 180, position: 'absolute', top: 28, width: 520 },
  finalInner: { alignItems: 'center', backgroundColor: '#0F172A', paddingHorizontal: 26, paddingVertical: 40, width: '100%' },
  finalTitle: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', lineHeight: 42, marginBottom: 18, textAlign: 'center' },
  finalAccent: { color: '#67E8F9' },
  finalUnderline: { backgroundColor: '#67E8F9', borderRadius: 999, height: 4, marginBottom: 18, opacity: 0.9 },
  finalSubtitle: { color: 'rgba(255,255,255,0.82)', fontSize: 18, lineHeight: 30, marginBottom: 24, maxWidth: 720, textAlign: 'center' },
  finalActions: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginTop: 8 },
  trustRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 24 },
  trustItem: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.25)', borderWidth: 1, flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  trustText: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  footer: { backgroundColor: '#F5FAFF', borderTopColor: 'rgba(226,232,240,0.8)', borderTopWidth: 1, paddingBottom: 24, paddingTop: 56 },
  footerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between' },
  footerBrandCol: { flex: 2, maxWidth: 320 },
  footerBrandRow: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 18 },
  footerLogo: { alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 14, height: 40, justifyContent: 'center', width: 40 },
  footerLogoText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  footerBrandText: { color: '#0F172A', fontSize: 22, fontWeight: '800' },
  footerBrandCopy: { color: '#64748B', fontSize: 14, lineHeight: 24, marginBottom: 24 },
  footerLinkCol: { minWidth: 140 },
  footerColTitle: { color: '#0F172A', fontSize: 16, fontWeight: '800', marginBottom: 16 },
  footerLinkButton: { alignSelf: 'flex-start', paddingVertical: 2 },
  footerLinkText: { color: '#64748B', fontSize: 14, marginBottom: 12 },
  footerBottom: { borderTopColor: 'rgba(226,232,240,0.8)', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 56, paddingTop: 28 },
  footerBottomStack: { alignItems: 'flex-start', gap: 12 },
  footerBottomText: { color: '#64748B', fontSize: 14 },
  footerBottomLinks: { flexDirection: 'row', gap: 24 },
  footerBottomLink: { color: '#64748B', fontSize: 14 },
  modalOverlay: { alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.48)', flex: 1, justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: 24, borderWidth: 1, boxShadow: '0 26px 50px rgba(15,23,42,0.18)', maxWidth: 520, padding: 28, width: '100%' },
  modalTitle: { color: '#0F172A', fontSize: 28, fontWeight: '800', marginBottom: 12 },
  modalText: { color: '#64748B', fontSize: 15, lineHeight: 24 },
  modalButton: { marginTop: 20, minWidth: 120, alignSelf: 'flex-start' },
});

