import { Platform } from "react-native";
import { auth, app } from "../config/firebase";
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";

export const HARDCODED_SUPER_ADMIN_EMAIL = "superadmin@societyhub.com";
export const HARDCODED_SUPER_ADMIN_PASSWORD = "SuperAdmin@123";
const shouldRunVerboseAuthChecks = __DEV__ && Platform.OS === "web";

const parseCsv = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const SUPER_ADMIN_EMAILS = parseCsv(
  process.env.EXPO_PUBLIC_SUPER_ADMIN_EMAILS || process.env.REACT_APP_SUPER_ADMIN_EMAILS
).map((email) => email.toLowerCase());

export const SUPER_ADMIN_PHONES = parseCsv(
  process.env.EXPO_PUBLIC_SUPER_ADMIN_PHONES || process.env.REACT_APP_SUPER_ADMIN_PHONES
);

export const normalizePhoneNumber = (value = "") => value.replace(/[^\d+]/g, "");

export const isSuperAdminEligible = ({ email, phoneNumber } = {}) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  return (
    normalizedEmail === HARDCODED_SUPER_ADMIN_EMAIL ||
    (!!normalizedEmail && SUPER_ADMIN_EMAILS.includes(normalizedEmail)) ||
    (!!normalizedPhone && SUPER_ADMIN_PHONES.includes(normalizedPhone))
  );
};

export const isHardcodedSuperAdminCredential = (email = "", password = "") =>
  String(email || "").trim().toLowerCase() === HARDCODED_SUPER_ADMIN_EMAIL &&
  String(password || "") === HARDCODED_SUPER_ADMIN_PASSWORD;

export const validateFirebaseAuthConfig = async (email = "") => {
  const configSummary = {
    apiKey: !!app?.options?.apiKey,
    authDomain: !!app?.options?.authDomain,
    projectId: !!app?.options?.projectId,
    emailPasswordConfigured: "Unable to verify from client. Confirm Email/Password is enabled in Firebase Console.",
    platform: Platform.OS,
  };

  console.log("FIREBASE AUTH CONFIG:", configSummary);

  if (shouldRunVerboseAuthChecks && email) {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email.trim().toLowerCase());
      console.log("FETCHED SIGN IN METHODS:", methods);
    } catch (error) {
      console.log("FETCH SIGN IN METHODS ERROR:", error);
    }
  }

  return configSummary;
};

export const registerAuthUser = async (email, password) => {
  try {
    if (shouldRunVerboseAuthChecks) {
      await validateFirebaseAuthConfig(email);
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (!userCredential?.user) {
      throw new Error("Firebase did not return a user after registration.");
    }
    return userCredential.user;
  } catch (error) {
    console.log("REGISTER ERROR:", error);
    console.error("Registration error:", error);
    throw error;
  }
};

export const loginAuthUser = async (email, password) => {
  try {
    if (shouldRunVerboseAuthChecks) {
      await validateFirebaseAuthConfig(email);
    }
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    if (!userCredential?.user) {
      throw new Error("Firebase did not return a user after login.");
    }
    return userCredential.user;
  } catch (error) {
    console.log("LOGIN ERROR:", error);
    console.error("Login error:", error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  try {
    if (Platform.OS !== "web") {
      throw new Error("Google Sign-In is available on web in this Expo setup.");
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(auth, provider);
    if (!result?.user) {
      throw new Error("Firebase did not return a user after Google sign-in.");
    }
    return result.user;
  } catch (error) {
    console.log("GOOGLE SIGN-IN ERROR:", error);
    console.error("Google sign-in error:", error);
    throw error;
  }
};

export const sendPasswordReset = async (email) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Enter your email address first.");
  }

  try {
    await sendPasswordResetEmail(auth, normalizedEmail);
  } catch (error) {
    console.log("PASSWORD RESET ERROR:", error);
    console.error("Password reset error:", error);
    throw error;
  }
};

export const logoutAuthUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};
