-- Drop existing tables if they exist
DROP TABLE IF EXISTS proposal_votes;
DROP TABLE IF EXISTS proposal_comments;
DROP TABLE IF EXISTS proposal_versions;
DROP TABLE IF EXISTS proposals;
DROP TYPE IF EXISTS proposal_status;

-- Create enum for proposal status
CREATE TYPE proposal_status AS ENUM ('draft', 'active', 'completed', 'rejected');

-- Create proposals table
CREATE TABLE proposals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status proposal_status NOT NULL DEFAULT 'draft',
    created_by UUID NOT NULL REFERENCES admins(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    voting_start_date TIMESTAMPTZ NOT NULL,
    voting_end_date TIMESTAMPTZ NOT NULL,
    current_version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create proposal versions table
CREATE TABLE proposal_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    change_log TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES admins(id)
);

-- Create proposal comments table
CREATE TABLE proposal_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES admins(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    parent_id UUID REFERENCES proposal_comments(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create proposal votes table
CREATE TABLE proposal_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES admins(id),
    support BOOLEAN NOT NULL,
    voting_power INTEGER NOT NULL DEFAULT 1,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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
CREATE INDEX idx_proposal_comments_parent_id ON proposal_comments(parent_id);
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

-- Create RLS policies
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_votes ENABLE ROW LEVEL SECURITY;

-- Proposals policies
CREATE POLICY "Proposals are viewable by all admins"
    ON proposals FOR SELECT
    USING (true);

CREATE POLICY "Proposals can be created by any admin"
    ON proposals FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Proposals can be updated by their creators"
    ON proposals FOR UPDATE
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Proposal versions policies
CREATE POLICY "Versions are viewable by all admins"
    ON proposal_versions FOR SELECT
    USING (true);

CREATE POLICY "Versions can be created by proposal creators"
    ON proposal_versions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM proposals 
            WHERE id = proposal_id 
            AND created_by = auth.uid()
        )
    );

-- Comments policies
CREATE POLICY "Comments are viewable by all admins"
    ON proposal_comments FOR SELECT
    USING (true);

CREATE POLICY "Comments can be created by any admin"
    ON proposal_comments FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Comments can be updated by their authors"
    ON proposal_comments FOR UPDATE
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

-- Votes policies
CREATE POLICY "Votes are viewable by all admins"
    ON proposal_votes FOR SELECT
    USING (true);

CREATE POLICY "Admins can vote on active proposals"
    ON proposal_votes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM proposals
            WHERE id = proposal_id
            AND status = 'active'
            AND NOW() BETWEEN voting_start_date AND voting_end_date
        )
    );

CREATE POLICY "Admins can update their own votes on active proposals"
    ON proposal_votes FOR UPDATE
    USING (
        auth.uid() = voter_id AND
        EXISTS (
            SELECT 1 FROM proposals
            WHERE id = proposal_id
            AND status = 'active'
            AND NOW() BETWEEN voting_start_date AND voting_end_date
        )
    )
    WITH CHECK (
        auth.uid() = voter_id AND
        EXISTS (
            SELECT 1 FROM proposals
            WHERE id = proposal_id
            AND status = 'active'
            AND NOW() BETWEEN voting_start_date AND voting_end_date
        )
    ); 