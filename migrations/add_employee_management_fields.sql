-- Add employee management fields to employees table

-- Add is_deleted column with default false
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Add employment_status column with default 'active'
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50) DEFAULT 'active';

-- Update existing records
UPDATE employees 
SET is_deleted = FALSE, employment_status = 'active' 
WHERE is_deleted IS NULL OR employment_status IS NULL;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_employees_is_deleted ON employees(is_deleted);
CREATE INDEX IF NOT EXISTS idx_employees_employment_status ON employees(employment_status);

-- Add a comment explaining the fields
COMMENT ON COLUMN employees.is_deleted IS 'Flag to indicate if the employee is soft deleted';
COMMENT ON COLUMN employees.employment_status IS 'Current employment status (active, terminated, suspended, etc.)'; 