// API Configuration
// For Android emulator, use 10.0.2.2 instead of localhost
// For iOS simulator, localhost works
// For physical device, use your computer's IP address

export const API_BASE_URL = __DEV__
  ? 'http://192.168.43.192:5000'  // Physical device - your computer's IP
  // ? 'http://10.0.2.2:5000'  // Android emulator
  // ? 'http://localhost:5000'  // iOS simulator
  : 'https://your-production-api.com';

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
