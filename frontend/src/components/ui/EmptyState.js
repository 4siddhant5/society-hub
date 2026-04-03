import React from 'react';
import {
  View,
  Text,
  StyleSheet
} from "react-native";
import { FiInbox } from 'react-icons/fi';

const EmptyState = ({ message, icon: Icon = FiInbox }) => {
  return (
    <View style={styles.container}>
      <Icon size={48} color="#94a3b8" />
      <Text style={styles.text}>{message || 'No data found'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
});

export default EmptyState;
