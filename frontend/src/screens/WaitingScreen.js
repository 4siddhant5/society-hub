import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
} from "react-native";
import { useAuth } from '../context/AuthContext';
import { logoutAuthUser } from '../services/authService';

export default function WaitingScreen() {
  const { userData } = useAuth();

  const isAdmin = userData?.role === 'admin';
  const isBlocked = userData?.status === 'blocked';
  const isRejected = userData?.status === 'rejected';
  const isDeleted = userData?.status === 'deleted';

  let title = "Waiting for Approval";
  let subtitle = "Your account is under verification. You will be notified once approved.";

  if (isAdmin) {
    title = "Your society is under verification";
    subtitle = "Our team is reviewing your request. You will be notified once approved.";
  }

  if (isRejected) {
    title = "Request Rejected";
    subtitle = `Your request was rejected.${userData?.rejectionReason ? ` Reason: ${userData.rejectionReason}` : ''}`;
  }

  if (isBlocked) {
    title = "Account Blocked";
    subtitle = userData?.blockedReason || "Please contact support for help with your account.";
  }

  if (isDeleted) {
    title = "Account Removed";
    subtitle = "Your account access has been removed by the super admin. Please contact support if this was a mistake.";
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <Button title="Logout" onPress={logoutAuthUser} color="#d32f2f" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1f2937',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 30,
    lineHeight: 24,
  },
});
