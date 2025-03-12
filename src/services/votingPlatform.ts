import axios from 'axios';
import { ProposalData, ProposalResponse, ProposalVersion, Comment, VotingResult } from '../types/proposal';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
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

export const votingPlatformService = {
  createProposal: async (proposalData: ProposalData): Promise<ProposalResponse> => {
    const response = await axiosInstance.post('/proposals/create', proposalData);
    return response.data;
  },

  getProposal: async (id: string): Promise<ProposalResponse> => {
    const response = await axiosInstance.get(`/proposals/${id}`);
    return response.data;
  },

  getProposals: async (status: 'active' | 'completed'): Promise<ProposalData[]> => {
    const response = await axiosInstance.get('/proposals/list', {
      params: { status }
    });
    return response.data;
  },

  updateProposal: async (id: string, proposalData: Partial<ProposalData>): Promise<ProposalResponse> => {
    const response = await axiosInstance.put(`/proposals/${id}`, proposalData);
    return response.data;
  },

  deleteProposal: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/proposals/${id}`);
  },

  getProposalById: async (id: string): Promise<ProposalData> => {
    const response = await axiosInstance.get(`/proposals/${id}`);
    return response.data;
  },

  getProposalVersions: async (id: string): Promise<ProposalVersion[]> => {
    const response = await axiosInstance.get(`/proposals/${id}/versions`);
    return response.data;
  },

  getComments: async (id: string): Promise<Comment[]> => {
    const response = await axiosInstance.get(`/proposals/${id}/comments`);
    return response.data;
  },

  addComment: async (id: string, data: { content: string }): Promise<Comment> => {
    const response = await axiosInstance.post(`/proposals/${id}/comments`, data);
    return response.data;
  },

  getVotingResults: async (id: string): Promise<VotingResult> => {
    const response = await axiosInstance.get(`/proposals/${id}/votes`);
    return response.data;
  },

  castVote: async (id: string, data: { support: boolean }): Promise<void> => {
    try {
      console.log('Sending vote request:', { id, data });
      const response = await axiosInstance.post(`/proposals/${id}/votes`, data);
      console.log('Vote response:', response.data);
    } catch (error: any) {
      console.error('Vote request failed:', error.response?.data || error);
      throw error;
    }
  }
}; 