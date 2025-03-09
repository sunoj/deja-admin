-- Drop existing tables and types if they exist
DROP TABLE IF EXISTS proposal_votes;
DROP TABLE IF EXISTS proposal_comments;
DROP TABLE IF EXISTS proposal_versions;
DROP TABLE IF EXISTS proposals;
DROP TYPE IF EXISTS proposal_status CASCADE;

-- Create enum for proposal status
CREATE TYPE proposal_status AS ENUM ('draft', 'active', 'completed', 'rejected');

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT NOT NULL UNIQUE,
  voting_power INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  created_by UUID NOT NULL REFERENCES admins(id),
  voting_start_date TIMESTAMPTZ NOT NULL,
  voting_end_date TIMESTAMPTZ NOT NULL,
  current_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create proposal_versions table
CREATE TABLE IF NOT EXISTS proposal_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content JSONB NOT NULL,
  change_log TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES admins(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create proposal_comments table
CREATE TABLE IF NOT EXISTS proposal_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES admins(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create proposal_votes table
CREATE TABLE IF NOT EXISTS proposal_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES admins(id),
  support BOOLEAN NOT NULL,
  voting_power INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(proposal_id, voter_id)
);

-- Create indexes
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_created_at ON proposals(created_at DESC);
CREATE INDEX idx_proposals_created_by ON proposals(created_by);

CREATE INDEX idx_proposal_versions_proposal_id ON proposal_versions(proposal_id);
CREATE INDEX idx_proposal_versions_version_number ON proposal_versions(version_number DESC);
CREATE INDEX idx_proposal_versions_created_by ON proposal_versions(created_by);

CREATE INDEX idx_proposal_comments_proposal_id ON proposal_comments(proposal_id);
CREATE INDEX idx_proposal_comments_created_at ON proposal_comments(created_at DESC);
CREATE INDEX idx_proposal_comments_author_id ON proposal_comments(author_id);

CREATE INDEX idx_proposal_votes_proposal_id ON proposal_votes(proposal_id);
CREATE INDEX idx_proposal_votes_voter_id ON proposal_votes(voter_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_proposals_updated_at
    BEFORE UPDATE ON proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposal_comments_updated_at
    BEFORE UPDATE ON proposal_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposal_votes_updated_at
    BEFORE UPDATE ON proposal_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
DROP POLICY IF EXISTS "Admins can update their own voting power" ON admins;
DROP POLICY IF EXISTS "Anyone can view active proposals" ON proposals;
DROP POLICY IF EXISTS "Admins can view all proposals" ON proposals;
DROP POLICY IF EXISTS "Admins can create proposals" ON proposals;
DROP POLICY IF EXISTS "Admins can update their own proposals" ON proposals;
DROP POLICY IF EXISTS "Anyone can view proposal versions" ON proposal_versions;
DROP POLICY IF EXISTS "Admins can create proposal versions" ON proposal_versions;
DROP POLICY IF EXISTS "Anyone can view comments" ON proposal_comments;
DROP POLICY IF EXISTS "Admins can create comments" ON proposal_comments;
DROP POLICY IF EXISTS "Anyone can view votes" ON proposal_votes;
DROP POLICY IF EXISTS "Admins can vote" ON proposal_votes;
DROP POLICY IF EXISTS "Admins can update their own votes" ON proposal_votes;

-- Drop existing service role policies
DROP POLICY IF EXISTS "Service role can do all operations on admins" ON admins;
DROP POLICY IF EXISTS "Service role can do all operations on proposals" ON proposals;
DROP POLICY IF EXISTS "Service role can do all operations on proposal_versions" ON proposal_versions;
DROP POLICY IF EXISTS "Service role can do all operations on proposal_comments" ON proposal_comments;
DROP POLICY IF EXISTS "Service role can do all operations on proposal_votes" ON proposal_votes;

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_votes ENABLE ROW LEVEL SECURITY;

-- Create service role policies for all tables
CREATE POLICY "Service role can do all operations on admins"
  ON admins
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do all operations on proposals"
  ON proposals
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do all operations on proposal_versions"
  ON proposal_versions
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do all operations on proposal_comments"
  ON proposal_comments
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do all operations on proposal_votes"
  ON proposal_votes
  USING (true)
  WITH CHECK (true); 