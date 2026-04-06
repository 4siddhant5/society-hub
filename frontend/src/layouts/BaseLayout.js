import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  SafeAreaView,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import BottomNav from '../components/layout/BottomNav';
import { useTheme } from '../context/ThemeContext';

const BaseLayout = ({ children, menuItems, activeScreen, onNavigate, title }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    if (isDesktop) {
      setSidebarOpen(false);
    }
  }, [isDesktop]);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0b1220' : '#f8fafc' }]}>
      <View style={styles.layoutWrapper}>
        {isDesktop ? (
          <Sidebar
            menuItems={menuItems}
            activeScreen={activeScreen}
            onNavigate={onNavigate}
          />
        ) : null}

        <View style={styles.contentWrapper}>
          <Header
            title={title}
            showMenuIcon={!isDesktop}
            onMenuPress={() => setSidebarOpen(true)}
            onProfilePress={() => onNavigate('Profile')}
            onNotificationsPress={() => onNavigate('NotificationScreen')}
          />

          <View style={[styles.mainContent, { backgroundColor: isDark ? '#0b1220' : '#f8fafc' }]}>
            {children}
          </View>

          {!isDesktop ? (
            <BottomNav
              menuItems={menuItems}
              activeScreen={activeScreen}
              onNavigate={onNavigate}
            />
          ) : null}
        </View>
      </View>

      {!isDesktop ? (
        <Modal visible={isSidebarOpen} transparent animationType="fade" onRequestClose={closeSidebar}>
          <View style={styles.drawerRoot}>
            <Pressable style={styles.drawerBackdrop} onPress={closeSidebar} />
            <View style={styles.drawerPanel}>
              <Sidebar
                menuItems={menuItems}
                activeScreen={activeScreen}
                onNavigate={onNavigate}
                onClose={closeSidebar}
                isMobile
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    maxHeight: '100vh',
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    ...Platform.select({
      web: {},
      default: {},
    }),
  },
  layoutWrapper: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        height: '100%',
        maxHeight: '100vh',
      },
      default: {
        minHeight: 0,
      },
    }),
  },
  contentWrapper: {
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        height: '100%',
        maxHeight: '100vh',
      },
      default: {
        minHeight: 0,
      },
    }),
  },
  mainContent: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f8fafc',
    ...Platform.select({
      web: {
        height: '100vh',
      },
      default: {
        minHeight: 0,
      },
    }),
  },
  drawerRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.36)',
  },
  drawerPanel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    ...Platform.select({
      web: {
        position: 'fixed',
      },
      default: {},
    }),
  },
});

export default BaseLayout;
