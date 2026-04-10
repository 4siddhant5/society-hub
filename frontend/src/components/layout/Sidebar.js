import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { FiX } from '../../utils/iconCompat';
import { SocietyHubMark } from '../branding/SocietyHubLogo';

const WEB_ONLY = Platform.OS === 'web';

const Sidebar = ({ menuItems, activeScreen, onNavigate, onClose, isMobile = false }) => {
  return (
    <View style={[styles.sidebar, isMobile && styles.mobileSidebar]}>
      <View style={styles.logoContainer}>
        <View style={styles.brandLockup}>
          <SocietyHubMark size={46} />
          <View style={styles.brandCopy}>
            <Text style={styles.logoEyebrow}>Workspace</Text>
            <Text style={styles.logoText}>SocietyHub</Text>
          </View>
        </View>
        {isMobile ? (
          <Pressable onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}>
            <FiX size={18} color="#475569" />
          </Pressable>
        ) : null}
      </View>

      <ScrollView style={styles.menuContainer} contentContainerStyle={styles.menuContent} showsVerticalScrollIndicator={false}>
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.screen;

          return (
            <Pressable
              key={`${item.screen}-${index}`}
              style={({ hovered, pressed }) => [
                styles.menuItem,
                isActive && styles.activeMenuItem,
                hovered && WEB_ONLY && !isActive && styles.hoveredMenuItem,
                pressed && styles.pressedMenuItem,
              ]}
              onPress={() => {
                onNavigate(item.screen);
                if (onClose) onClose();
              }}
            >
              <View style={[styles.iconWrap, isActive && styles.activeIconWrap]}>
                <Icon size={18} color={isActive ? '#2563eb' : '#64748b'} />
              </View>
              <Text style={[styles.menuText, isActive && styles.activeMenuText]}>{item.label}</Text>
              {isActive ? <View style={styles.activeIndicator} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 280,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    height: '100%',
    paddingTop: 24,
    paddingBottom: 20,
  },
  mobileSidebar: {
    width: 300,
    maxWidth: '88%',
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0px 18px 40px rgba(15, 23, 42, 0.18)',
      },
      default: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.16,
        shadowRadius: 28,
        elevation: 8,
      },
    }),
  },
  logoContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandCopy: {
    marginLeft: 12,
  },
  logoEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  closeButtonPressed: {
    opacity: 0.8,
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  menuContent: {
    paddingBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 8,
    position: 'relative',
  },
  hoveredMenuItem: {
    backgroundColor: '#f8fafc',
  },
  activeMenuItem: {
    backgroundColor: '#eff6ff',
  },
  pressedMenuItem: {
    opacity: 0.88,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  activeIconWrap: {
    backgroundColor: '#dbeafe',
  },
  menuText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 12,
    flex: 1,
  },
  activeMenuText: {
    color: '#2563eb',
  },
  activeIndicator: {
    width: 6,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#2563eb',
  },
});

export default Sidebar;
