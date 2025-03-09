import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { votingPlatformService } from '../services/votingPlatform';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const ProposalList = () => {
  const [proposals, setProposals] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProposals();
  }, [activeTab]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await votingPlatformService.getProposals(activeTab);
      setProposals(Array.isArray(data) ? data : []);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to fetch proposals');
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Proposals</h1>
        <Link
          to="/proposals/create"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Proposal
        </Link>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              className={
                activeTab === 'active'
                  ? 'border-blue-500 text-blue-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium'
              }
              onClick={() => setActiveTab('active')}
            >
              Active Proposals
            </button>
            <button
              className={
                activeTab === 'completed'
                  ? 'border-blue-500 text-blue-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium'
              }
              onClick={() => setActiveTab('completed')}
            >
              Completed Proposals
            </button>
          </nav>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchProposals} />
      ) : (
        <div className="grid gap-6">
          {proposals.map((proposal) => (
            <Link
              key={proposal.id}
              to={`/proposals/${proposal.id}`}
              className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold mb-2">{proposal.title}</h2>
                  <p className="text-gray-600 mb-4 line-clamp-2">{proposal.content}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <span>Created by {proposal.created_by.email}</span>
                    <span className="mx-2">•</span>
                    <span>Created {formatDate(proposal.created_at)}</span>
                    <span className="mx-2">•</span>
                    <span>
                      Voting ends {formatDate(proposal.voting_end_date)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <span>{proposal.versions.count} versions</span>
                    <span>{proposal.comments.count} comments</span>
                    <span>{proposal.votes.count} votes</span>
                  </div>
                </div>
                <div className="ml-4">
                  <span className={
                    proposal.status === 'active'
                      ? 'bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm'
                      : 'bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm'
                  }>
                    {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {proposals.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No {activeTab} proposals found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProposalList; 