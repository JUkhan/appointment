// API Configuration
// For Android emulator, use 10.0.2.2 instead of localhost
// For iOS simulator, localhost works
// For physical device, use your computer's IP address

import { Platform } from 'react-native';

const getApiUrl = () => {
  if (!__DEV__) {
    return 'https://your-production-api.com';
  }

  // For development
  // iOS simulator can use localhost
  if (Platform.OS === 'ios') {
    // For physical iPhone, uncomment this:
    return 'http://192.168.43.192:5000';  // Physical device
    // For iOS Simulator, use this instead:
    //return 'http://localhost:5000';
  }

  // Android emulator or physical device
  return 'http://192.168.43.192:5000';  // Physical device
  // return 'http://10.0.2.2:5000';  // Android emulator
};

export const API_BASE_URL = getApiUrl();

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  REFRESH: '/refresh',

  // Doctors
  DOCTORS: '/doctors',

  // Appointments
  APPOINTMENTS: '/appointments',

  // Voice Assistant
  PROCESS_AUDIO: '/process-audio',
  PROCESS_TEXT: '/process-text',
  GET_AUDIO: '/get-audio',
  CLEANUP_AUDIO: '/cleanup',
};
