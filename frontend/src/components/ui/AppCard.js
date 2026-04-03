import React from 'react';
import {
  View,
  Text,
  StyleSheet
} from "react-native";

import { useTheme } from '../../context/ThemeContext';

const AppCard = ({ children, style }) => {
  const { isDark } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: isDark ? "#1e1e1e" : "#ffffff" }, style]}>
      {typeof children === 'string' || typeof children === 'number' ? <Text>{children}</Text> : children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 10px 24px rgba(15, 23, 42, 0.08)',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
});

export default AppCard;
