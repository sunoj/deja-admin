import {
  AuthResponse,
  ApiHeaders,
  Employee,
  Checkin,
  WorkOrder,
  SopRecord,
  LeaveRequest,
  LateStatus
} from '../types/api';

// Get token from localStorage
const getToken = (): string | null => localStorage.getItem('admin_token');

// Set token in localStorage
const setToken = (token: string | null): void => {
  if (token) {
    localStorage.setItem('admin_token', token);
  } else {
    localStorage.removeItem('admin_token');
  }
};

// Common headers for API requests
const getHeaders = (): ApiHeaders => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

// Handle API response
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }
  return response.json();
};

// Auth API
export const authApi = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponse<AuthResponse>(response);
    if (data.token) {
      setToken(data.token);
    }
    if (data.admin_id) {
      localStorage.setItem('admin_id', data.admin_id);
    }
    return data;
  },

  logout: async (): Promise<void> => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: getHeaders(),
    });
    await handleResponse(response);
    setToken(null);
  },

  checkAuth: async (): Promise<AuthResponse> => {
    const response = await fetch('/api/auth/check', {
      headers: getHeaders(),
    });
    return handleResponse<AuthResponse>(response);
  },

  register: async (username: string, password: string, email: string): Promise<AuthResponse> => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password, email }),
    });
    const data = await handleResponse<AuthResponse>(response);
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },
};

// Data API
export const dataApi = {
  fetchCheckins: async (
    startDate?: Date | string,
    endDate?: Date | string,
    employeeId: string = 'all'
  ): Promise<Checkin[]> => {
    const params = new URLSearchParams();
    if (startDate) {
      const start = startDate instanceof Date ? startDate : new Date(startDate);
      params.append('start_date', start.toISOString().split('T')[0]);
    }
    if (endDate) {
      const end = endDate instanceof Date ? endDate : new Date(endDate);
      params.append('end_date', end.toISOString().split('T')[0]);
    }
    if (employeeId !== 'all') params.append('employee_id', employeeId);

    const url = `/api/checkins/all?${params.toString()}`;
    console.log('Fetching checkins:', {
      url,
      params: Object.fromEntries(params.entries())
    });

    const response = await fetch(url, {
      headers: getHeaders(),
    });
    const data = await handleResponse<{ checkins: Checkin[] } | Checkin[]>(response);
    console.log('Checkins response:', data);
    return Array.isArray(data) ? data : (data.checkins || []);
  },

  getEmployees: async (): Promise<Employee[]> => {
    const response = await fetch('/api/employees', {
      headers: getHeaders(),
    });
    const data = await handleResponse<{ employees: Employee[] } | Employee[]>(response);
    return Array.isArray(data) ? data : (data.employees || []);
  },

  fetchWorkOrders: async (
    startDate?: Date | string,
    endDate?: Date | string,
    employeeId: string = 'all'
  ): Promise<WorkOrder[]> => {
    const params = new URLSearchParams();
    if (startDate) {
      const start = startDate instanceof Date ? startDate : new Date(startDate);
      params.append('start_date', start.toISOString().split('T')[0]);
    }
    if (endDate) {
      const end = endDate instanceof Date ? endDate : new Date(endDate);
      params.append('end_date', end.toISOString().split('T')[0]);
    }
    if (employeeId !== 'all') params.append('employee_id', employeeId);
    params.append('all', 'true'); // Get all work orders for the date range

    const url = `/api/work-orders?${params.toString()}`;
    console.log('Fetching work orders:', {
      url,
      params: Object.fromEntries(params.entries())
    });

    const response = await fetch(url, {
      headers: getHeaders(),
    });
    const data = await handleResponse<{ work_orders: WorkOrder[] }>(response);
    console.log('Work orders response:', data);
    return data.work_orders || [];
  },

  fetchSopRecords: async (
    startDate?: Date | string,
    endDate?: Date | string,
    employeeId: string = 'all'
  ): Promise<SopRecord[]> => {
    const params = new URLSearchParams();
    if (startDate) {
      const start = startDate instanceof Date ? startDate : new Date(startDate);
      params.append('start_date', start.toISOString().split('T')[0]);
    }
    if (endDate) {
      const end = endDate instanceof Date ? endDate : new Date(endDate);
      params.append('end_date', end.toISOString().split('T')[0]);
    }
    if (employeeId !== 'all') params.append('employee_id', employeeId);
    params.append('all', 'true'); // Get all records for the date range

    const url = `/api/records?${params.toString()}`;
    console.log('Fetching SOP records:', {
      url,
      params: Object.fromEntries(params.entries())
    });

    const response = await fetch(url, {
      headers: getHeaders(),
    });
    const data = await handleResponse<{ records: SopRecord[] }>(response);
    console.log('SOP records response:', data);
    return data.records || [];
  },

  updateLeaveRequest: async (requestId: string, action: 'APPROVE' | 'REJECT'): Promise<void> => {
    const response = await fetch(`/api/leave/approve`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ 
        requestId,
        status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      }),
    });
    await handleResponse(response);
  },
};

// Utility functions
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getStatusText(lateStatus: LateStatus): string {
  switch(lateStatus) {
    case 'perfect_on_time': return 'Perfect on Time';
    case 'on_time': return 'On Time';
    case 'late_10': return 'Late (10%)';
    case 'late_15': return 'Late (15%)';
    default: return 'Unknown';
  }
}

export function getStatusClass(lateStatus: LateStatus): string {
  switch(lateStatus) {
    case 'perfect_on_time':
    case 'on_time': return 'on-time';
    case 'late_10': return 'late';
    case 'late_15': return 'very-late';
    default: return '';
  }
} 