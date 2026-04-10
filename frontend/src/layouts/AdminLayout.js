import React from 'react';
import BaseLayout from './BaseLayout';
import { FiHome, FiUsers, FiAlertTriangle, FiBell, FiBarChart2, FiPieChart, FiCalendar } from '../utils/iconCompat';

const AdminLayout = ({ children, activeScreen, onNavigate, title }) => {
  const menuItems = [
    { label: 'Dashboard', screen: 'Dashboard', icon: FiHome },
    { label: 'Residents', screen: 'ResidentApproval', icon: FiUsers },
    { label: 'Issues', screen: 'IssueManagement', icon: FiAlertTriangle },
    { label: 'Announcements', screen: 'Announcements', icon: FiBell },
    { label: 'Polls', screen: 'Polls', icon: FiBarChart2 },
    { label: 'Bookings', screen: 'AdminBookingScreen', icon: FiCalendar },
    { label: 'Analytics', screen: 'Analytics', icon: FiPieChart },
  ];

  return (
    <BaseLayout 
      menuItems={menuItems} 
      activeScreen={activeScreen} 
      onNavigate={onNavigate} 
      title={title || 'Admin Panel'}
    >
      {children}
    </BaseLayout>
  );
};

export default AdminLayout;
