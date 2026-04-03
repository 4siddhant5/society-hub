import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  SafeAreaView,
  Platform
} from "react-native";
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import BottomNav from '../components/layout/BottomNav';
import { useTheme } from '../context/ThemeContext';

const BaseLayout = ({ children, menuItems, activeScreen, onNavigate, title }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? "#121212" : "#ffffff" }]}>
      <View style={styles.layoutWrapper}>
        {isDesktop && (
          <Sidebar 
            menuItems={menuItems} 
            activeScreen={activeScreen} 
            onNavigate={onNavigate} 
          />
        )}
        
        <View style={styles.contentWrapper}>
          <Header 
            title={title} 
            showMenuIcon={!isDesktop} 
            onMenuPress={() => setSidebarOpen(true)}
            onProfilePress={() => onNavigate('Profile')}
            onNotificationsPress={() => onNavigate('NotificationScreen')}
          />
          
          <View style={[styles.mainContent, { backgroundColor: isDark ? "#121212" : "#ffffff" }]}>
            {children}
          </View>

          {!isDesktop && (
            <BottomNav 
              menuItems={menuItems} 
              activeScreen={activeScreen} 
              onNavigate={onNavigate} 
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  layoutWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  contentWrapper: {
    flex: 1,
    flexDirection: 'column',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});

export default BaseLayout;
