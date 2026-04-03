import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator
} from "react-native";

const AppButton = ({ title, onPress, type = 'primary', loading = false, style, textStyle, icon: Icon }) => {
  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return '#16a34a';
      case 'danger': return '#dc2626';
      case 'warning': return '#f59e0b';
      case 'secondary': return '#64748b';
      default: return '#2563eb';
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.button, { backgroundColor: getBackgroundColor() }, style]} 
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          {Icon && <Icon style={styles.icon} />}
          <Text style={[styles.text, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  icon: {
    marginRight: 8,
    color: '#fff',
    fontSize: 20,
  }
});

export default AppButton;
