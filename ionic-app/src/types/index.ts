// Type definitions for the application

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
  patient_name: string;
  patient_age?: number;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  confirm_password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user_id: number;
}

export interface RefreshResponse {
  access_token: string;
}

export interface ProcessAudioResponse {
  user_text: string;
  llm_response: string;
  audio_id?: string;
}

export interface ProcessTextResponse {
  llm_response: string;
  audio_id?: string;
}

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export interface CreateAppointmentData {
  doctor_id: number;
  date: string;
  patient_name: string;
  patient_age: number;
}

export interface ApiError {
  message: string;
  status?: number;
}
