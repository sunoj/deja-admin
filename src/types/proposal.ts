export interface ProposalFormData {
  title: string;
  content: string;
  changeLog: string;
}

export interface ProposalData {
  id: string;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'active' | 'completed';
  voting_start: string;
  voting_end: string;
  change_log?: string;
  created_by_admin?: {
    id: string;
    username: string;
  };
  voting_end_date: string;
  versions_count?: number;
  comments_count?: number;
  votes_count?: number;
}

export interface ProposalResponse {
  success: boolean;
  error?: string;
  proposal?: ProposalData;
}

export interface ProposalVersion {
  id: string;
  proposal_id: string;
  title: string;
  content: string;
  change_log: string;
  created_at: string;
  created_by: string;
  version_number: number;
}

export interface Comment {
  id: string;
  proposal_id: string;
  content: string;
  created_at: string;
  author: {
    id: string;
    username: string;
  };
  author_id: string;
}

export interface VotingResult {
  proposalId: string;
  totalVotes: number;
  supportVotes: number;
  oppositionVotes: number;
  totalVotingPower: number;
  supportVotingPower: number;
  oppositionVotingPower: number;
  votingHistory: Array<{
    id: string;
    proposal_id: string;
    voter: {
      id: string;
      username: string;
    };
    support: boolean;
    voting_power: number;
    reason: string | null;
    created_at: string;
  }>;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface ProposalDetailProps {
  id: string;
}

export interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProposalFormData) => Promise<void>;
  initialData: {
    title: string;
    content: string;
  };
}

export interface ProposalListProps {
  activeTab: 'active' | 'completed';
} 