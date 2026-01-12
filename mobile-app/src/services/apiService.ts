import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';

// Types
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user_id: number;
}

export interface RegisterData {
  username: string;
  password: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface Doctor {
  id: number;
  name: string;
  specialization: string;
  availability: string;
}

export interface Appointment {
  id: number;
  doctor_id: number;
  doctor_name: string;
  date: string;
  serial_number: number;
  availability: string;
}

export interface CreateAppointmentData {
  doctor_id: number;
  date: string;
}

export interface ProcessAudioResponse {
  user_text: string;
  llm_response: string;
  //audio_id: string;
  error?: string;
}

class ApiService {
  private axiosInstance: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Use shared promise to prevent multiple refresh calls
            if (!this.refreshTokenPromise) {
              this.refreshTokenPromise = this.refreshAccessToken();
            }

            const newAccessToken = await this.refreshTokenPromise;
            this.refreshTokenPromise = null;

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear tokens and reject
            await AsyncStorage.multiRemove([
              'access_token',
              'refresh_token',
              'user_id',
            ]);
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(
      `${API_BASE_URL}${API_ENDPOINTS.REFRESH}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      }
    );

    const { access_token } = response.data;
    await AsyncStorage.setItem('access_token', access_token);
    return access_token;
  }

  // Authentication
  async login(data: LoginData): Promise<LoginResponse> {
    const response = await this.axiosInstance.post<LoginResponse>(
      API_ENDPOINTS.LOGIN,
      data
    );
    return response.data;
  }

  async register(data: RegisterData): Promise<{ message: string }> {
    const response = await this.axiosInstance.post<{ message: string }>(
      API_ENDPOINTS.REGISTER,
      data
    );
    return response.data;
  }

  // Doctors
  async getDoctors(): Promise<Doctor[]> {
    const response = await this.axiosInstance.get<Doctor[]>(
      API_ENDPOINTS.DOCTORS
    );
    return response.data;
  }

  // Appointments
  async getAppointments(): Promise<Appointment[]> {
    const response = await this.axiosInstance.get<Appointment[]>(
      API_ENDPOINTS.APPOINTMENTS
    );
    return response.data;
  }

  async createAppointment(
    data: CreateAppointmentData
  ): Promise<{ message: string; appointment: Appointment }> {
    const response = await this.axiosInstance.post<{
      message: string;
      appointment: Appointment;
    }>(API_ENDPOINTS.APPOINTMENTS, data);
    return response.data;
  }

  async cancelAppointment(appointmentId: number): Promise<{ message: string }> {
    const response = await this.axiosInstance.delete<{ message: string }>(
      `${API_ENDPOINTS.APPOINTMENTS}/${appointmentId}`
    );
    return response.data;
  }

  // Voice Assistant
  async processAudio(
    audioUri: string,
    language: string
  ): Promise<ProcessAudioResponse> {
    const formData = new FormData();

    // Create audio file object for FormData
    const audioFile: any = {
      uri: audioUri,
      type: 'audio/wav',
      name: 'audio.wav',
    };

    formData.append('audio', audioFile);
    formData.append('language', language);

    const response = await this.axiosInstance.post<ProcessAudioResponse>(
      API_ENDPOINTS.PROCESS_AUDIO,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  getAudioUrl(audioId: string): string {
    return `${API_BASE_URL}${API_ENDPOINTS.GET_AUDIO}/${audioId}`;
  }

  async cleanupAudio(audioId: string): Promise<void> {
    await this.axiosInstance.delete(
      `${API_ENDPOINTS.CLEANUP_AUDIO}/${audioId}`
    );
  }
}

export const apiService = new ApiService();
