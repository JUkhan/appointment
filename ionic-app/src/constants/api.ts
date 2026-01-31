import { Capacitor } from '@capacitor/core';

/**
 * API Configuration
 * Determines the base URL based on the platform
 */

// Platform detection
const isNative = Capacitor.isNativePlatform();
const isDevelopment = import.meta.env.DEV;

// Base URL configuration
const getBaseURL = (): string => {
  // Production URL (can be configured via environment variable)
  if (!isDevelopment) {
    return import.meta.env.VITE_API_URL || 'https://your-production-api.com';
  }

  // Development URLs
  if (isNative) {
    // For native (Android/iOS) in development - use local network IP
    return 'http://192.168.43.192:5000';
  } else {
    // For web in development - use localhost
    return 'http://localhost:5000';
  }
};

export const API_BASE_URL = getBaseURL();

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/login',
  REGISTER: '/register',
  REFRESH: '/refresh',

  // Client (Organization)
  CREATE_CLIENT: '/api/clients',
  GET_CLIENT_USERS: (clientId: string) => `/api/clients/${clientId}/users`,

  // Data Users
  UPDATE_DATA_USER: (userId: string) => `/api/data-users/${userId}`,

  // Doctors
  DOCTORS: '/doctors',

  // Appointments
  APPOINTMENTS: '/appointments',
  CREATE_APPOINTMENT: '/appointments',
  CANCEL_APPOINTMENT: (id: number) => `/appointments/${id}`,

  // Voice Assistant
  PROCESS_AUDIO: '/process-audio',
  PROCESS_TEXT: '/api/transactions',
  GET_AUDIO: (id: string) => `/get-audio/${id}`,
  CLEANUP: (id: string) => `/cleanup/${id}`,
} as const;

// Request timeout
export const REQUEST_TIMEOUT = 30000; // 30 seconds
export const CLIENT_ID = 'client_id';
// Token storage keys
export const TOKEN_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_ID: 'user_id',
} as const;
