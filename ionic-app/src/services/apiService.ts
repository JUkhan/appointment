import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_ENDPOINTS, REQUEST_TIMEOUT, TOKEN_KEYS } from '../constants/api';
import storageService from './storageService';
import { extractRole } from '../utils/jwtUtils';
import type {
  LoginData,
  RegisterData,
  LoginResponse,
  RefreshResponse,
  Doctor,
  Appointment,
  CreateAppointmentData,
  ProcessAudioResponse,
  ProcessTextResponse,
  CreateClientData,
  CreateClientResponse,
  GetClientUsersResponse,
  UpdateDataUserRequest,
  UpdateDataUserResponse,
} from '../types';

// Flag to prevent multiple concurrent refresh requests
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Callback for role change notification
let roleChangeNotifier: (() => void) | null = null;

/**
 * Set callback to notify when role changes after token refresh
 */
export const setRoleChangeNotifier = (callback: (() => void) | null) => {
  roleChangeNotifier = callback;
};

// Subscribe to token refresh
const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

// Notify all subscribers when token is refreshed
const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  // Note: withCredentials not needed since we use Bearer tokens in headers
});

// Request interceptor to inject access token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await storageService.getItem(TOKEN_KEYS.ACCESS_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401 and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for the token to be refreshed
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await storageService.getItem(TOKEN_KEYS.REFRESH_TOKEN);
        if (!refreshToken) {
          // No refresh token available, clear storage and redirect to login
          isRefreshing = false;
          await storageService.multiRemove([
            TOKEN_KEYS.ACCESS_TOKEN,
            TOKEN_KEYS.REFRESH_TOKEN,
            TOKEN_KEYS.USER_ID,
          ]);
          window.location.href = '/login';
          throw new Error('No refresh token available');
        }

        // Get old role before refresh
        const oldToken = await storageService.getItem(TOKEN_KEYS.ACCESS_TOKEN);
        const oldRole = oldToken ? extractRole(oldToken) : null;

        // Refresh the token
        const response = await axios.post<RefreshResponse>(
          `${API_BASE_URL}${API_ENDPOINTS.REFRESH}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        const { access_token } = response.data;
        await storageService.setItem(TOKEN_KEYS.ACCESS_TOKEN, access_token);

        // Check if role changed
        const newRole = extractRole(access_token);
        if (oldRole !== newRole && roleChangeNotifier) {
          console.log('Role changed after token refresh:', { oldRole, newRole });
          // Notify AuthContext to refresh role
          roleChangeNotifier();
        }

        // Notify all waiting requests
        onTokenRefreshed(access_token);
        isRefreshing = false;

        // Retry the original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        // Clear tokens on refresh failure
        await storageService.multiRemove([
          TOKEN_KEYS.ACCESS_TOKEN,
          TOKEN_KEYS.REFRESH_TOKEN,
          TOKEN_KEYS.USER_ID,
        ]);

        // Redirect to login page
        window.location.href = '/login';

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API Service methods
export const apiService = {
  /**
   * Login user
   */
  async login(data: LoginData): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(API_ENDPOINTS.LOGIN, data);
    return response.data;
  },

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(API_ENDPOINTS.REGISTER, data);
    return response.data;
  },

  /**
   * Create new client (organization)
   */
  async createClient(data: CreateClientData): Promise<CreateClientResponse> {
    const response = await apiClient.post<CreateClientResponse>(API_ENDPOINTS.CREATE_CLIENT, data);
    return response.data;
  },

  /**
   * Get all users for a specific client
   */
  async getClientUsers(clientId: string): Promise<GetClientUsersResponse> {
    const response = await apiClient.get<GetClientUsersResponse>(
      API_ENDPOINTS.GET_CLIENT_USERS(clientId)
    );
    return response.data;
  },

  /**
   * Update a data user
   */
  async updateDataUser(userId: string, data: UpdateDataUserRequest): Promise<UpdateDataUserResponse> {
    const response = await apiClient.put<UpdateDataUserResponse>(
      API_ENDPOINTS.UPDATE_DATA_USER(userId),
      data
    );
    return response.data;
  },

  /**
   * Get all doctors
   */
  async getDoctors(): Promise<Doctor[]> {
    const response = await apiClient.get<Doctor[] | { doctors: Doctor[] }>(API_ENDPOINTS.DOCTORS);
    // Handle both direct array and wrapped object response
    return Array.isArray(response.data) ? response.data : response.data.doctors;
  },

  /**
   * Get user appointments
   */
  async getAppointments(): Promise<Appointment[]> {
    const response = await apiClient.get<Appointment[] | { appointments: Appointment[] }>(
      API_ENDPOINTS.APPOINTMENTS
    );
    // Handle both direct array and wrapped object response
    return Array.isArray(response.data) ? response.data : response.data.appointments;
  },

  /**
   * Create new appointment
   */
  async createAppointment(data: CreateAppointmentData): Promise<Appointment> {
    const response = await apiClient.post<Appointment>(API_ENDPOINTS.CREATE_APPOINTMENT, data);
    return response.data;
  },

  /**
   * Cancel appointment
   */
  async cancelAppointment(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      API_ENDPOINTS.CANCEL_APPOINTMENT(id)
    );
    return response.data;
  },

  /**
   * Process audio for voice assistant
   */
  async processAudio(audioBlob: Blob, language: string): Promise<ProcessAudioResponse> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('language', language);

    const response = await apiClient.post<ProcessAudioResponse>(
      API_ENDPOINTS.PROCESS_AUDIO,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Process text for voice assistant
   */
  async processText(text: string, language: string): Promise<ProcessTextResponse> {
    const response = await apiClient.post<ProcessTextResponse>(API_ENDPOINTS.PROCESS_TEXT, {
      'user-text': text,
      language,
    });
    return response.data;
  },

  /**
   * Get audio file
   */
  async getAudio(id: string): Promise<Blob> {
    const response = await apiClient.get(API_ENDPOINTS.GET_AUDIO(id), {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Cleanup audio file
   */
  async cleanup(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.CLEANUP(id));
  },
};

export default apiService;
