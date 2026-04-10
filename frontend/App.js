import React, { useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';

const AppContent = () => {
  const { user, userData, loading } = useContext(AuthContext);
  const [showIntroSplash, setShowIntroSplash] = useState(Platform.OS !== 'web');
  const [webEntryScreen, setWebEntryScreen] = useState(Platform.OS === 'web' ? 'landing' : 'login');
  const introHandledRef = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setShowIntroSplash(false);
      return undefined;
    }

    if (loading) {
      return undefined;
    }

    if (user || userData) {
      setShowIntroSplash(false);
      return undefined;
    }

    if (introHandledRef.current) {
      setShowIntroSplash(false);
      return undefined;
    }

    introHandledRef.current = true;
    const timeout = setTimeout(() => {
      setShowIntroSplash(false);
    }, 2500);

    return () => clearTimeout(timeout);
  }, [loading, user, userData]);

  if (loading || showIntroSplash) {
    const SplashScreen = require('./src/screens/SplashScreen').default;
    return <SplashScreen />;
  }

  if (user == null) {
    if (Platform.OS === 'web') {
      if (webEntryScreen === 'landing') {
        const LandingScreen = require('./src/screens/LandingScreen').default;
        return <LandingScreen onNavigate={setWebEntryScreen} />;
      }

      if (webEntryScreen === 'register') {
        const RegisterScreen = require('./src/screens/RegisterScreen').default;
        return <RegisterScreen />;
      }
    }

    const LoginScreen = require('./src/screens/LoginScreen').default;
    return <LoginScreen />;
  }

  if (user && !userData) {
    if (Platform.OS === 'web' && webEntryScreen === 'register') {
      const RegisterScreen = require('./src/screens/RegisterScreen').default;
      return <RegisterScreen />;
    }

    const LoginScreen = require('./src/screens/LoginScreen').default;
    return <LoginScreen />;
  }

  if (userData.status === "pending" || userData.status === "rejected" || userData.status === "blocked" || userData.status === "deleted") {
    const WaitingScreen = require('./src/screens/WaitingScreen').default;
    return <WaitingScreen />;
  }

  if (userData.role === "admin") {
    const AdminDashboard = require('./src/screens/AdminDashboard').default;
    return <AdminDashboard />;
  }

  if (userData.role === "super_admin") {
    const SuperAdminDashboard = require('./src/screens/SuperAdminDashboard').default;
    return <SuperAdminDashboard />;
  }

  if (userData.role === "resident") {
    const ResidentDashboard = require('./src/screens/ResidentDashboard').default;
    return <ResidentDashboard />;
  }

  return null;
};

export default function App() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return undefined;
    }

    const style = document.createElement('style');
    style.setAttribute('data-app-scroll-lock', 'true');
    style.textContent = `
      html, body {
        height: 100%;
        margin: 0;
        overflow: hidden;
      }

      body > div,
      #root,
      #root > div {
        height: 100%;
        overflow: hidden;
      }
    `;

    document.head.appendChild(style);

    const favicon = document.querySelector('link[rel="icon"]') || document.createElement('link');
    favicon.setAttribute('rel', 'icon');
    favicon.setAttribute('href', '/favicon.ico');
    document.head.appendChild(favicon);

    return () => {
      style.remove();
    };
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
