import React from 'react';
import { Platform } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';

const featherWeb = Platform.OS === 'web' ? require('react-icons/fi') : null;
const ioniconsWeb = Platform.OS === 'web' ? require('react-icons/io5') : null;

const createIcon = (webIcon, NativeIcon, nativeName) => {
  const Icon = ({ size = 24, color = '#000000', ...props }) => {
    if (Platform.OS === 'web' && webIcon) {
      return React.createElement(webIcon, { size, color, ...props });
    }

    return <NativeIcon name={nativeName} size={size} color={color} {...props} />;
  };

  Icon.displayName = webIcon?.displayName || webIcon?.name || nativeName;
  return Icon;
};

const createFeatherIcon = (name, nativeName = name) => createIcon(featherWeb?.[name], Feather, nativeName);
const createIonicon = (name, nativeName = name) => createIcon(ioniconsWeb?.[name], Ionicons, nativeName);

export const FiActivity = createFeatherIcon('FiActivity', 'activity');
export const FiAlertCircle = createFeatherIcon('FiAlertCircle', 'alert-circle');
export const FiAlertTriangle = createFeatherIcon('FiAlertTriangle', 'alert-triangle');
export const FiArrowLeft = createFeatherIcon('FiArrowLeft', 'arrow-left');
export const FiArrowRight = createFeatherIcon('FiArrowRight', 'arrow-right');
export const FiBarChart2 = createFeatherIcon('FiBarChart2', 'bar-chart-2');
export const FiBell = createFeatherIcon('FiBell', 'bell');
export const FiCalendar = createFeatherIcon('FiCalendar', 'calendar');
export const FiCamera = createFeatherIcon('FiCamera', 'camera');
export const FiCheck = createFeatherIcon('FiCheck', 'check');
export const FiCheckCircle = createFeatherIcon('FiCheckCircle', 'check-circle');
export const FiChevronDown = createFeatherIcon('FiChevronDown', 'chevron-down');
export const FiChevronLeft = createFeatherIcon('FiChevronLeft', 'chevron-left');
export const FiChevronRight = createFeatherIcon('FiChevronRight', 'chevron-right');
export const FiClipboard = createFeatherIcon('FiClipboard', 'clipboard');
export const FiClock = createFeatherIcon('FiClock', 'clock');
export const FiEdit = createFeatherIcon('FiEdit', 'edit');
export const FiFileText = createFeatherIcon('FiFileText', 'file-text');
export const FiFilter = createFeatherIcon('FiFilter', 'filter');
export const FiFlag = createFeatherIcon('FiFlag', 'flag');
export const FiGlobe = createFeatherIcon('FiGlobe', 'globe');
export const FiGrid = createFeatherIcon('FiGrid', 'grid');
export const FiHelpCircle = createFeatherIcon('FiHelpCircle', 'help-circle');
export const FiHome = createFeatherIcon('FiHome', 'home');
export const FiImage = createFeatherIcon('FiImage', 'image');
export const FiInbox = createFeatherIcon('FiInbox', 'inbox');
export const FiInfo = createFeatherIcon('FiInfo', 'info');
export const FiLayers = createFeatherIcon('FiLayers', 'layers');
export const FiLifeBuoy = createFeatherIcon('FiLifeBuoy', 'life-buoy');
export const FiLogOut = createFeatherIcon('FiLogOut', 'log-out');
export const FiMail = createFeatherIcon('FiMail', 'mail');
export const FiMenu = createFeatherIcon('FiMenu', 'menu');
export const FiMessageCircle = createFeatherIcon('FiMessageCircle', 'message-circle');
export const FiMessageSquare = createFeatherIcon('FiMessageSquare', 'message-square');
export const FiMoon = createFeatherIcon('FiMoon', 'moon');
export const FiPhone = createFeatherIcon('FiPhone', 'phone');
export const FiPieChart = createFeatherIcon('FiPieChart', 'pie-chart');
export const FiPlay = createFeatherIcon('FiPlay', 'play');
export const FiPlus = createFeatherIcon('FiPlus', 'plus');
export const FiRadio = createFeatherIcon('FiRadio', 'radio');
export const FiSearch = createFeatherIcon('FiSearch', 'search');
export const FiSettings = createFeatherIcon('FiSettings', 'settings');
export const FiShield = createFeatherIcon('FiShield', 'shield');
export const FiSun = createFeatherIcon('FiSun', 'sun');
export const FiTrash2 = createFeatherIcon('FiTrash2', 'trash-2');
export const FiTrendingUp = createFeatherIcon('FiTrendingUp', 'trending-up');
export const FiUser = createFeatherIcon('FiUser', 'user');
export const FiUserCheck = createFeatherIcon('FiUserCheck', 'user-check');
export const FiUserPlus = createFeatherIcon('FiUserPlus', 'user-plus');
export const FiUsers = createFeatherIcon('FiUsers', 'users');
export const FiX = createFeatherIcon('FiX', 'x');
export const FiXCircle = createFeatherIcon('FiXCircle', 'x-circle');
export const FiZap = createFeatherIcon('FiZap', 'zap');

export const IoAddCircle = createIonicon('IoAddCircle', 'add-circle');
export const IoAlertCircle = createIonicon('IoAlertCircle', 'alert-circle');
export const IoArrowForward = createIonicon('IoArrowForward', 'arrow-forward');
export const IoBarChart = createIonicon('IoBarChart', 'bar-chart');
export const IoCalendar = createIonicon('IoCalendar', 'calendar');
export const IoChatbubbles = createIonicon('IoChatbubbles', 'chatbubbles');
export const IoCheckmarkCircle = createIonicon('IoCheckmarkCircle', 'checkmark-circle');
export const IoCheckmarkDoneCircle = createIonicon('IoCheckmarkDoneCircle', 'checkmark-done-circle');
export const IoCopy = createIonicon('IoCopy', 'copy');
export const IoDocumentText = createIonicon('IoDocumentText', 'document-text');
export const IoFlash = createIonicon('IoFlash', 'flash');
export const IoLocation = createIonicon('IoLocation', 'location');
export const IoMegaphone = createIonicon('IoMegaphone', 'megaphone');
export const IoNotifications = createIonicon('IoNotifications', 'notifications');
export const IoPeople = createIonicon('IoPeople', 'people');
export const IoRadio = createIonicon('IoRadio', 'radio');
export const IoShieldHalf = createIonicon('IoShieldHalf', 'shield-half');
export const IoSparkles = createIonicon('IoSparkles', 'sparkles');
export const IoStatsChart = createIonicon('IoStatsChart', 'stats-chart');
export const IoTimeOutline = createIonicon('IoTimeOutline', 'time-outline');
