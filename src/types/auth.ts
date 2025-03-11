import { ReactNode } from 'react';

export interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export interface PrivateRouteProps {
  children: ReactNode;
}

export interface AuthResponse {
  token: string;
  admin_id: string;
} 