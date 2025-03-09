import axios from 'axios';
import { toast } from 'react-toastify';

const BASE_URL = '/api/proposals';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
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
    
    switch (error.response?.status) {
      case 401:
        toast.error('Please login to continue');
        // Redirect to login if needed
        break;
      case 403:
        toast.error('You do not have permission to perform this action');
        break;
      case 404:
        toast.error('Resource not found');
        break;
      case 422:
        toast.error('Invalid data provided');
        break;
      default:
        toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

export const votingPlatformService = {
  // Proposal related functions
  getProposals: async (status = 'active') => {
    return api.get('/', { params: { status } });
  },

  getProposalById: async (id) => {
    return api.get(`/${id}`);
  },

  createProposal: async (proposalData) => {
    return api.post('/create', proposalData);
  },

  updateProposal: async (id, proposalData) => {
    return api.put(`/${id}`, proposalData);
  },

  // Version history
  getProposalVersions: async (proposalId) => {
    return api.get(`/${proposalId}/versions`);
  },

  // Comments
  getComments: async (proposalId) => {
    return api.get(`/${proposalId}/comments`);
  },

  addComment: async (proposalId, comment) => {
    return api.post(`/${proposalId}/comments`, comment);
  },

  // Voting
  castVote: async (proposalId, voteData) => {
    return api.post(`/${proposalId}/votes`, voteData);
  },

  getVotingResults: async (proposalId) => {
    return api.get(`/${proposalId}/votes`);
  }
}; 