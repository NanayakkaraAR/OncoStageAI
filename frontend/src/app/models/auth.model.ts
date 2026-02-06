export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'PATIENT' | 'DOCTOR' | 'ADMIN';
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}
