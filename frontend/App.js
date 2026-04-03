import React, { useContext } from 'react';
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
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
