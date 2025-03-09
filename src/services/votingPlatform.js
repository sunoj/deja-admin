import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api/proposals',
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

export const votingPlatformService = {
  // Proposal related functions
  getProposals: async (status = 'active') => {
    return api.get('/list', { params: { status } });
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
  },

  // Admin voting power
  updateVotingPower: async (adminId, votingPower) => {
    return api.put(`/admins/${adminId}/voting_power`, { voting_power: votingPower });
  }
}; 