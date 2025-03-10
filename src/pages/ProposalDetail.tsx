import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { votingPlatformService } from '../services/votingPlatform';
import { authService } from '../services/auth';
import ReactMarkdown from 'react-markdown';
import {
  ProposalData,
  ProposalVersion,
  Comment,
  VotingResult,
  User,
  ProposalFormData
} from '../types/proposal';

const ProposalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [versions, setVersions] = useState<ProposalVersion[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [votingResults, setVotingResults] = useState<VotingResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'proposal' | 'versions'>('proposal');
  const [newComment, setNewComment] = useState<string>('');
  const [voteChoice, setVoteChoice] = useState<boolean | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editContent, setEditContent] = useState<string>('');
  const [editChangeLog, setEditChangeLog] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      fetchProposalData();
      fetchCurrentUser();
    }
  }, [id]);

  useEffect(() => {
    if (currentUser && votingResults?.votingHistory) {
      const userVote = votingResults.votingHistory.find(vote => vote.voter.id === currentUser.id);
      if (userVote) {
        setVoteChoice(userVote.support);
      } else {
        setVoteChoice(null);
      }
    }
  }, [currentUser, votingResults]);

  const fetchProposalData = async (): Promise<void> => {
    if (!id) return;

    try {
      setLoading(true);
      const [proposalData, versionsData, commentsData, votingData] = await Promise.all([
        votingPlatformService.getProposalById(id),
        votingPlatformService.getProposalVersions(id),
        votingPlatformService.getComments(id),
        votingPlatformService.getVotingResults(id)
      ]);
      
      console.log('Fetched data:', { proposalData, versionsData, commentsData, votingData });
      console.log('Comments structure:', JSON.stringify(commentsData, null, 2));
      
      setProposal(proposalData);
      setVersions(versionsData);
      setComments(commentsData);
      setVotingResults(votingData);
    } catch (error) {
      console.error('Error fetching proposal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async (): Promise<void> => {
    try {
      const response = await authService.check();
      if (response.success && response.admin) {
        setCurrentUser(response.admin);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!newComment.trim() || !id) return;

    try {
      const response = await votingPlatformService.addComment(id, { content: newComment });
      console.log('Comment response:', response);
      setNewComment('');
      await fetchProposalData(); // Refresh comments
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const handleVote = async (support: boolean): Promise<void> => {
    if (!id) return;

    try {
      console.log('Casting vote:', { id, support });
      await votingPlatformService.castVote(id, { support });
      console.log('Vote cast successfully');
      setVoteChoice(support);
      await fetchProposalData(); // Refresh voting results
    } catch (error: any) {
      console.error('Error casting vote:', error);
      console.error('Error details:', error.response?.data);
      // Show error message to user
      alert(error.response?.data?.error || 'Failed to cast vote. Please try again.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim() || !editChangeLog.trim() || !id) return;

    try {
      await votingPlatformService.updateProposal(id, {
        title: editTitle,
        content: editContent,
        changeLog: editChangeLog
      });
      setShowEditModal(false);
      await fetchProposalData(); // Refresh proposal and versions
    } catch (error) {
      console.error('Error updating proposal:', error);
    }
  };

  const openEditModal = (): void => {
    if (!proposal) return;
    setEditTitle(proposal.title);
    setEditContent(proposal.content);
    setEditChangeLog('');
    setShowEditModal(true);
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      console.log('Original date string:', dateString);
      console.log('Parsed date:', date);
      const formattedDate = date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Bangkok'
      });
      console.log('Formatted date:', formattedDate);
      return formattedDate;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">Proposal not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold">{proposal.title}</h1>
              <p className="text-sm text-gray-500 mt-1">Created on {formatDate(proposal.created_at)}</p>
            </div>
            {currentUser && currentUser.id === proposal.created_by && (
              <button
                onClick={openEditModal}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Edit Proposal
              </button>
            )}
          </div>
          
          {showEditModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                <h2 className="text-2xl font-bold mb-4">Edit Proposal</h2>
                <form onSubmit={handleEditSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full p-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Content</label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-2 border rounded-lg h-64"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Change Log</label>
                    <textarea
                      value={editChangeLog}
                      onChange={(e) => setEditChangeLog(e.target.value)}
                      className="w-full p-2 border rounded-lg"
                      placeholder="Describe what changes you made..."
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="flex space-x-4 mb-6">
            <button
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'proposal'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab('proposal')}
            >
              Proposal
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'versions'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab('versions')}
            >
              Versions
            </button>
          </div>

          {activeTab === 'proposal' && (
            <div className="prose max-w-none">
              <ReactMarkdown>{proposal.content}</ReactMarkdown>
            </div>
          )}

          {activeTab === 'versions' && (
            <div className="space-y-4">
              {versions.map((version) => (
                <div key={version.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h3 className="text-lg font-medium">Version {version.version_number}</h3>
                      <p className="text-sm text-gray-500">{version.title}</p>
                    </div>
                    <span className="text-sm text-gray-500">{formatDate(version.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{version.change_log}</p>
                  <div className="prose max-w-none">
                    <ReactMarkdown>{version.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Comments</h2>
            <div className="space-y-4">
              <form onSubmit={handleSubmitComment} className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full p-2 border rounded-lg mb-2"
                  placeholder="Add a comment..."
                  rows={3}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Submit Comment
                </button>
              </form>

              {comments && comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">
                        {comment.author?.username || 'Unknown User'}
                      </span>
                      <span className="text-sm text-gray-500">{formatDate(comment.created_at)}</span>
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500">No comments yet</div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Voting</h2>
            <div className="space-y-4">
              {votingResults ? (
                <>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">Voting Results</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{votingResults.totalVotes || 0}</div>
                        <div className="text-sm text-gray-600">Total Votes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{votingResults.supportVotes || 0}</div>
                        <div className="text-sm text-gray-600">Support</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{votingResults.oppositionVotes || 0}</div>
                        <div className="text-sm text-gray-600">Oppose</div>
                      </div>
                    </div>
                  </div>

                  {currentUser && (
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={() => handleVote(true)}
                        className={`px-6 py-2 rounded-lg ${
                          voteChoice === true
                            ? 'bg-green-600 text-white'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        Support
                      </button>
                      <button
                        onClick={() => handleVote(false)}
                        className={`px-6 py-2 rounded-lg ${
                          voteChoice === false
                            ? 'bg-red-600 text-white'
                            : 'bg-red-500 text-white hover:bg-red-600'
                        }`}
                      >
                        Oppose
                      </button>
                    </div>
                  )}

                  {voteChoice !== null && (
                    <div className="text-center text-gray-600">
                      You voted {voteChoice ? 'Support' : 'Oppose'} on {formatDate(votingResults.votingHistory.find(vote => vote.voter.id === currentUser?.id)?.created_at || '')}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-500">No voting data available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalDetail; 