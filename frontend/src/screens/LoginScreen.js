import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
} from "react-native";
import RegisterScreen from './RegisterScreen';
import {
  loginAuthUser,
  normalizePhoneNumber,
  sendPhoneOtp,
  signInWithGoogle,
  verifyPhoneOtp,
} from '../services/authService';
import { getUserDocument } from '../services/userService';

export default function LoginScreen({ goToRegister }) {
  const [mode, setMode] = useState('login');
  const [loginMethod, setLoginMethod] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prefillProfile, setPrefillProfile] = useState(null);

  const getAuthErrorMessage = (error) => {
    switch (error?.code) {
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'auth/invalid-email':
        return 'Enter a valid email address.';
      case 'auth/missing-password':
        return 'Enter your password to continue.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please wait a moment and try again.';
      default:
        return error?.message || 'Unable to sign in right now.';
    }
  };

  const handleLogin = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      return Alert.alert("Error", "Enter both email and password.");
    }

    const emailPattern = /\S+@\S+\.\S+/;
    if (!emailPattern.test(trimmedEmail)) {
      return Alert.alert("Error", "Enter a valid email address.");
    }

    setLoading(true);
    try {
      await loginAuthUser(trimmedEmail, password);
    } catch (err) {
      console.log("LOGIN ERROR:", err);
      Alert.alert("Login Error", getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!normalizePhoneNumber(phoneNumber)) {
      Alert.alert("Error", "Enter a valid phone number.");
      return;
    }

    setLoading(true);
    try {
      const result = await sendPhoneOtp(phoneNumber, "login-phone-recaptcha");
      setConfirmationResult(result);
      setOtpSent(true);
      Alert.alert("OTP Sent", "Verification code sent to your phone.");
    } catch (err) {
      console.log("LOGIN ERROR:", err);
      Alert.alert("OTP Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpSent) {
      Alert.alert("Error", "Send OTP first.");
      return;
    }

    setLoading(true);
    try {
      const user = await verifyPhoneOtp(confirmationResult, otp);
      const userDoc = await getUserDocument(user.uid);

      if (!userDoc) {
        setPrefillProfile({
          phoneNumber: normalizePhoneNumber(user.phoneNumber || phoneNumber),
          name: user.displayName || '',
          email: user.email || '',
        });
        setMode('register');
        Alert.alert("Complete Profile", "We found no profile for this phone number. Please complete registration.");
      }
    } catch (err) {
      console.log("LOGIN ERROR:", err);
      Alert.alert("OTP Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      const userDoc = await getUserDocument(user.uid);

      if (!userDoc) {
        setPrefillProfile({
          name: user.displayName || '',
          email: user.email || '',
          phoneNumber: user.phoneNumber || '',
        });
        setMode('register');
        Alert.alert("Complete Profile", "Please complete your registration to continue.");
      }
    } catch (err) {
      console.log("LOGIN ERROR:", err);
      Alert.alert("Google Sign-In Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'register') {
    return (
      <RegisterScreen
        goBack={() => {
          setMode('login');
          goToRegister?.();
        }}
        initialAuthMethod={prefillProfile?.phoneNumber ? 'phone' : 'email'}
        initialProfile={prefillProfile}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SocietyHub Login</Text>

      <View style={styles.methodRow}>
        <Button
          title="Email"
          onPress={() => setLoginMethod('email')}
          color={loginMethod === 'email' ? '#1a73e8' : '#ccc'}
        />
        <Button
          title="Phone OTP"
          onPress={() => setLoginMethod('phone')}
          color={loginMethod === 'phone' ? '#1a73e8' : '#ccc'}
        />
      </View>

      {loginMethod === 'email' ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <View style={styles.btnSpacing}>
            <Button title={loading ? "Logging in..." : "Login"} onPress={handleLogin} disabled={loading} color="#1a73e8" />
          </View>
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Phone Number (+91...)"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
          <View style={styles.btnSpacing}>
            <Button
              title={loading && !otpSent ? "Sending OTP..." : "Send OTP"}
              onPress={handleSendOtp}
              disabled={loading}
              color="#1a73e8"
            />
          </View>
          {otpSent && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Enter OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
              />
              <View style={styles.btnSpacing}>
                <Button
                  title={loading ? "Verifying..." : "Verify OTP"}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                  color="#34a853"
                />
              </View>
            </>
          )}
          <View nativeID="login-phone-recaptcha" />
        </>
      )}

      <View style={styles.btnSpacing}>
        <Button title={loading ? "Please wait..." : "Sign in with Google"} onPress={handleGoogleLogin} disabled={loading} color="#db4437" />
      </View>
      <View style={styles.btnSpacing}>
        <Button
          title="Create an Account"
          onPress={() => {
            setMode('register');
            goToRegister?.();
          }}
          color="#666"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#333' },
  methodRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, gap: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 15, marginBottom: 15, backgroundColor: '#fafafa', fontSize: 16 },
  btnSpacing: { marginTop: 15 },
});
