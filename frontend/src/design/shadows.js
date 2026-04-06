import { Platform } from 'react-native';

const shadows = {
  card: Platform.select({
    web: {
      boxShadow: '0px 10px 24px rgba(15, 23, 42, 0.08)',
    },
    default: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 3,
    },
  }),
  hover: Platform.select({
    web: {
      boxShadow: '0px 16px 32px rgba(15, 23, 42, 0.12)',
    },
    default: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 5,
    },
  }),
};

export default shadows;
