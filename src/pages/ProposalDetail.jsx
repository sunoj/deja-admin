import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { votingPlatformService } from '../services/votingPlatform';
import { authService } from '../services/auth';
import ReactMarkdown from 'react-markdown';

const ProposalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState(null);
  const [versions, setVersions] = useState([]);
  const [comments, setComments] = useState([]);
  const [votingResults, setVotingResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('proposal');
  const [newComment, setNewComment] = useState('');
  const [voteChoice, setVoteChoice] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editChangeLog, setEditChangeLog] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchProposalData();
    fetchCurrentUser();
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
      
      console.log('Proposal data:', proposalData);
      console.log('Versions data:', versionsData);
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

  const fetchCurrentUser = async () => {
    try {
      const response = await authService.check();
      if (response.success) {
        setCurrentUser(response.admin);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
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

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim() || !editChangeLog.trim()) return;

    try {
      await votingPlatformService.updateProposal(id, {
        title: editTitle,
        content: editContent,
        changeLog: editChangeLog
      });
      setShowEditModal(false);
      fetchProposalData(); // Refresh proposal and versions
    } catch (error) {
      console.error('Error updating proposal:', error);
    }
  };

  const openEditModal = () => {
    setEditTitle(proposal.title);
    setEditContent(proposal.content);
    setEditChangeLog('');
    setShowEditModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <h1 className="text-3xl font-bold">{proposal.title}</h1>
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
            <div>
              <div className="prose prose-lg max-w-none mb-8 prose-headings:font-semibold prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-gray-100 prose-pre:p-4 prose-pre:rounded-lg">
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      return (
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>
                          {children}
                        </code>
                      );
                    },
                    blockquote({ children }) {
                      return (
                        <blockquote className="border-l-4 border-gray-200 pl-4 italic text-gray-600">
                          {children}
                        </blockquote>
                      );
                    },
                    ul({ children }) {
                      return (
                        <ul className="list-disc pl-5 space-y-1 text-gray-700">
                          {children}
                        </ul>
                      );
                    },
                    ol({ children }) {
                      return (
                        <ol className="list-decimal pl-5 space-y-1 text-gray-700">
                          {children}
                        </ol>
                      );
                    },
                    img({ src, alt }) {
                      return (
                        <img
                          src={src}
                          alt={alt}
                          className="rounded-lg shadow-md max-w-full h-auto"
                        />
                      );
                    },
                    h1({ children }) {
                      return <h1 className="text-3xl font-semibold text-gray-900 mb-4">{children}</h1>;
                    },
                    h2({ children }) {
                      return <h2 className="text-2xl font-semibold text-gray-900 mb-3">{children}</h2>;
                    },
                    h3({ children }) {
                      return <h3 className="text-xl font-semibold text-gray-900 mb-2">{children}</h3>;
                    },
                    p({ children }) {
                      return <p className="text-gray-700 mb-4">{children}</p>;
                    },
                    a({ children, href }) {
                      return (
                        <a href={href} className="text-blue-600 hover:text-blue-800 underline">
                          {children}
                        </a>
                      );
                    },
                    strong({ children }) {
                      return <strong className="font-semibold text-gray-900">{children}</strong>;
                    },
                    em({ children }) {
                      return <em className="italic text-gray-700">{children}</em>;
                    },
                  }}
                >
                  {proposal.content}
                </ReactMarkdown>
              </div>
              
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Voting</h2>
                {proposal.status === 'active' && (
                  <>
                    {console.log('Proposal dates:', {
                      start: proposal.voting_start_date,
                      end: proposal.voting_end_date,
                      now: new Date(),
                      isActive: proposal.status === 'active',
                      isInVotingPeriod: new Date(proposal.voting_start_date).getTime() <= new Date().getTime() && 
                                     new Date(proposal.voting_end_date).getTime() >= new Date().getTime()
                    })}
                    {new Date(proposal.voting_start_date).getTime() > new Date().getTime() ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center text-yellow-800 mb-2">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">Voting has not started yet</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-white p-3 rounded-md">
                            <div className="text-yellow-600 font-medium mb-1">Start Time</div>
                            <div className="text-gray-700">{formatDate(proposal.voting_start_date)}</div>
                          </div>
                          <div className="bg-white p-3 rounded-md">
                            <div className="text-yellow-600 font-medium mb-1">End Time</div>
                            <div className="text-gray-700">{formatDate(proposal.voting_end_date)}</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center text-red-800 mb-2">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">Voting has ended</span>
                        </div>
                        <div className="bg-white p-3 rounded-md text-sm">
                          <div className="text-red-600 font-medium mb-1">End Time</div>
                          <div className="text-gray-700">{formatDate(proposal.voting_end_date)}</div>
                        </div>
                      </div>
                    )}
                  </>
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

              <div className="border-t pt-6 mt-8">
                <h2 className="text-xl font-semibold mb-4">Comments</h2>
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
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                            <span className="text-gray-600 text-sm">
                              {(comment.author?.username || 'A').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{comment.author?.username || 'Anonymous'}</div>
                            <div className="text-sm text-gray-500">
                              {formatDate(comment.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-gray-700 pl-11">
                        <ReactMarkdown>{comment.content}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'versions' && (
            <div className="space-y-4">
              {versions.map((version) => (
                <div key={version.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                        Version {version.version_number}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(version.created_at)}
                      </span>
                    </div>
                  </div>
                  {version.change_log && (
                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-1">Change Log:</div>
                      <div className="text-sm text-gray-600 whitespace-pre-wrap">{version.change_log}</div>
                    </div>
                  )}
                  <div className="prose prose-lg max-w-none prose-headings:font-semibold prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-gray-100 prose-pre:p-4 prose-pre:rounded-lg">
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          return (
                            <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>
                              {children}
                            </code>
                          );
                        },
                        blockquote({ children }) {
                          return (
                            <blockquote className="border-l-4 border-gray-200 pl-4 italic text-gray-600">
                              {children}
                            </blockquote>
                          );
                        },
                        ul({ children }) {
                          return (
                            <ul className="list-disc pl-5 space-y-1 text-gray-700">
                              {children}
                            </ul>
                          );
                        },
                        ol({ children }) {
                          return (
                            <ol className="list-decimal pl-5 space-y-1 text-gray-700">
                              {children}
                            </ol>
                          );
                        },
                        img({ src, alt }) {
                          return (
                            <img
                              src={src}
                              alt={alt}
                              className="rounded-lg shadow-md max-w-full h-auto"
                            />
                          );
                        },
                        h1({ children }) {
                          return <h1 className="text-3xl font-semibold text-gray-900 mb-4">{children}</h1>;
                        },
                        h2({ children }) {
                          return <h2 className="text-2xl font-semibold text-gray-900 mb-3">{children}</h2>;
                        },
                        h3({ children }) {
                          return <h3 className="text-xl font-semibold text-gray-900 mb-2">{children}</h3>;
                        },
                        p({ children }) {
                          return <p className="text-gray-700 mb-4">{children}</p>;
                        },
                        a({ children, href }) {
                          return (
                            <a href={href} className="text-blue-600 hover:text-blue-800 underline">
                              {children}
                            </a>
                          );
                        },
                        strong({ children }) {
                          return <strong className="font-semibold text-gray-900">{children}</strong>;
                        },
                        em({ children }) {
                          return <em className="italic text-gray-700">{children}</em>;
                        },
                      }}
                    >
                      {version.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalDetail; 