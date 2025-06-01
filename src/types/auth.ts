export interface User {
  id: string;
  email: string;
  created_at: Date;
  updated_at: Date;
  full_name?: string;
  avatar_url?: string;
  last_login?: Date;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  full_name: string;
}