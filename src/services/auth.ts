import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { AuthResponse } from '../types/api';

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: '/api/auth',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response: AxiosResponse): any => response.data,
  (error) => {
    const message = error.response?.data?.error || 'An unexpected error occurred';
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const authService = {
  check: async (): Promise<AuthResponse> => {
    return api.get('/check');
  }
}; 