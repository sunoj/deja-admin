import React, { useState, useEffect, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { votingPlatformService } from '../services/votingPlatform';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { ProposalFormData, ProposalData, ProposalResponse } from '../types/proposal';

const CreateProposal: React.FC = () => {
  const navigate = useNavigate();
  
  // Get current date in local timezone
  const getLocalDateTime = (): string => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T08:00`;
  };

  // Get date 3 days later in local timezone
  const getThreeDaysLaterDateTime = (): string => {
    const now = new Date();
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const year = threeDaysLater.getFullYear();
    const month = String(threeDaysLater.getMonth() + 1).padStart(2, '0');
    const day = String(threeDaysLater.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T08:00`;
  };

  const [formData, setFormData] = useState<ProposalFormData>({
    title: '',
    content: '',
    votingStartDate: getLocalDateTime(),
    votingEndDate: getThreeDaysLaterDateTime()
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      votingStartDate: getLocalDateTime(),
      votingEndDate: getThreeDaysLaterDateTime()
    }));
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContentChange = (value: string | undefined): void => {
    setFormData(prev => ({
      ...prev,
      content: value || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    if (!formData.votingStartDate || !formData.votingEndDate) {
      setError('Voting start and end dates are required');
      return;
    }

    const startDate = new Date(formData.votingStartDate);
    const endDate = new Date(formData.votingEndDate);
    
    if (startDate >= endDate) {
      setError('Voting end date must be after start date');
      return;
    }

    try {
      setLoading(true);
      // Format dates to ISO string to preserve timezone information
      const proposalData: ProposalData = {
        ...formData,
        votingStartDate: startDate.toISOString(),
        votingEndDate: endDate.toISOString(),
        status: 'draft',
        currentVersion: 1
      };
      const response: ProposalResponse = await votingPlatformService.createProposal(proposalData);
      navigate(`/proposals/${response.id}`);
    } catch (error) {
      console.error('Error creating proposal:', error);
      setError('Failed to create proposal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create New Proposal</h1>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter proposal title"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <div data-color-mode="light" className="mt-1">
              <MDEditor
                value={formData.content}
                onChange={handleContentChange}
                preview="live"
                height={400}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="votingStartDate" className="block text-sm font-medium text-gray-700 mb-1">
                Voting Start Date
              </label>
              <input
                type="datetime-local"
                id="votingStartDate"
                name="votingStartDate"
                value={formData.votingStartDate}
                onChange={handleChange}
                min={getLocalDateTime()}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="votingEndDate" className="block text-sm font-medium text-gray-700 mb-1">
                Voting End Date
              </label>
              <input
                type="datetime-local"
                id="votingEndDate"
                name="votingEndDate"
                value={formData.votingEndDate}
                onChange={handleChange}
                min={formData.votingStartDate}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/proposals')}
              className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Creating...' : 'Create Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProposal; 