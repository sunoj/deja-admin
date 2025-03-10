import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api/auth',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
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
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || 'An unexpected error occurred';
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const authService = {
  check: async () => {
    return api.get('/check');
  }
}; 