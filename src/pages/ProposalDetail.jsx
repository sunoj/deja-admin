import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { votingPlatformService } from '../services/votingPlatform';

const ProposalDetail = () => {
  const { id } = useParams();
  const [proposal, setProposal] = useState(null);
  const [versions, setVersions] = useState([]);
  const [comments, setComments] = useState([]);
  const [votingResults, setVotingResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('proposal');
  const [newComment, setNewComment] = useState('');
  const [voteChoice, setVoteChoice] = useState(null);

  useEffect(() => {
    fetchProposalData();
  }, [id]);

  const fetchProposalData = async () => {
    try {
      setLoading(true);
      const [proposalData, versionsData, commentsData, votingData] = await Promise.all([
        votingPlatformService.getProposalById(id),
        votingPlatformService.getProposalVersions(id),
        votingPlatformService.getComments(id),
        votingPlatformService.getVotingResults(id)
      ]);
      
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

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await votingPlatformService.addComment(id, { content: newComment });
      setNewComment('');
      fetchProposalData(); // Refresh comments
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const handleVote = async (support) => {
    try {
      await votingPlatformService.castVote(id, { support });
      setVoteChoice(support);
      fetchProposalData(); // Refresh voting results
    } catch (error) {
      console.error('Error casting vote:', error);
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
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-4">{proposal.title}</h1>
          
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
            <button
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'comments'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab('comments')}
            >
              Comments
            </button>
          </div>

          {activeTab === 'proposal' && (
            <div>
              <div className="prose max-w-none mb-8">
                {proposal.content}
              </div>
              
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Voting</h2>
                {new Date() >= new Date(proposal.votingStartDate) &&
                 new Date() <= new Date(proposal.votingEndDate) ? (
                  <div className="flex space-x-4 mb-6">
                    <button
                      className={`px-6 py-3 rounded-lg ${
                        voteChoice === true
                          ? 'bg-green-500 text-white'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                      onClick={() => handleVote(true)}
                    >
                      Support
                    </button>
                    <button
                      className={`px-6 py-3 rounded-lg ${
                        voteChoice === false
                          ? 'bg-red-500 text-white'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                      onClick={() => handleVote(false)}
                    >
                      Oppose
                    </button>
                  </div>
                ) : (
                  <div className="text-gray-500">
                    {new Date() < new Date(proposal.votingStartDate)
                      ? 'Voting has not started yet'
                      : 'Voting has ended'}
                  </div>
                )}
                
                {votingResults && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-lg font-semibold text-green-700">
                        Support: {votingResults.supportVotes}
                      </div>
                      <div className="text-sm text-green-600">
                        Voting Power: {votingResults.supportVotingPower}
                      </div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-lg font-semibold text-red-700">
                        Oppose: {votingResults.oppositionVotes}
                      </div>
                      <div className="text-sm text-red-600">
                        Voting Power: {votingResults.oppositionVotingPower}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'versions' && (
            <div className="space-y-4">
              {versions.map((version) => (
                <div key={version.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm text-gray-500">
                      Version {version.versionNumber}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(version.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 mb-2">
                    {version.changeLog}
                  </div>
                  <div className="prose max-w-none text-gray-800">
                    {version.content}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'comments' && (
            <div>
              <form onSubmit={handleSubmitComment} className="mb-6">
                <textarea
                  className="w-full p-3 border rounded-lg"
                  rows="3"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button
                  type="submit"
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Submit Comment
                </button>
              </form>

              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{comment.authorId}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-gray-700">{comment.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalDetail; 