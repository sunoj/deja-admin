// Get token from localStorage
const getToken = () => localStorage.getItem('admin_token');

// Set token in localStorage
const setToken = (token) => {
  if (token) {
    localStorage.setItem('admin_token', token);
  } else {
    localStorage.removeItem('admin_token');
  }
};

// Common headers for API requests
const getHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

// Handle API response
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }
  return response.json();
};

// Auth API
export const authApi = {
  login: async (username, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponse(response);
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },

  logout: async () => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: getHeaders(),
    });
    await handleResponse(response);
    setToken(null);
  },

  checkAuth: async () => {
    const response = await fetch('/api/auth/check', {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  register: async (username, password) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponse(response);
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },
};

// Data API
export const dataApi = {
  fetchCheckins: async () => {
    const response = await fetch('/api/checkins/all', {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  fetchWorkOrders: async (startDate, endDate, employeeId = 'all') => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate.toISOString());
    if (endDate) params.append('end_date', endDate.toISOString());
    if (employeeId !== 'all') params.append('employee_id', employeeId);
    params.append('all', 'true'); // Get all work orders for the date range

    const response = await fetch(`/api/work-orders?${params.toString()}`, {
      headers: getHeaders(),
    });
    const data = await handleResponse(response);
    return data.work_orders || [];
  },

  fetchSopRecords: async (startDate, endDate, employeeId = 'all') => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate.toISOString());
    if (endDate) params.append('end_date', endDate.toISOString());
    if (employeeId !== 'all') params.append('employee_id', employeeId);
    params.append('all', 'true'); // Get all records for the date range

    const response = await fetch(`/api/records?${params.toString()}`, {
      headers: getHeaders(),
    });
    const data = await handleResponse(response);
    return data.records || [];
  },
};

// Utility functions
export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getStatusText(lateStatus) {
  switch(lateStatus) {
    case 'perfect_on_time': return 'Perfect on Time';
    case 'on_time': return 'On Time';
    case 'late_10': return 'Late (10%)';
    case 'late_15': return 'Late (15%)';
    default: return 'Unknown';
  }
}

export function getStatusClass(lateStatus) {
  switch(lateStatus) {
    case 'perfect_on_time':
    case 'on_time': return 'on-time';
    case 'late_10': return 'late';
    case 'late_15': return 'very-late';
    default: return '';
  }
} 