import React from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text
} from "react-native";

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SocietyHub</Text>
      <ActivityIndicator size="large" color="#1a73e8" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333'
  }
});
