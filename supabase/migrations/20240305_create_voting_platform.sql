-- Create enum for proposal status
CREATE TYPE proposal_status AS ENUM ('draft', 'active', 'completed', 'rejected');

-- Create proposals table
CREATE TABLE proposals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status proposal_status NOT NULL DEFAULT 'draft',
    created_by UUID NOT NULL REFERENCES auth.users(id),
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
    created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Create proposal comments table
CREATE TABLE proposal_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    parent_id UUID REFERENCES proposal_comments(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create proposal votes table
CREATE TABLE proposal_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES auth.users(id),
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
CREATE INDEX idx_proposal_versions_proposal_id ON proposal_versions(proposal_id);
CREATE INDEX idx_proposal_versions_version_number ON proposal_versions(version_number DESC);
CREATE INDEX idx_proposal_comments_proposal_id ON proposal_comments(proposal_id);
CREATE INDEX idx_proposal_comments_created_at ON proposal_comments(created_at DESC);
CREATE INDEX idx_proposal_comments_parent_id ON proposal_comments(parent_id);
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
CREATE POLICY "Proposals are viewable by authenticated users"
    ON proposals FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Proposals can be created by authenticated users"
    ON proposals FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Proposals can be updated by their creators"
    ON proposals FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Proposal versions policies
CREATE POLICY "Versions are viewable by authenticated users"
    ON proposal_versions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Versions can be created by proposal creators"
    ON proposal_versions FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() IN (
            SELECT created_by FROM proposals WHERE id = proposal_id
        )
    );

-- Comments policies
CREATE POLICY "Comments are viewable by authenticated users"
    ON proposal_comments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Comments can be created by authenticated users"
    ON proposal_comments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Comments can be updated by their authors"
    ON proposal_comments FOR UPDATE
    TO authenticated
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

-- Votes policies
CREATE POLICY "Votes are viewable by authenticated users"
    ON proposal_votes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can vote on active proposals"
    ON proposal_votes FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = voter_id AND
        EXISTS (
            SELECT 1 FROM proposals
            WHERE id = proposal_id
            AND status = 'active'
            AND NOW() BETWEEN voting_start_date AND voting_end_date
        )
    );

CREATE POLICY "Users can update their own votes on active proposals"
    ON proposal_votes FOR UPDATE
    TO authenticated
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