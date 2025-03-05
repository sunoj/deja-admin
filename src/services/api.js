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
};

// Data API
export const dataApi = {
  fetchCheckins: async () => {
    const response = await fetch('/api/checkins/all', {
      headers: getHeaders(),
    });
    return handleResponse(response);
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
    case 'on_time': return 'On Time';
    case 'late': return 'Late';
    case 'very_late': return 'Very Late';
    case 'extremely_late': return 'Extremely Late';
    default: return 'Unknown';
  }
}

export function getStatusClass(lateStatus) {
  switch(lateStatus) {
    case 'perfect_on_time':
    case 'on_time': return 'on-time';
    case 'late': return 'late';
    case 'very_late': return 'very-late';
    case 'extremely_late': return 'extremely-late';
    default: return '';
  }
} 