import axios from 'axios';
import { ProposalData, ProposalResponse, ProposalVersion, Comment, VotingResult } from '../types/proposal';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

export const votingPlatformService = {
  createProposal: async (proposalData: ProposalData): Promise<ProposalResponse> => {
    const response = await axios.post(`${API_BASE_URL}/proposals`, proposalData);
    return response.data;
  },

  getProposal: async (id: string): Promise<ProposalResponse> => {
    const response = await axios.get(`${API_BASE_URL}/proposals/${id}`);
    return response.data;
  },

  getProposals: async (status: 'active' | 'completed'): Promise<ProposalData[]> => {
    const response = await axios.get(`${API_BASE_URL}/proposals`, {
      params: { status }
    });
    return response.data;
  },

  updateProposal: async (id: string, proposalData: Partial<ProposalData>): Promise<ProposalResponse> => {
    const response = await axios.put(`${API_BASE_URL}/proposals/${id}`, proposalData);
    return response.data;
  },

  deleteProposal: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/proposals/${id}`);
  },

  getProposalById: async (id: string): Promise<ProposalData> => {
    const response = await axios.get(`${API_BASE_URL}/proposals/${id}`);
    return response.data.proposal;
  },

  getProposalVersions: async (id: string): Promise<ProposalVersion[]> => {
    const response = await axios.get(`${API_BASE_URL}/proposals/${id}/versions`);
    return response.data;
  },

  getComments: async (id: string): Promise<Comment[]> => {
    const response = await axios.get(`${API_BASE_URL}/proposals/${id}/comments`);
    return response.data;
  },

  addComment: async (id: string, data: { content: string }): Promise<Comment> => {
    const response = await axios.post(`${API_BASE_URL}/proposals/${id}/comments`, data);
    return response.data;
  },

  getVotingResults: async (id: string): Promise<VotingResult> => {
    const response = await axios.get(`${API_BASE_URL}/proposals/${id}/voting-results`);
    return response.data;
  },

  castVote: async (id: string, data: { support: boolean }): Promise<void> => {
    try {
      console.log('Sending vote request:', { id, data });
      const response = await axios.post(`${API_BASE_URL}/proposals/${id}/votes`, data);
      console.log('Vote response:', response.data);
    } catch (error: any) {
      console.error('Vote request failed:', error.response?.data || error);
      throw error;
    }
  }
}; 