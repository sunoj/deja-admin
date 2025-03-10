-- Add email column to admins table
ALTER TABLE admins ADD COLUMN email TEXT UNIQUE;

-- Add a check constraint to ensure email is valid
ALTER TABLE admins ADD CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add comment to the column
COMMENT ON COLUMN admins.email IS 'Admin email address'; 