import React, { useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import AdminDashboard from './src/screens/AdminDashboard';
import ResidentDashboard from './src/screens/ResidentDashboard';
import WaitingScreen from './src/screens/WaitingScreen';
import SuperAdminDashboard from './src/screens/SuperAdminDashboard';

const AppContent = () => {
  const { user, userData, loading } = useContext(AuthContext);

  if (loading) return null;

  if (user == null) {
    return <LoginScreen />;
  }

  if (user && !userData) {
    return <RegisterScreen />;
  }

  if (userData.status === "pending" || userData.status === "rejected" || userData.status === "blocked" || userData.status === "deleted") {
    return <WaitingScreen />;
  }

  if (userData.role === "admin") {
    return <AdminDashboard />;
  }

  if (userData.role === "super_admin") {
    return <SuperAdminDashboard />;
  }

  if (userData.role === "resident") {
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
