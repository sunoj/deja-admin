import axios from 'axios';

const BASE_URL = '/api/voting-platform';

export const votingPlatformService = {
  // Proposal related functions
  getProposals: async (status = 'active') => {
    const response = await axios.get(`${BASE_URL}/proposals`, { params: { status } });
    return response.data;
  },

  getProposalById: async (id) => {
    const response = await axios.get(`${BASE_URL}/proposals/${id}`);
    return response.data;
  },

  createProposal: async (proposalData) => {
    const response = await axios.post(`${BASE_URL}/proposals`, proposalData);
    return response.data;
  },

  updateProposal: async (id, proposalData) => {
    const response = await axios.put(`${BASE_URL}/proposals/${id}`, proposalData);
    return response.data;
  },

  // Version history
  getProposalVersions: async (proposalId) => {
    const response = await axios.get(`${BASE_URL}/proposals/${proposalId}/versions`);
    return response.data;
  },

  // Comments
  getComments: async (proposalId) => {
    const response = await axios.get(`${BASE_URL}/proposals/${proposalId}/comments`);
    return response.data;
  },

  addComment: async (proposalId, comment) => {
    const response = await axios.post(`${BASE_URL}/proposals/${proposalId}/comments`, comment);
    return response.data;
  },

  // Voting
  castVote: async (proposalId, voteData) => {
    const response = await axios.post(`${BASE_URL}/proposals/${proposalId}/votes`, voteData);
    return response.data;
  },

  getVotingResults: async (proposalId) => {
    const response = await axios.get(`${BASE_URL}/proposals/${proposalId}/votes`);
    return response.data;
  }
}; 