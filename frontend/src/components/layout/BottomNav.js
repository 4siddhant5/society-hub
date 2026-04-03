import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform
} from "react-native";

const BottomNav = ({ menuItems, activeScreen, onNavigate }) => {
  return (
    <View style={styles.container}>
      {menuItems.slice(0, 5).map((item, index) => {
        const Icon = item.icon;
        const isActive = activeScreen === item.screen;
        return (
          <TouchableOpacity 
            key={index} 
            style={styles.navItem} 
            onPress={() => onNavigate(item.screen)}
          >
            <Icon size={24} color={isActive ? '#2563eb' : '#94a3b8'} />
            <Text style={[styles.navText, isActive && styles.activeNavText]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    paddingTop: 10,
    justifyContent: 'space-around',
    height: Platform.OS === 'ios' ? 85 : 70,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 11,
    marginTop: 4,
    color: '#94a3b8',
    fontWeight: '500',
  },
  activeNavText: {
    color: '#2563eb',
    fontWeight: '600',
  },
});

export default BottomNav;
