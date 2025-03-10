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
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-0">Proposals</h1>
        <Link
          to="/proposals/create"
          className="w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-center"
        >
          Create Proposal
        </Link>
      </div>

      <div className="mb-4 sm:mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 sm:space-x-8">
            <button
              className={
                activeTab === 'active'
                  ? 'border-blue-500 text-blue-600 whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-sm sm:text-base'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-sm sm:text-base'
              }
              onClick={() => setActiveTab('active')}
            >
              Active Proposals
            </button>
            <button
              className={
                activeTab === 'completed'
                  ? 'border-blue-500 text-blue-600 whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-sm sm:text-base'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-sm sm:text-base'
              }
              onClick={() => setActiveTab('completed')}
            >
              Completed Proposals
            </button>
          </nav>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48 sm:h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchProposals} />
      ) : (
        <div className="grid gap-4 sm:gap-6">
          {proposals.map((proposal) => (
            <Link
              key={proposal.id}
              to={`/proposals/${proposal.id}`}
              className="block p-4 sm:p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                <div className="w-full min-w-0 flex-1">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h2 className="text-lg sm:text-xl font-semibold break-words flex-1">{proposal.title}</h2>
                    <span className={
                      proposal.status === 'active'
                        ? 'bg-green-100 text-green-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex-shrink-0'
                        : 'bg-gray-100 text-gray-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex-shrink-0'
                    }>
                      {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3 sm:mb-4 line-clamp-2 text-sm sm:text-base break-words">{proposal.content}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-0">
                    <span className="break-words">Created by {proposal.created_by_admin?.username || 'Unknown'}</span>
                    <span className="hidden sm:inline mx-2">•</span>
                    <span className="break-words">Created {formatDate(proposal.created_at)}</span>
                    <span className="hidden sm:inline mx-2">•</span>
                    <span className="break-words">Voting ends {formatDate(proposal.voting_end_date)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 flex-wrap">
                    <span className="break-words">{proposal.versions_count || 0} versions</span>
                    <span className="break-words">{proposal.comments_count || 0} comments</span>
                    <span className="break-words">{proposal.votes_count || 0} votes</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {proposals.length === 0 && (
            <div className="text-center py-8 sm:py-12 text-gray-500 text-sm sm:text-base">
              No {activeTab} proposals found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProposalList; 