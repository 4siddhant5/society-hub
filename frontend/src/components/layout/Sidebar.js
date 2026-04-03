import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform
} from "react-native";
import { FiLogOut } from 'react-icons/fi';
import { logoutAuthUser } from '../../services/authService';

const Sidebar = ({ menuItems, activeScreen, onNavigate }) => {
  return (
    <View style={styles.sidebar}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>SocietyHub</Text>
      </View>
      <ScrollView style={styles.menuContainer}>
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.screen;
          return (
            <TouchableOpacity 
              key={index} 
              style={[styles.menuItem, isActive && styles.activeMenuItem]} 
              onPress={() => onNavigate(item.screen)}
            >
              <Icon size={20} color={isActive ? '#2563eb' : '#64748b'} />
              <Text style={[styles.menuText, isActive && styles.activeMenuText]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <TouchableOpacity style={styles.logoutButton} onPress={logoutAuthUser}>
        <FiLogOut size={20} color="#dc2626" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    height: '100%',
    paddingVertical: 20,
  },
  logoContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: -0.5,
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  activeMenuItem: {
    backgroundColor: '#eff6ff',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
    marginLeft: 12,
  },
  activeMenuText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginLeft: 12,
  },
});

export default Sidebar;
