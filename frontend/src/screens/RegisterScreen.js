import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import {
  isSuperAdminEligible,
  isHardcodedSuperAdminCredential,
  normalizePhoneNumber,
  registerAuthUser,
  sendPhoneOtp,
  validateFirebaseAuthConfig,
  verifyPhoneOtp,
} from '../services/authService';
import { createUserDocument, getUserDocument } from '../services/userService';
import { createSocietyRequest, getSocietyByCode } from '../services/societyService';

export default function RegisterScreen({
  goBack,
  initialAuthMethod = 'email',
  initialProfile = null,
}) {
  const [role, setRole] = useState('resident');
  const [authMethod, setAuthMethod] = useState(initialAuthMethod);
  const [name, setName] = useState(initialProfile?.name || '');
  const [email, setEmail] = useState(initialProfile?.email || '');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(initialProfile?.phoneNumber || '');
  const [flat, setFlat] = useState(initialProfile?.flat || '');
  const [wing, setWing] = useState(initialProfile?.wing || '');
  const [societyName, setSocietyName] = useState('');
  const [societyAddress, setSocietyAddress] = useState('');
  const [societyCodeInput, setSocietyCodeInput] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAuthMethod(initialAuthMethod);
  }, [initialAuthMethod]);

  useEffect(() => {
    if (initialProfile?.name) setName(initialProfile.name);
    if (initialProfile?.email) setEmail(initialProfile.email);
    if (initialProfile?.phoneNumber) setPhoneNumber(initialProfile.phoneNumber);
  }, [initialProfile]);

  const canUseSuperAdmin = useMemo(
    () => isSuperAdminEligible({ email, phoneNumber }),
    [email, phoneNumber]
  );

  useEffect(() => {
    if (role === 'super_admin' && !canUseSuperAdmin) {
      setRole('resident');
    }
  }, [canUseSuperAdmin, role]);

  const resetOtpState = () => {
    setOtp('');
    setOtpSent(false);
    setConfirmationResult(null);
  };

  const buildUserPayload = async (uid) => {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    if (!name.trim()) {
      throw new Error("Please fill name.");
    }

    if (role === 'admin') {
      if (!societyName.trim()) {
        throw new Error("Society Name is required.");
      }

      await createSocietyRequest({
        adminId: uid,
        name: societyName.trim(),
        address: societyAddress.trim(),
        adminName: name.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: normalizedPhone,
      });

      return {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: normalizedPhone,
        isVerified: authMethod === 'phone' ? true : false,
        role: "admin",
        status: "pending",
        flat: flat.trim(),
        wing: wing.trim(),
      };
    }

    if (role === 'super_admin') {
      if (!canUseSuperAdmin) {
        throw new Error("This account is not allowed to register as Super Admin.");
      }

      if (authMethod === 'email' && !isHardcodedSuperAdminCredential(email, password)) {
        throw new Error("Use the configured super admin email and password for this temporary super admin account.");
      }

      return {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: normalizedPhone,
        isVerified: true,
        role: "super_admin",
        status: "approved",
        flat: flat.trim(),
        wing: wing.trim(),
      };
    }

    if (!societyCodeInput.trim()) {
      throw new Error("Society Code is required.");
    }

    const society = await getSocietyByCode(societyCodeInput.trim());
    if (!society) {
      throw new Error("Invalid Society Code.");
    }

    return {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: normalizedPhone,
      isVerified: authMethod === 'phone' ? true : false,
      role: "resident",
      societyId: society.id,
      status: "pending",
      flat: flat.trim(),
      wing: wing.trim(),
    };
  };

  const finalizeRegistration = async (firebaseUser, markVerified = false) => {
    const existingUser = await getUserDocument(firebaseUser.uid);
    if (existingUser?.role) {
      throw new Error("This account is already registered.");
    }

    const userData = await buildUserPayload(firebaseUser.uid);
    await createUserDocument(firebaseUser.uid, {
      ...userData,
      email: userData.email || firebaseUser.email || '',
      phoneNumber: userData.phoneNumber || normalizePhoneNumber(firebaseUser.phoneNumber || phoneNumber),
      isVerified: markVerified || userData.isVerified || false,
    });

    if (role === 'admin') {
      Alert.alert(
        "Request Submitted",
        "Your society is under verification. We will notify you once it is approved."
      );
      return;
    }

    if (role === 'resident') {
      Alert.alert("Success", "Registered successfully. Waiting for admin approval.");
      return;
    }

    Alert.alert("Success", "Super admin registration completed.");
  };

  const handleEmailRegister = async () => {
    if (!email.trim() || !password || !name.trim()) {
      throw new Error("Please fill name, email and password.");
    }

    await validateFirebaseAuthConfig(email);
    const user = await registerAuthUser(email.trim(), password);
    await finalizeRegistration(user, false);
  };

  const handleSendOtp = async () => {
    if (!normalizePhoneNumber(phoneNumber)) {
      Alert.alert("Error", "Please enter a valid phone number.");
      return;
    }

    setLoading(true);
    try {
      const result = await sendPhoneOtp(phoneNumber, "register-phone-recaptcha");
      setConfirmationResult(result);
      setOtpSent(true);
      Alert.alert("OTP Sent", "Verification code sent to your phone number.");
    } catch (err) {
      console.log("REGISTER ERROR:", err);
      Alert.alert("OTP Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneRegister = async () => {
    if (!otpSent) {
      throw new Error("Please send OTP first.");
    }

    const user = await verifyPhoneOtp(confirmationResult, otp);
    await finalizeRegistration(user, true);
    resetOtpState();
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      if (authMethod === 'phone') {
        await handlePhoneRegister();
      } else {
        await handleEmailRegister();
      }
    } catch (err) {
      console.log("REGISTER ERROR:", err);
      Alert.alert("Registration Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Register for SocietyHub</Text>

      <View style={styles.roleContainer}>
        <Button
          title="Resident"
          onPress={() => setRole('resident')}
          color={role === 'resident' ? '#1a73e8' : '#ccc'}
        />
        <Button
          title="Admin"
          onPress={() => setRole('admin')}
          color={role === 'admin' ? '#1a73e8' : '#ccc'}
        />
        {canUseSuperAdmin && (
          <Button
            title="Super Admin"
            onPress={() => setRole('super_admin')}
            color={role === 'super_admin' ? '#1a73e8' : '#ccc'}
          />
        )}
      </View>

      <View style={styles.roleContainer}>
        <Button
          title="Email"
          onPress={() => {
            setAuthMethod('email');
            resetOtpState();
          }}
          color={authMethod === 'email' ? '#34a853' : '#ccc'}
        />
        <Button
          title="Phone OTP"
          onPress={() => setAuthMethod('phone')}
          color={authMethod === 'phone' ? '#34a853' : '#ccc'}
        />
      </View>

      <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />

      {authMethod === 'email' ? (
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
            <TextInput
              style={styles.input}
              placeholder="Enter OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
            />
          )}
          <View nativeID="register-phone-recaptcha" />
        </>
      )}

      <TextInput style={styles.input} placeholder="Flat/Door No" value={flat} onChangeText={setFlat} />
      <TextInput style={styles.input} placeholder="Wing/Block" value={wing} onChangeText={setWing} />

      {role === 'admin' && (
        <>
          <Text style={styles.sectionTitle}>Society Details</Text>
          <TextInput style={styles.input} placeholder="Society Name" value={societyName} onChangeText={setSocietyName} />
          <TextInput style={styles.input} placeholder="Society Address" value={societyAddress} onChangeText={setSocietyAddress} />
        </>
      )}

      {role === 'resident' && (
        <>
          <Text style={styles.sectionTitle}>Join Society</Text>
          <TextInput
            style={styles.input}
            placeholder="Society Code (6 letters)"
            value={societyCodeInput}
            onChangeText={setSocietyCodeInput}
            autoCapitalize="characters"
          />
        </>
      )}

      <View style={styles.btnSpacing}>
        <Button
          title={loading ? "Registering..." : authMethod === 'phone' ? "Verify OTP & Register" : "Register"}
          onPress={handleRegister}
          disabled={loading}
          color="#34a853"
        />
      </View>
      <View style={styles.btnSpacing}>
        <Button title="Back to Login" onPress={() => goBack?.()} color="#666" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  roleContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, gap: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 15, backgroundColor: '#fafafa' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 10, marginBottom: 10, color: '#444' },
  btnSpacing: { marginTop: 10 },
});
