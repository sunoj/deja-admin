-- Add updated_at column to proposal_votes table
ALTER TABLE proposal_votes
ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Create trigger for updating updated_at
CREATE TRIGGER update_proposal_votes_updated_at
    BEFORE UPDATE ON proposal_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 