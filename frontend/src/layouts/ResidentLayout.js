import React from 'react';
import BaseLayout from './BaseLayout';
import { FiHome, FiAlertTriangle, FiMessageCircle, FiBell, FiUser } from '../utils/iconCompat';

const ResidentLayout = ({ children, activeScreen, onNavigate, title }) => {
  const menuItems = [
    { label: 'Home', screen: 'Home', icon: FiHome },
    { label: 'Issues', screen: 'MyIssues', icon: FiAlertTriangle },
    { label: 'Community', screen: 'CommunityChat', icon: FiMessageCircle },
    { label: 'Announcements', screen: 'Announcements', icon: FiBell },
    { label: 'Profile', screen: 'Profile', icon: FiUser },
  ];

  return (
    <BaseLayout 
      menuItems={menuItems} 
      activeScreen={activeScreen} 
      onNavigate={onNavigate} 
      title={title || 'Resident Dashboard'}
    >
      {children}
    </BaseLayout>
  );
};

export default ResidentLayout;
