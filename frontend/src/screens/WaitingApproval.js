import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button
} from "react-native";
import { logoutAuthUser } from '../services/authService';

export default function WaitingApproval() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Waiting for Approval</Text>
      <Text style={styles.subtitle}>
        Your account is currently pending approval by your society admin. Please check back later.
      </Text>
      <Button title="Logout" onPress={logoutAuthUser} color="#d32f2f" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa'
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333'
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30
  }
});
