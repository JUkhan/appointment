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
  client_id?: string;
}

export interface RegisterData {
  username: string;
  password: string;
  confirm_password: string;
  client_id?: string;
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
  continued?: boolean;
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

export interface CreateClientData {
  business_name: string;
  address: string;
  email: string;
  mobile: string;
  is_active?: boolean;
  modules?: string;
}

export interface Client {
  id: string;
  business_name: string;
  address: string;
  email: string;
  mobile: string;
  is_active: boolean;
  modules: string;
  created_at: string;
}

export interface CreateClientResponse {
  message: string;
  client: Client;
}

// Data Center User types
export interface DataUser {
  id: string;
  username: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface GetClientUsersResponse {
  client_id: string;
  client_name: string;
  users: DataUser[];
  total_users: number;
}

export interface UpdateDataUserRequest {
  username?: string;
  is_active?: boolean;
  new_password?: string;
  old_password?: string;
}

export interface UpdateDataUserResponse {
  message: string;
  user: DataUser;
}

// Role-based authorization types
export type UserRole = string; // Can be 'admin', 'doctor', 'patient', 'receptionist', etc.
export type Username = string;
export interface RoleChangeEvent {
  oldRole: string | null;
  newRole: string | null;
  timestamp: Date;
}

export type RoleChangeCallback = (event: RoleChangeEvent) => void;
