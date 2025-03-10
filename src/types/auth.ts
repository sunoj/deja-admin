export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export interface PrivateRouteProps {
  children: React.ReactNode;
} 