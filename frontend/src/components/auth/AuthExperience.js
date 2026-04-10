import React, { useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Alert,
  Animated,
  Easing,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { auth } from '../../config/firebase';
import SocietyHubLogo, { SocietyHubLoader } from '../branding/SocietyHubLogo';
import { useAuth } from '../../context/AuthContext';
import colors from '../../design/colors';
import shadows from '../../design/shadows';
import spacing from '../../design/spacing';
import typography from '../../design/typography';
import {
  isHardcodedSuperAdminCredential,
  isSuperAdminEligible,
  loginAuthUser,
  logoutAuthUser,
  normalizePhoneNumber,
  registerAuthUser,
  sendPasswordReset,
  signInWithGoogle,
} from '../../services/authService';
import { createSocietyRequest, getSocietyByCode } from '../../services/societyService';
import { createUserDocument, getUserDocument } from '../../services/userService';

const REMEMBER_ME_KEY = 'societyhub.remember_me';
const REMEMBER_EMAIL_KEY = 'societyhub.remembered_email';
const GOOGLE_AVAILABLE = Platform.OS === 'web';
const emailPattern = /\S+@\S+\.\S+/;

const RESIDENT_STEPS = [
  { key: 'basic', label: 'Personal Details' },
  { key: 'residence', label: 'Residence Setup' },
  { key: 'join', label: 'Confirm & Join' },
];

const ADMIN_STEPS = [
  { key: 'basic', label: 'Personal Details' },
  { key: 'residence', label: 'Residence Setup' },
  { key: 'society', label: 'Society Request' },
];

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1800&q=80';
const PREMIUM_WEB_HERO_IMAGE =
  'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1800&q=80';
const SHOULD_USE_NATIVE_DRIVER = Platform.OS !== 'web';
const PREMIUM_FEATURES = [
  { key: 'tracking', label: 'Real-time issue tracking' },
  { key: 'communication', label: 'Communication with residents' },
  { key: 'approvals', label: 'Smart approvals' },
];

const buildStepFields = (accountType, hasAuthenticatedUser) => {
  const basicFields = ['name', 'email', 'phone'];
  const residenceFields = hasAuthenticatedUser ? ['flat', 'wing'] : ['password', 'flat', 'wing'];

  if (accountType === 'admin') {
    return [basicFields, residenceFields, ['societyName']];
  }

  return [basicFields, residenceFields, ['societyCode']];
};

const markFieldsTouched = (setTouched, fields) => {
  setTouched((prev) => {
    const next = { ...prev };
    fields.forEach((field) => {
      next[field] = true;
    });
    return next;
  });
};

const FieldLabel = ({ label, error, hint, premium = false }) => (
  <View style={styles.fieldHeader}>
    <Text style={[styles.fieldLabel, premium && styles.fieldLabelPremium]}>{label}</Text>
    {hint ? <Text style={[styles.fieldHint, premium && styles.fieldHintPremium]}>{hint}</Text> : null}
    {error ? <Text style={styles.fieldError}>{error}</Text> : null}
  </View>
);

const EyeIcon = ({ open = false, color = '#64748B' }) => (
  <Svg height="18" viewBox="0 0 24 24" width="18">
    <Path
      d="M2.5 12C4.6 8.1 8 6 12 6C16 6 19.4 8.1 21.5 12C19.4 15.9 16 18 12 18C8 18 4.6 15.9 2.5 12Z"
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
    <Path
      d="M12 9.3C13.49 9.3 14.7 10.51 14.7 12C14.7 13.49 13.49 14.7 12 14.7C10.51 14.7 9.3 13.49 9.3 12C9.3 10.51 10.51 9.3 12 9.3Z"
      fill={open ? color : 'none'}
      stroke={color}
      strokeWidth="1.8"
    />
    {!open ? <Path d="M4 20L20 4" stroke={color} strokeLinecap="round" strokeWidth="1.8" /> : null}
  </Svg>
);

const CheckIcon = ({ color = '#2563EB' }) => (
  <Svg height="16" viewBox="0 0 20 20" width="16">
    <Path
      d="M4 10.5L8 14.5L16 5.5"
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.2"
    />
  </Svg>
);

const PremiumFeatureIcon = ({ type, color = '#CFFAFE' }) => {
  if (type === 'communication') {
    return (
      <Svg height="18" viewBox="0 0 24 24" width="18">
        <Path
          d="M7 18L3.5 20V6.8C3.5 5.8 4.3 5 5.3 5H18.7C19.7 5 20.5 5.8 20.5 6.8V16.2C20.5 17.2 19.7 18 18.7 18H7Z"
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
        <Path
          d="M7.5 9H16.5M7.5 12H16.5M7.5 15H12.5"
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeWidth="1.7"
        />
      </Svg>
    );
  }

  if (type === 'approvals') {
    return (
      <Svg height="18" viewBox="0 0 24 24" width="18">
        <Path
          d="M12 3.7L18.2 6.3V11.2C18.2 15.4 15.8 18.4 12 20.3C8.2 18.4 5.8 15.4 5.8 11.2V6.3L12 3.7Z"
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
        <Path
          d="M9.3 11.9L11.2 13.8L14.9 10.1"
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </Svg>
    );
  }

  return (
    <Svg height="18" viewBox="0 0 24 24" width="18">
      <Path
        d="M12 4.2L13.9 8.1L18.2 8.7L15.1 11.7L15.8 16L12 14L8.2 16L8.9 11.7L5.8 8.7L10.1 8.1L12 4.2Z"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </Svg>
  );
};

const GradientFill = () => (
  <View style={StyleSheet.absoluteFillObject}>
    <Svg height="100%" preserveAspectRatio="none" width="100%">
      <Defs>
        <LinearGradient id="buttonGradient" x1="0%" x2="100%" y1="100%" y2="0%">
          <Stop offset="0%" stopColor="#2563EB" />
          <Stop offset="100%" stopColor="#10B981" />
        </LinearGradient>
      </Defs>
      <Rect fill="url(#buttonGradient)" height="100%" width="100%" x="0" y="0" />
    </Svg>
  </View>
);

const AuthInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  hint,
  secureTextEntry,
  rightAction,
  onBlur,
  keyboardType,
  autoCapitalize = 'none',
  autoCorrect = false,
  editable = true,
  premium = false,
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.fieldBlock}>
      <FieldLabel error={error} hint={hint} label={label} premium={premium} />
      <View
        style={[
          styles.inputShell,
          premium && styles.inputShellPremium,
          focused && styles.inputShellFocused,
          focused && premium && styles.inputShellFocusedPremium,
          error && styles.inputShellError,
          !editable && styles.inputShellDisabled,
        ]}
      >
        <TextInput
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={editable}
          keyboardType={keyboardType}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          placeholderTextColor={premium ? '#888888' : '#94A3B8'}
          secureTextEntry={secureTextEntry}
          selectionColor="#2563EB"
          style={[styles.input, premium && styles.inputPremium]}
          value={value}
        />
        {rightAction ? <View style={styles.inputAdornment}>{rightAction}</View> : null}
      </View>
    </View>
  );
};

const ActionButton = ({ title, onPress, loading, disabled, variant = 'primary', premium = false }) => (
  <Pressable
    accessibilityRole="button"
    disabled={disabled || loading}
    onPress={onPress}
    style={({ hovered, pressed }) => [
      styles.button,
      premium && styles.buttonPremium,
      variant === 'secondary' ? styles.buttonSecondary : styles.buttonPrimary,
      premium && variant === 'primary' && styles.buttonPrimaryPremium,
      premium && variant === 'secondary' && styles.buttonSecondaryPremium,
      hovered && Platform.OS === 'web' && !disabled && !loading && styles.buttonHovered,
      hovered && premium && Platform.OS === 'web' && !disabled && !loading && styles.buttonHoveredPremium,
      pressed && styles.buttonPressed,
      (disabled || loading) && styles.buttonDisabled,
    ]}
  >
    {variant === 'primary' ? <GradientFill /> : null}
    {loading ? (
      <SocietyHubLoader gradient={variant === 'secondary' ? 'brand' : 'dark'} size={24} />
    ) : (
      <View style={styles.buttonContent}>
        {variant === 'secondary' ? (
          <View style={[styles.googleBadge, premium && styles.googleBadgePremium]}>
            <Text style={[styles.googleBadgeText, premium && styles.googleBadgeTextPremium]}>G</Text>
          </View>
        ) : null}
        <Text
          style={[
            styles.buttonText,
            variant === 'secondary' && styles.buttonTextSecondary,
            premium && variant === 'secondary' && styles.buttonTextSecondaryPremium,
          ]}
        >
          {title}
        </Text>
      </View>
    )}
  </Pressable>
);

const AuthCheckbox = ({ checked, label, onPress, premium = false }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.checkboxRow, pressed && styles.checkboxPressed]}>
    <View style={[styles.checkboxBox, premium && styles.checkboxBoxPremium, checked && styles.checkboxBoxChecked]}>
      {checked ? <CheckIcon color="#FFFFFF" /> : null}
    </View>
    <Text style={[styles.checkboxLabel, premium && styles.checkboxLabelPremium]}>{label}</Text>
  </Pressable>
);

const StepIndicator = ({ steps, currentStep }) => (
  <View style={styles.stepSection}>
    <View style={styles.stepHeaderRow}>
      <Text style={styles.stepTitle}>Step {currentStep + 1} / {steps.length}</Text>
      <Text style={styles.stepSubtitle}>{steps[currentStep].label}</Text>
    </View>
    <View style={styles.stepTrack}>
      {steps.map((step, index) => {
        const active = index === currentStep;
        const done = index < currentStep;
        return (
          <View key={step.key} style={styles.stepItem}>
            <View style={[styles.stepLine, done && styles.stepLineDone, active && styles.stepLineActive]} />
            <Text style={[styles.stepLabel, active && styles.stepLabelActive, done && styles.stepLabelDone]}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  </View>
);

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value || 'Not provided'}</Text>
  </View>
);

export default function AuthExperience({ initialTab = 'signin' }) {
  const { user, userData, currentUser, setCurrentUser, refreshUser } = useAuth();
  const { width } = useWindowDimensions();

  const isPremiumWebLayout = Platform.OS === 'web' && width >= 768;
  const isDesktopWeb = Platform.OS === 'web' && width >= 1024;
  const isTabletWeb = Platform.OS === 'web' && width >= 768 && width < 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;
  const isProfileCompletion = Boolean(user && !userData);
  const currentAuthUser = auth.currentUser;
  const hasAuthenticatedUser = Boolean(currentAuthUser);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [busyState, setBusyState] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [accountType, setAccountType] = useState('resident');
  const [registerStep, setRegisterStep] = useState(0);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginTouched, setLoginTouched] = useState({});
  const [loginSubmitted, setLoginSubmitted] = useState(false);

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [flat, setFlat] = useState('');
  const [wing, setWing] = useState('');
  const [societyCodeInput, setSocietyCodeInput] = useState('');
  const [societyName, setSocietyName] = useState('');
  const [societyAddress, setSocietyAddress] = useState('');
  const [registerTouched, setRegisterTouched] = useState({});
  const [registerSubmitted, setRegisterSubmitted] = useState(false);

  const cardEntrance = useRef(new Animated.Value(0)).current;
  const panelTransition = useRef(new Animated.Value(1)).current;
  const registerStepTransition = useRef(new Animated.Value(1)).current;
  const heroOpacity = useRef(new Animated.Value(isDesktopWeb ? 0 : 1)).current;

  const visualTab = isProfileCompletion ? 'register' : activeTab;
  const steps = accountType === 'admin' ? ADMIN_STEPS : RESIDENT_STEPS;
  const stepFields = useMemo(
    () => buildStepFields(accountType, hasAuthenticatedUser),
    [accountType, hasAuthenticatedUser]
  );

  const handleBackHome = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.spring(cardEntrance, {
        toValue: 1,
        damping: 16,
        mass: 0.9,
        stiffness: 140,
        useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
      }),
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, [cardEntrance, heroOpacity]);

  useEffect(() => {
    panelTransition.setValue(0);
    Animated.timing(panelTransition, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
    }).start();
  }, [panelTransition, visualTab]);

  useEffect(() => {
    registerStepTransition.setValue(0);
    Animated.timing(registerStepTransition, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
    }).start();
  }, [registerStep, registerStepTransition, accountType, hasAuthenticatedUser]);

  useEffect(() => {
    if (isProfileCompletion) {
      setActiveTab('register');
    }
  }, [isProfileCompletion]);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.multiGet([REMEMBER_ME_KEY, REMEMBER_EMAIL_KEY])
      .then((entries) => {
        if (!mounted) {
          return;
        }

        const values = Object.fromEntries(entries);
        const storedRemember = values[REMEMBER_ME_KEY] === 'true';
        const storedEmail = values[REMEMBER_EMAIL_KEY] || '';

        setRememberMe(storedRemember);
        if (storedRemember && storedEmail) {
          setLoginEmail(storedEmail);
        }
      })
      .catch((error) => {
        console.warn('[AuthExperience] Unable to load remembered email:', error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const fallbackEmail = currentUser?.email || currentAuthUser?.email || '';
    const fallbackName = currentUser?.name || currentAuthUser?.displayName || '';
    const fallbackPhone = currentUser?.phoneNumber || currentAuthUser?.phoneNumber || '';

    if (fallbackEmail) {
      setRegisterEmail((prev) => prev || fallbackEmail);
    }
    if (fallbackName) {
      setRegisterName((prev) => prev || fallbackName);
    }
    if (fallbackPhone) {
      setRegisterPhone((prev) => prev || fallbackPhone);
    }
    if (currentUser?.flat) {
      setFlat((prev) => prev || currentUser.flat);
    }
    if (currentUser?.wing) {
      setWing((prev) => prev || currentUser.wing);
    }
  }, [
    currentAuthUser?.displayName,
    currentAuthUser?.email,
    currentAuthUser?.phoneNumber,
    currentUser?.email,
    currentUser?.flat,
    currentUser?.name,
    currentUser?.phoneNumber,
    currentUser?.wing,
  ]);

  useEffect(() => {
    setRegisterStep(0);
    setRegisterSubmitted(false);
  }, [accountType]);

  const loginErrors = useMemo(() => {
    const errors = {};

    if (!loginEmail.trim()) {
      errors.email = 'Email is required.';
    } else if (!emailPattern.test(loginEmail.trim())) {
      errors.email = 'Enter a valid email address.';
    }

    if (!loginPassword) {
      errors.password = 'Password is required.';
    }

    return errors;
  }, [loginEmail, loginPassword]);

  const registerErrors = useMemo(() => {
    const errors = {};
    const normalizedEmail = registerEmail.trim().toLowerCase();
    const normalizedPhone = normalizePhoneNumber(registerPhone);
    const digitCount = normalizedPhone.replace(/\D/g, '').length;

    if (!registerName.trim()) {
      errors.name = 'Full name is required.';
    }

    if (!normalizedEmail) {
      errors.email = 'Email is required.';
    } else if (!emailPattern.test(normalizedEmail)) {
      errors.email = 'Enter a valid email address.';
    }

    if (!normalizedPhone) {
      errors.phone = 'Phone number is required.';
    } else if (digitCount < 10) {
      errors.phone = 'Enter a valid phone number.';
    }

    if (!hasAuthenticatedUser) {
      if (!registerPassword) {
        errors.password = 'Password is required.';
      } else if (registerPassword.length < 8) {
        errors.password = 'Use at least 8 characters.';
      }
    }

    if (!flat.trim()) {
      errors.flat = 'Flat number is required.';
    }

    if (!wing.trim()) {
      errors.wing = 'Wing is required.';
    }

    if (accountType === 'admin') {
      if (!societyName.trim()) {
        errors.societyName = 'Society name is required.';
      }
    } else if (!societyCodeInput.trim()) {
      errors.societyCode = 'Society code is required.';
    }

    return errors;
  }, [
    accountType,
    flat,
    hasAuthenticatedUser,
    registerEmail,
    registerName,
    registerPassword,
    registerPhone,
    societyCodeInput,
    societyName,
    wing,
  ]);

  const showLoginError = (field) => (loginSubmitted || loginTouched[field]) && loginErrors[field];
  const showRegisterError = (field) => (registerSubmitted || registerTouched[field]) && registerErrors[field];

  const persistRememberedEmail = async (email) => {
    if (rememberMe) {
      await AsyncStorage.multiSet([
        [REMEMBER_ME_KEY, 'true'],
        [REMEMBER_EMAIL_KEY, email.trim().toLowerCase()],
      ]);
      return;
    }

    await AsyncStorage.multiRemove([REMEMBER_ME_KEY, REMEMBER_EMAIL_KEY]);
  };

  const handleLogin = async () => {
    setLoginSubmitted(true);
    if (Object.keys(loginErrors).length) {
      return;
    }

    setBusyState('login');

    try {
      await loginAuthUser(loginEmail.trim(), loginPassword);
      await persistRememberedEmail(loginEmail);
    } catch (error) {
      const messageMap = {
        'auth/invalid-credential': 'Invalid email or password. Please try again.',
        'auth/invalid-email': 'Enter a valid email address.',
        'auth/missing-password': 'Password is required.',
        'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
      };

      Alert.alert('Unable to sign in', messageMap[error?.code] || error?.message || 'Something went wrong while signing in.');
    } finally {
      setBusyState(null);
    }
  };

  const handleGoogleContinue = async () => {
    setBusyState('google');

    try {
      const firebaseUser = await signInWithGoogle();
      const existingUser = await getUserDocument(firebaseUser.uid);

      if (!existingUser) {
        setAccountType('resident');
        setRegisterStep(0);
        setActiveTab('register');
      }
    } catch (error) {
      Alert.alert('Google sign-in failed', error?.message || 'Unable to continue with Google right now.');
    } finally {
      setBusyState(null);
    }
  };

  const handleForgotPassword = async () => {
    const email = loginEmail.trim();

    if (!email) {
      Alert.alert('Email required', 'Enter your email address first so we know where to send the reset link.');
      return;
    }

    setBusyState('reset');

    try {
      await sendPasswordReset(email);
      Alert.alert('Reset email sent', 'Check your inbox for a password reset link from Firebase.');
    } catch (error) {
      Alert.alert('Reset failed', error?.message || 'Unable to send a reset email right now.');
    } finally {
      setBusyState(null);
    }
  };

  const handleNextRegisterStep = () => {
    const fields = stepFields[registerStep];
    markFieldsTouched(setRegisterTouched, fields);

    const hasStepErrors = fields.some((field) => registerErrors[field]);
    if (hasStepErrors) {
      return;
    }

    setRegisterStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const createProfilePayload = async (firebaseUser) => {
    const email = (registerEmail.trim() || firebaseUser?.email || '').toLowerCase();
    const phoneNumber = normalizePhoneNumber(registerPhone || firebaseUser?.phoneNumber || '');
    const providerIds = (firebaseUser?.providerData || []).map((item) => item.providerId);
    const isGoogleAccount = providerIds.includes('google.com');
    const isEligibleSuperAdmin = isSuperAdminEligible({ email, phoneNumber });
    const canCreateSuperAdmin =
      accountType === 'admin' &&
      !hasAuthenticatedUser &&
      isEligibleSuperAdmin &&
      isHardcodedSuperAdminCredential(email, registerPassword);

    if (canCreateSuperAdmin) {
      return {
        name: registerName.trim(),
        email,
        phoneNumber,
        isVerified: true,
        role: 'super_admin',
        status: 'approved',
        flat: flat.trim(),
        wing: wing.trim(),
      };
    }

    if (accountType === 'admin') {
      await createSocietyRequest({
        adminId: firebaseUser.uid,
        name: societyName.trim(),
        address: societyAddress.trim(),
        adminName: registerName.trim(),
        email,
        phoneNumber,
      });

      return {
        name: registerName.trim(),
        email,
        phoneNumber,
        isVerified: Boolean(firebaseUser?.emailVerified || isGoogleAccount),
        role: 'admin',
        status: 'pending',
        flat: flat.trim(),
        wing: wing.trim(),
      };
    }

    const residentSociety = await getSocietyByCode(societyCodeInput.trim().toUpperCase());
    if (!residentSociety?.id) {
      throw new Error('Invalid society code. Please check the code and try again.');
    }

    return {
      name: registerName.trim(),
      email,
      phoneNumber,
      isVerified: Boolean(firebaseUser?.emailVerified || isGoogleAccount),
      role: 'resident',
      societyId: residentSociety.id,
      status: 'pending',
      flat: flat.trim(),
      wing: wing.trim(),
    };
  };

  const handleRegister = async () => {
    setRegisterSubmitted(true);
    stepFields.forEach((fields) => markFieldsTouched(setRegisterTouched, fields));

    if (Object.keys(registerErrors).length) {
      return;
    }

    setBusyState('register');

    try {
      const firebaseUser = hasAuthenticatedUser
        ? currentAuthUser
        : await registerAuthUser(registerEmail.trim(), registerPassword);

      const existingUser = await getUserDocument(firebaseUser.uid);
      if (existingUser?.role) {
        throw new Error('This account is already registered. Please sign in instead.');
      }

      const payload = await createProfilePayload(firebaseUser);
      await createUserDocument(firebaseUser.uid, payload);

      const nextUser = { uid: firebaseUser.uid, ...payload };
      setCurrentUser(nextUser);

      const refreshedUser = await refreshUser();
      if (!refreshedUser?.role) {
        setCurrentUser(nextUser);
      }
    } catch (error) {
      Alert.alert('Registration failed', error?.message || 'Unable to complete registration right now.');
    } finally {
      setBusyState(null);
    }
  };

  const authTitle = visualTab === 'signin'
    ? 'Welcome back 👋'
    : isProfileCompletion
      ? 'Complete your registration'
      : accountType === 'admin'
        ? 'Request admin access'
        : 'Create your account';

  const authSubtitle = visualTab === 'signin'
    ? 'Sign in to continue managing your community.'
    : accountType === 'admin'
      ? 'Set up your profile and submit your society for review in three quick steps.'
      : 'Join your community with a guided setup and instant confirmation review.';

  const renderAuthTabs = () => {
    if (isProfileCompletion) {
      return null;
    }

    return (
      <View style={[styles.tabRow, isPremiumWebLayout && styles.tabRowPremium]}>
        <Pressable
          onPress={() => setActiveTab('signin')}
          style={({ pressed }) => [
            styles.tabButton,
            isPremiumWebLayout && styles.tabButtonPremium,
            visualTab === 'signin' && styles.tabButtonActive,
            isPremiumWebLayout && visualTab === 'signin' && styles.tabButtonActivePremium,
            pressed && styles.tabButtonPressed,
          ]}
        >
          <Text
            style={[
              styles.tabButtonText,
              isPremiumWebLayout && styles.tabButtonTextPremium,
              visualTab === 'signin' && styles.tabButtonTextActive,
              isPremiumWebLayout && visualTab === 'signin' && styles.tabButtonTextActivePremium,
            ]}
          >
            Login
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('register')}
          style={({ pressed }) => [
            styles.tabButton,
            isPremiumWebLayout && styles.tabButtonPremium,
            visualTab === 'register' && styles.tabButtonActive,
            isPremiumWebLayout && visualTab === 'register' && styles.tabButtonActivePremium,
            pressed && styles.tabButtonPressed,
          ]}
        >
          <Text
            style={[
              styles.tabButtonText,
              isPremiumWebLayout && styles.tabButtonTextPremium,
              visualTab === 'register' && styles.tabButtonTextActive,
              isPremiumWebLayout && visualTab === 'register' && styles.tabButtonTextActivePremium,
            ]}
          >
            Register
          </Text>
        </Pressable>
      </View>
    );
  };

  const renderPremiumInfoPanel = () => (
    <View style={styles.premiumLeftSection}>
      <View>
        <View style={styles.premiumBrandLockup}>
          <SocietyHubLogo markSize={48} theme="dark" titleStyle={styles.premiumBrandTitle} />
        </View>
        <Text style={styles.premiumHeading}>Simplify. Connect. Thrive.</Text>
        <Text style={styles.premiumDescription}>
          SocietyHub brings residents, admins, and community workflows into one refined operating layer built for modern residential communities.
        </Text>
      </View>

      <View style={styles.premiumFeatureList}>
        {PREMIUM_FEATURES.map((feature) => (
          <View key={feature.key} style={styles.premiumFeatureRow}>
            <View style={styles.premiumFeatureIconWrap}>
              <PremiumFeatureIcon type={feature.key} />
            </View>
            <Text style={styles.premiumFeatureText}>{feature.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderLoginPanel = () => (
    <>
      <View style={[styles.formHeader, isPremiumWebLayout && styles.formHeaderPremium]}>
        <Text style={[styles.formTitle, isPremiumWebLayout && styles.formTitlePremium]}>Welcome back</Text>
        <Text style={[styles.formSubtitle, isPremiumWebLayout && styles.formSubtitlePremium]}>
          Sign in to continue managing your community.
        </Text>
      </View>

      <AuthInput
        autoCapitalize="none"
        error={showLoginError('email')}
        keyboardType="email-address"
        label="Email"
        onBlur={() => setLoginTouched((prev) => ({ ...prev, email: true }))}
        onChangeText={setLoginEmail}
        placeholder="name@societyhub.com"
        premium={isPremiumWebLayout}
        value={loginEmail}
      />

      <AuthInput
        autoCapitalize="none"
        error={showLoginError('password')}
        label="Password"
        onBlur={() => setLoginTouched((prev) => ({ ...prev, password: true }))}
        onChangeText={setLoginPassword}
        placeholder="Enter your password"
        premium={isPremiumWebLayout}
        rightAction={(
          <Pressable
            onPress={() => setShowLoginPassword((prev) => !prev)}
            style={({ pressed }) => [styles.iconAction, pressed && styles.iconActionPressed]}
          >
            <EyeIcon color={isPremiumWebLayout ? '#64748B' : '#2563EB'} open={showLoginPassword} />
          </Pressable>
        )}
        secureTextEntry={!showLoginPassword}
        value={loginPassword}
      />

      <View style={[styles.utilityRow, isPremiumWebLayout && styles.utilityRowPremium]}>
        <AuthCheckbox checked={rememberMe} label="Remember me" onPress={() => setRememberMe((prev) => !prev)} premium={isPremiumWebLayout} />
        <Pressable onPress={handleForgotPassword} style={({ pressed }) => [styles.inlineLink, pressed && styles.inlineLinkPressed]}>
          <Text style={[styles.inlineLinkText, isPremiumWebLayout && styles.inlineLinkTextPremium]}>
            {busyState === 'reset' ? 'Sending...' : 'Forgot password?'}
          </Text>
        </Pressable>
      </View>

      <View style={[styles.buttonStack, isPremiumWebLayout && styles.buttonStackPremium]}>
        <ActionButton disabled={Boolean(busyState)} loading={busyState === 'login'} onPress={handleLogin} premium={isPremiumWebLayout} title="Login" />
        {GOOGLE_AVAILABLE ? (
          <ActionButton
            disabled={Boolean(busyState)}
            loading={busyState === 'google'}
            onPress={handleGoogleContinue}
            premium={isPremiumWebLayout}
            title="Continue with Google"
            variant="secondary"
          />
        ) : null}
      </View>

      {isPremiumWebLayout ? (
        <Pressable onPress={handleBackHome} style={({ pressed }) => [styles.backHomeButton, pressed && styles.backHomeButtonPressed]}>
          <Text style={[styles.backHomeText, styles.backHomeTextPremium]}>{'< Back to Home'}</Text>
        </Pressable>
      ) : null}
    </>
  );

  const renderRegisterSummary = () => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Confirm your details</Text>
      <Text style={styles.summarySubtitle}>
        Review the information below before we complete your registration.
      </Text>
      <DetailRow label="Full Name" value={registerName.trim()} />
      <DetailRow label="Email" value={registerEmail.trim().toLowerCase()} />
      <DetailRow label="Phone Number" value={registerPhone.trim()} />
      <DetailRow label="Flat Number" value={flat.trim()} />
      <DetailRow label="Wing / Block" value={wing.trim()} />
      {accountType === 'admin' ? (
        <>
          <DetailRow label="Society Name" value={societyName.trim()} />
          <DetailRow label="Society Address" value={societyAddress.trim() || 'Optional'} />
        </>
      ) : (
        <DetailRow label="Society Code" value={societyCodeInput.trim().toUpperCase()} />
      )}
    </View>
  );

  const renderRegisterStep = () => {
    if (registerStep === 0) {
      return (
        <>
          <AuthInput
            autoCapitalize="words"
            error={showRegisterError('name')}
            label="Full Name"
            onBlur={() => setRegisterTouched((prev) => ({ ...prev, name: true }))}
            onChangeText={setRegisterName}
            placeholder="Enter your full name"
            premium={isPremiumWebLayout}
            value={registerName}
          />

          <AuthInput
            autoCapitalize="none"
            error={showRegisterError('email')}
            keyboardType="email-address"
            label="Email"
            onBlur={() => setRegisterTouched((prev) => ({ ...prev, email: true }))}
            onChangeText={setRegisterEmail}
            placeholder="name@societyhub.com"
            premium={isPremiumWebLayout}
            value={registerEmail}
          />

          <AuthInput
            autoCapitalize="none"
            error={showRegisterError('phone')}
            keyboardType="phone-pad"
            label="Phone Number"
            onBlur={() => setRegisterTouched((prev) => ({ ...prev, phone: true }))}
            onChangeText={setRegisterPhone}
            placeholder="Enter your phone number"
            premium={isPremiumWebLayout}
            value={registerPhone}
          />
        </>
      );
    }

    if (registerStep === 1) {
      return (
        <>
          {!hasAuthenticatedUser ? (
            <AuthInput
              autoCapitalize="none"
              error={showRegisterError('password')}
              hint="Use at least 8 characters."
              label="Password"
              onBlur={() => setRegisterTouched((prev) => ({ ...prev, password: true }))}
              onChangeText={setRegisterPassword}
              placeholder="Create a password"
              premium={isPremiumWebLayout}
              rightAction={(
                <Pressable
                  onPress={() => setShowRegisterPassword((prev) => !prev)}
                  style={({ pressed }) => [styles.iconAction, pressed && styles.iconActionPressed]}
                >
                  <EyeIcon color={isPremiumWebLayout ? '#64748B' : '#2563EB'} open={showRegisterPassword} />
                </Pressable>
              )}
              secureTextEntry={!showRegisterPassword}
              value={registerPassword}
            />
          ) : null}

          <View style={styles.dualRow}>
            <View style={styles.dualCell}>
              <AuthInput
                autoCapitalize="characters"
                error={showRegisterError('flat')}
                label="Flat Number"
                onBlur={() => setRegisterTouched((prev) => ({ ...prev, flat: true }))}
                onChangeText={setFlat}
                placeholder="A-203"
                premium={isPremiumWebLayout}
                value={flat}
              />
            </View>
            <View style={styles.dualCell}>
              <AuthInput
                autoCapitalize="characters"
                error={showRegisterError('wing')}
                label="Wing / Block"
                onBlur={() => setRegisterTouched((prev) => ({ ...prev, wing: true }))}
                onChangeText={setWing}
                placeholder="A"
                premium={isPremiumWebLayout}
                value={wing}
              />
            </View>
          </View>

          {!hasAuthenticatedUser && GOOGLE_AVAILABLE ? (
            <View style={styles.stepAssist}>
              <Text style={styles.stepAssistText}>Prefer Google instead?</Text>
              <Pressable onPress={handleGoogleContinue} style={({ pressed }) => [styles.inlineLink, pressed && styles.inlineLinkPressed]}>
                <Text style={styles.inlineLinkText}>Continue with Google</Text>
              </Pressable>
            </View>
          ) : null}
        </>
      );
    }

    return (
      <>
        {accountType === 'admin' ? (
          <>
            <AuthInput
              autoCapitalize="words"
              error={showRegisterError('societyName')}
              label="Society Name"
              onBlur={() => setRegisterTouched((prev) => ({ ...prev, societyName: true }))}
              onChangeText={setSocietyName}
              placeholder="Enter society name"
              premium={isPremiumWebLayout}
              value={societyName}
            />

            <AuthInput
              autoCapitalize="sentences"
              hint="Optional"
              label="Society Address"
              onChangeText={setSocietyAddress}
              placeholder="Enter society address"
              premium={isPremiumWebLayout}
              value={societyAddress}
            />
          </>
        ) : (
          <AuthInput
            autoCapitalize="characters"
            error={showRegisterError('societyCode')}
            hint="Ask your society admin for the invitation code."
            label="Society Code"
            onBlur={() => setRegisterTouched((prev) => ({ ...prev, societyCode: true }))}
            onChangeText={(value) => setSocietyCodeInput(value.toUpperCase())}
            placeholder="Enter society code"
            premium={isPremiumWebLayout}
            value={societyCodeInput}
          />
        )}

        {renderRegisterSummary()}
      </>
    );
  };

  const renderRegisterPanel = () => (
    <>
      <View style={[styles.formHeader, isPremiumWebLayout && styles.formHeaderPremium]}>
        <Text style={[styles.formTitle, isPremiumWebLayout && styles.formTitlePremium]}>{authTitle}</Text>
        <Text style={[styles.formSubtitle, isPremiumWebLayout && styles.formSubtitlePremium]}>{authSubtitle}</Text>
      </View>

      {isProfileCompletion ? (
        <View style={styles.profileNotice}>
          <Text style={styles.profileNoticeTitle}>{registerEmail || currentAuthUser?.email || 'Authenticated account'}</Text>
          <Text style={styles.profileNoticeText}>You are already signed in. Finish onboarding to continue.</Text>
          <Pressable onPress={logoutAuthUser} style={({ pressed }) => [styles.inlineLink, pressed && styles.inlineLinkPressed]}>
            <Text style={styles.inlineLinkText}>Use another account</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.modeRow}>
          <Pressable
            onPress={() => setAccountType('resident')}
            style={({ pressed }) => [
              styles.modePill,
              accountType === 'resident' && styles.modePillActive,
              pressed && styles.modePillPressed,
            ]}
          >
            <Text style={[styles.modePillText, accountType === 'resident' && styles.modePillTextActive]}>Resident</Text>
          </Pressable>
          <Pressable
            onPress={() => setAccountType('admin')}
            style={({ pressed }) => [
              styles.modePill,
              accountType === 'admin' && styles.modePillActive,
              pressed && styles.modePillPressed,
            ]}
          >
            <Text style={[styles.modePillText, accountType === 'admin' && styles.modePillTextActive]}>Admin</Text>
          </Pressable>
        </View>
      )}

      <StepIndicator currentStep={registerStep} steps={steps} />

      <Animated.View
        style={{
          opacity: registerStepTransition,
          transform: [
            {
              translateY: registerStepTransition.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 0],
              }),
            },
          ],
        }}
      >
        {renderRegisterStep()}
      </Animated.View>

      <View style={styles.stepButtons}>
        {registerStep > 0 ? (
          <View style={styles.stepButtonSecondary}>
            <ActionButton
              disabled={Boolean(busyState)}
              onPress={() => setRegisterStep((prev) => Math.max(prev - 1, 0))}
              premium={isPremiumWebLayout}
              title="Back"
              variant="secondary"
            />
          </View>
        ) : (
          <View style={styles.stepButtonSpacer} />
        )}
        <View style={styles.stepButtonPrimary}>
          {registerStep < steps.length - 1 ? (
            <ActionButton disabled={Boolean(busyState)} onPress={handleNextRegisterStep} premium={isPremiumWebLayout} title="Next" />
          ) : (
            <ActionButton
              disabled={Boolean(busyState)}
              loading={busyState === 'register'}
              onPress={handleRegister}
              premium={isPremiumWebLayout}
              title={accountType === 'admin' ? 'Submit Request' : hasAuthenticatedUser ? 'Finish Setup' : 'Create Account'}
            />
          )}
        </View>
      </View>
    </>
  );

  return (
    <View style={styles.page}>
      {isPremiumWebLayout ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.pointerEventsNone,
            {
              opacity: heroOpacity,
              transform: [
                {
                  scale: heroOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1.1, 1.03],
                  }),
                },
              ],
            },
          ]}
        >
          <ImageBackground
            imageStyle={styles.desktopBackgroundImagePremium}
            resizeMode="cover"
            source={{ uri: PREMIUM_WEB_HERO_IMAGE }}
            style={styles.desktopBackground}
          >
            <View style={styles.desktopBackgroundOverlayPremium} />
          </ImageBackground>
        </Animated.View>
      ) : (
        <View style={[StyleSheet.absoluteFillObject, styles.pointerEventsNone]}>
          <ImageBackground imageStyle={styles.mobileBackgroundImage} resizeMode="cover" source={{ uri: HERO_IMAGE }} style={styles.desktopBackground}>
            <View style={styles.mobileBackgroundOverlay} />
          </ImageBackground>
          <View style={styles.mobileBackgroundGlow} />
        </View>
      )}

      <ScrollView
        bounces={false}
        contentContainerStyle={[styles.scrollContent, isPremiumWebLayout && styles.scrollContentDesktop]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.layout, isDesktopWeb && styles.layoutDesktop]}>
          {isPremiumWebLayout ? (
            <Animated.View
              style={[
                styles.premiumShellWrap,
                isTabletWeb && styles.premiumShellWrapTablet,
                {
                  opacity: cardEntrance,
                  transform: [
                    {
                      translateY: cardEntrance.interpolate({
                        inputRange: [0, 1],
                        outputRange: [28, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.premiumShellGlow} />
              <Pressable
                style={({ hovered }) => [
                  styles.premiumShell,
                  isTabletWeb && styles.premiumShellTablet,
                  hovered && styles.premiumShellHovered,
                ]}
              >
                {renderPremiumInfoPanel()}
                <View style={styles.premiumDivider} />
                <View style={styles.premiumRightSection}>
                  {renderAuthTabs()}
                  <Animated.View
                    style={{
                      opacity: panelTransition,
                      transform: [
                        {
                          translateY: panelTransition.interpolate({
                            inputRange: [0, 1],
                            outputRange: [12, 0],
                          }),
                        },
                      ],
                    }}
                  >
                    {visualTab === 'signin' ? renderLoginPanel() : renderRegisterPanel()}
                  </Animated.View>
                </View>
              </Pressable>
            </Animated.View>
          ) : (
            <Animated.View
              style={[
                styles.cardWrap,
                isDesktopWeb && styles.cardWrapDesktop,
                isTablet && !isDesktopWeb && styles.cardWrapTablet,
                isMobile && styles.cardWrapMobile,
                {
                  opacity: cardEntrance,
                  transform: [
                    {
                      translateY: cardEntrance.interpolate({
                        inputRange: [0, 1],
                        outputRange: [28, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.cardGlow} />
              <Pressable
                style={({ hovered }) => [
                  styles.card,
                  isMobile && styles.cardMobile,
                  hovered && isDesktopWeb && styles.cardHovered,
                ]}
              >
                <View style={styles.cardHeader}>
                  <SocietyHubLogo markSize={56} stacked theme="dark" />
                  <Text style={[styles.cardTagline, styles.cardTaglinePremium]}>Premium operations for modern communities</Text>
                </View>

                <View style={styles.cardIntro}>
                  <Text style={styles.heroTitle}>Your community. Simplified.</Text>
                  <Text style={styles.heroBody}>
                    Manage your society, stay connected, and resolve issues - all in one seamless platform.
                  </Text>
                  <View style={styles.heroPoints}>
                    <View style={styles.heroPoint}>
                      <View style={styles.heroPointDot} />
                      <Text style={styles.heroPointText}>Real-time issue tracking</Text>
                    </View>
                    <View style={styles.heroPoint}>
                      <View style={styles.heroPointDot} />
                      <Text style={styles.heroPointText}>Instant communication</Text>
                    </View>
                    <View style={styles.heroPoint}>
                      <View style={styles.heroPointDot} />
                      <Text style={styles.heroPointText}>Smart approvals</Text>
                    </View>
                  </View>
                </View>

                {renderAuthTabs()}

                <Animated.View
                  style={{
                    opacity: panelTransition,
                    transform: [
                      {
                        translateY: panelTransition.interpolate({
                          inputRange: [0, 1],
                          outputRange: [12, 0],
                        }),
                      },
                    ],
                  }}
                >
                  {visualTab === 'signin' ? renderLoginPanel() : renderRegisterPanel()}
                </Animated.View>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#07111F',
    ...Platform.select({
      web: {
        minHeight: '100vh',
      },
      default: {
        backgroundColor: '#07111F',
      },
    }),
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl,
    ...Platform.select({
      web: {
        minHeight: '100vh',
      },
      default: {
        paddingHorizontal: 20,
        paddingVertical: 20,
      },
    }),
  },
  pointerEventsNone: {
    pointerEvents: 'none',
  },
  scrollContentDesktop: { paddingHorizontal: spacing.xl },
  layout: { width: '100%', maxWidth: 1220, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  layoutDesktop: { minHeight: 760, justifyContent: 'center' },
  desktopBackground: {
    flex: 1,
    backgroundColor: '#081221',
  },
  desktopBackgroundImage: {
    resizeMode: 'cover',
    ...Platform.select({
      web: {
        filter: 'blur(4px) brightness(0.62) contrast(1.05) saturate(1.05)',
      },
    }),
  },
  desktopBackgroundImagePremium: {
    resizeMode: 'cover',
    ...Platform.select({
      web: {
        filter: 'blur(4px) brightness(0.9)',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        transform: [{ scale: 1.03 }],
      },
    }),
  },
  mobileBackgroundImage: {
    resizeMode: 'cover',
  },
  mobileBackgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 20, 40, 0.75)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
      },
    }),
  },
  desktopBackgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 20, 40, 0.55)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        backgroundImage: 'linear-gradient(180deg, rgba(10, 20, 40, 0.45) 0%, rgba(10, 20, 40, 0.68) 100%)',
      },
    }),
  },
  desktopBackgroundOverlayPremium: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.35)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.35) 100%)',
      },
    }),
  },
  premiumShellWrap: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    position: 'relative',
  },
  premiumShellWrapTablet: {
    maxWidth: 960,
  },
  premiumShellGlow: {
    ...StyleSheet.absoluteFillObject,
    top: 30,
    left: 22,
    right: 22,
    bottom: -26,
    borderRadius: 28,
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    ...Platform.select({
      web: {
        filter: 'blur(40px)',
        opacity: 0.85,
      },
    }),
  },
  premiumShell: {
    width: '100%',
    flexDirection: 'row',
    gap: 40,
    padding: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.55)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0px 20px 60px rgba(0,0,0,0.15), inset 0px 1px 0px rgba(255,255,255,0.4)',
        transitionDuration: '220ms',
        transitionProperty: 'transform, box-shadow, border-color',
      },
    }),
  },
  premiumShellTablet: {
    gap: 24,
    padding: 28,
  },
  premiumShellHovered: Platform.select({
    web: {
      transform: [{ translateY: -3 }],
      borderColor: 'rgba(255,255,255,0.72)',
      boxShadow: '0px 24px 72px rgba(15,23,42,0.14), inset 0px 1px 0px rgba(255,255,255,0.48)',
    },
    default: {},
  }),
  premiumLeftSection: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 620,
    paddingRight: 10,
  },
  premiumBrandLockup: {
    alignSelf: 'flex-start',
    marginBottom: 30,
  },
  premiumBrandTitle: {
    color: '#111111',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  premiumHeading: {
    color: '#111111',
    fontSize: 44,
    lineHeight: 50,
    fontWeight: '800',
    letterSpacing: -1.5,
    maxWidth: 420,
  },
  premiumDescription: {
    marginTop: 18,
    color: '#555555',
    fontSize: 16,
    lineHeight: 28,
    maxWidth: 460,
  },
  premiumFeatureList: {
    marginTop: 36,
    gap: 16,
  },
  premiumFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  premiumFeatureIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    ...Platform.select({
      web: {
        boxShadow: '0px 14px 32px rgba(15, 23, 42, 0.08)',
      },
    }),
  },
  premiumFeatureText: {
    color: '#444444',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  premiumDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(15,23,42,0.08)',
  },
  premiumRightSection: {
    flex: 1,
    maxWidth: 470,
    justifyContent: 'center',
  },
  mobileBackgroundGlow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    top: '16%',
    alignSelf: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.16)',
    ...Platform.select({
      web: {
        filter: 'blur(48px)',
      },
      default: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.16,
        shadowRadius: 32,
      },
    }),
  },
  heroContentColumn: { display: 'none' },
  heroBrandRow: { marginBottom: 0 },
  heroBrandTitle: { color: '#FFFFFF' },
  heroCopy: { maxWidth: 520 },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 31,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.8,
    ...Platform.select({
      web: {
        textShadow: '0px 10px 28px rgba(15, 23, 42, 0.32)',
      },
      default: {
        textShadowColor: 'rgba(15, 23, 42, 0.32)',
        textShadowOffset: { width: 0, height: 10 },
        textShadowRadius: 28,
      },
    }),
  },
  heroBody: {
    marginTop: 10,
    color: 'rgba(241, 245, 249, 0.9)',
    fontSize: 15,
    lineHeight: 24,
    ...Platform.select({
      web: {
        textShadow: '0px 8px 24px rgba(15, 23, 42, 0.24)',
      },
      default: {
        textShadowColor: 'rgba(15, 23, 42, 0.24)',
        textShadowOffset: { width: 0, height: 8 },
        textShadowRadius: 24,
      },
    }),
  },
  heroPoints: { marginTop: 18, gap: 12, maxWidth: 500 },
  heroPoint: { flexDirection: 'row', alignItems: 'flex-start' },
  heroPointDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#8EE7B8',
    marginTop: 7,
    marginRight: 12,
  },
  heroPointText: {
    flex: 1,
    color: 'rgba(255,255,255,0.86)',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    ...Platform.select({
      web: {
        textShadow: '0px 6px 20px rgba(15, 23, 42, 0.2)',
      },
      default: {},
    }),
  },
  heroFootnote: { display: 'none' },
  cardWrap: { width: '100%', maxWidth: 440, alignSelf: 'center', position: 'relative' },
  cardWrapDesktop: { maxWidth: 380, justifyContent: 'center' },
  cardWrapTablet: { maxWidth: 520 },
  cardWrapMobile: { maxWidth: '100%' },
  cardGlow: {
    ...StyleSheet.absoluteFillObject,
    top: 28,
    left: 18,
    right: 18,
    bottom: -18,
    borderRadius: 32,
    backgroundColor: 'rgba(34, 197, 94, 0.09)',
    transform: [{ scale: 1.06 }],
    ...Platform.select({
      web: {
        filter: 'blur(34px)',
        opacity: 0.9,
      },
      default: {
        shadowColor: '#22C55E',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.14,
        shadowRadius: 28,
        elevation: 8,
      },
    }),
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    padding: 32,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0px 20px 60px rgba(0,0,0,0.15), inset 0px 1px 0px rgba(255,255,255,0.42)',
        transitionDuration: '220ms',
        transitionProperty: 'transform, box-shadow, border-color, background, filter',
      },
      default: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.26,
        shadowRadius: 36,
        elevation: 10,
      },
    }),
  },
  cardMobile: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
      },
      default: {
        shadowOpacity: 0.2,
        shadowRadius: 24,
      },
    }),
  },
  cardHovered: Platform.select({
    web: {
      transform: [{ translateY: -3 }],
      borderColor: 'rgba(255,255,255,0.72)',
      boxShadow: '0px 24px 64px rgba(15,23,42,0.14), inset 0px 1px 0px rgba(255,255,255,0.48)',
    },
    default: {},
  }),
  cardHeader: { alignItems: 'center', marginBottom: 18 },
  cardTagline: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  cardTaglinePremium: { color: '#555555' },
  cardIntro: {
    marginBottom: 24,
  },
  tabRow: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: spacing.lg,
  },
  tabRowPremium: {
    padding: 5,
    marginBottom: 28,
    backgroundColor: 'rgba(255,255,255,0.48)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.58)',
  },
  tabButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonPremium: {
    minHeight: 46,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: { boxShadow: '0px 10px 30px rgba(15,23,42,0.22)' },
      default: shadows.card,
    }),
  },
  tabButtonActivePremium: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    ...Platform.select({
      web: { boxShadow: '0px 10px 26px rgba(15,23,42,0.25)' },
    }),
  },
  tabButtonPressed: { opacity: 0.92 },
  tabButtonText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.72)' },
  tabButtonTextPremium: { color: '#444444' },
  tabButtonTextActive: { color: '#0F172A' },
  tabButtonTextActivePremium: { color: '#0F172A' },
  formHeader: { marginBottom: spacing.lg, gap: spacing.xs },
  formHeaderPremium: { marginBottom: 24 },
  formTitle: {
    color: '#F8FAFC',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  formTitlePremium: { color: '#111111' },
  formSubtitle: { color: 'rgba(241,245,249,0.82)', fontSize: 15, lineHeight: 22 },
  formSubtitlePremium: { color: '#555555' },
  fieldBlock: { marginBottom: spacing.md },
  fieldHeader: { marginBottom: spacing.xs, gap: 4 },
  fieldLabel: { color: '#F8FAFC', fontSize: 13, fontWeight: '700' },
  fieldLabelPremium: { color: '#444444' },
  fieldHint: { ...typography.caption, color: 'rgba(226,232,240,0.75)' },
  fieldHintPremium: { color: '#666666' },
  fieldError: { color: colors.danger, fontSize: 12, lineHeight: 16 },
  inputShell: {
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingLeft: spacing.md,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      web: { transitionDuration: '220ms', transitionProperty: 'box-shadow, border-color, transform, background' },
    }),
  },
  inputShellPremium: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderColor: 'rgba(0,0,0,0.1)',
  },
  inputShellFocused: {
    borderColor: '#2563EB',
    backgroundColor: 'rgba(255,255,255,0.12)',
    ...Platform.select({
      web: { boxShadow: '0px 0px 0px 4px rgba(59, 130, 246, 0.18), 0px 14px 34px rgba(37, 99, 235, 0.2)' },
      default: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },
  inputShellFocusedPremium: {
    borderColor: 'rgba(59,130,246,0.32)',
    backgroundColor: 'rgba(255,255,255,0.9)',
    ...Platform.select({
      web: { boxShadow: '0px 0px 0px 4px rgba(59,130,246,0.12), 0px 18px 40px rgba(15,23,42,0.12)' },
    }),
  },
  inputShellError: { borderColor: colors.danger },
  inputShellDisabled: { backgroundColor: 'rgba(255,255,255,0.05)' },
  input: {
    flex: 1,
    minHeight: 54,
    fontSize: 16,
    color: '#F8FAFC',
    paddingVertical: 0,
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  inputPremium: {
    color: '#111111',
  },
  inputAdornment: { marginLeft: 8 },
  iconAction: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActionPressed: { opacity: 0.7 },
  utilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  utilityRowPremium: { marginBottom: 22 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center' },
  checkboxPressed: { opacity: 0.82 },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  checkboxBoxPremium: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderColor: 'rgba(0,0,0,0.12)',
  },
  checkboxBoxChecked: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  checkboxLabel: { marginLeft: spacing.sm, fontSize: 14, color: '#F8FAFC', fontWeight: '600' },
  checkboxLabelPremium: { color: '#555555' },
  inlineLink: { paddingVertical: 2 },
  inlineLinkPressed: { opacity: 0.72 },
  inlineLinkText: { color: '#93C5FD', fontSize: 13, fontWeight: '800' },
  inlineLinkTextPremium: { color: '#2563EB' },
  buttonStack: { gap: spacing.sm },
  buttonStackPremium: { gap: 14 },
  button: {
    minHeight: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    ...Platform.select({
      web: { transitionDuration: '220ms', transitionProperty: 'transform, opacity, box-shadow' },
    }),
  },
  buttonPremium: { borderRadius: 14 },
  buttonPrimary: {
    backgroundColor: '#2563EB',
    ...Platform.select({
      web: { boxShadow: '0px 12px 28px rgba(0,0,0,0.28)' },
      default: shadows.card,
    }),
  },
  buttonPrimaryPremium: {
    ...Platform.select({
      web: { boxShadow: '0px 18px 34px rgba(34,197,94,0.2), 0px 12px 26px rgba(59,130,246,0.24)' },
    }),
  },
  buttonSecondary: { backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  buttonSecondaryPremium: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0,0,0,0.1)',
  },
  buttonHovered: Platform.select({
    web: {
      transform: [{ translateY: -2 }],
      boxShadow: '0px 10px 25px rgba(0,0,0,0.3)',
      filter: 'brightness(1.03)',
    },
    default: {
      transform: [{ translateY: -2 }],
    },
  }),
  buttonHoveredPremium: Platform.select({
    web: {
      boxShadow: '0px 18px 34px rgba(15,23,42,0.32)',
      filter: 'brightness(1.04)',
    },
    default: {},
  }),
  buttonPressed: { transform: [{ scale: 0.99 }] },
  buttonDisabled: { opacity: 0.7 },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    zIndex: 1,
  },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  buttonTextSecondary: { color: '#0F172A' },
  buttonTextSecondaryPremium: { color: '#0F172A' },
  googleBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  googleBadgePremium: { backgroundColor: '#FFFFFF' },
  googleBadgeText: { color: '#2563EB', fontSize: 12, fontWeight: '800' },
  googleBadgeTextPremium: { color: '#111827' },
  modeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  modePill: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modePillActive: { borderColor: '#FFFFFF', backgroundColor: '#FFFFFF' },
  modePillPressed: { opacity: 0.92 },
  modePillText: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '800' },
  modePillTextActive: { color: '#0F172A' },
  profileNotice: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  profileNoticeTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '800', marginBottom: 4 },
  profileNoticeText: { ...typography.body, marginBottom: spacing.xs, color: 'rgba(241,245,249,0.75)' },
  stepSection: { marginBottom: spacing.lg },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  stepTitle: { fontSize: 13, fontWeight: '800', color: '#F8FAFC' },
  stepSubtitle: { fontSize: 13, color: 'rgba(226,232,240,0.7)' },
  stepTrack: { flexDirection: 'row', gap: spacing.xs },
  stepItem: { flex: 1 },
  stepLine: { height: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)', marginBottom: 8 },
  stepLineActive: { backgroundColor: '#2563EB' },
  stepLineDone: { backgroundColor: '#10B981' },
  stepLabel: { fontSize: 11, lineHeight: 15, color: 'rgba(226,232,240,0.65)' },
  stepLabelActive: { color: '#FFFFFF', fontWeight: '700' },
  stepLabelDone: { color: '#A7F3D0', fontWeight: '700' },
  dualRow: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  dualCell: { flex: 1, minWidth: 140 },
  stepAssist: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  stepAssistText: { color: 'rgba(226,232,240,0.72)', fontSize: 12, fontWeight: '600' },
  summaryCard: {
    marginTop: spacing.sm,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: spacing.md,
  },
  summaryTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '800' },
  summarySubtitle: {
    marginTop: 4,
    color: 'rgba(226,232,240,0.68)',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  detailLabel: { color: 'rgba(226,232,240,0.72)', fontSize: 13, fontWeight: '700' },
  detailValue: {
    flex: 1,
    textAlign: 'right',
    color: '#F8FAFC',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  stepButtons: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  stepButtonPrimary: { flex: 1 },
  stepButtonSecondary: { width: 128 },
  stepButtonSpacer: { width: 128 },
  backHomeButton: {
    alignSelf: 'center',
    marginTop: 18,
    paddingVertical: 6,
  },
  backHomeButtonPressed: {
    opacity: 0.72,
  },
  backHomeText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    fontWeight: '700',
  },
  backHomeTextPremium: {
    color: '#555555',
  },
});
