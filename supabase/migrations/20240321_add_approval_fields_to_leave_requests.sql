-- Add approval fields to leave_requests table
ALTER TABLE leave_requests
ADD COLUMN approved_by UUID REFERENCES admins(id),
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;

-- Add comment to explain the fields
COMMENT ON COLUMN leave_requests.approved_by IS 'The admin who approved/rejected the leave request';
COMMENT ON COLUMN leave_requests.approved_at IS 'When the leave request was approved/rejected';

-- Create index for better query performance
CREATE INDEX idx_leave_requests_approved_by ON leave_requests(approved_by);
CREATE INDEX idx_leave_requests_approved_at ON leave_requests(approved_at); 