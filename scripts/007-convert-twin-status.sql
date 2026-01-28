-- Only convert digital_twins.status from text to enum
-- All other tables and enums already exist

-- Create the twin_status enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'twin_status') THEN
        CREATE TYPE twin_status AS ENUM ('NONE', 'PENDING', 'PROCESSING', 'READY', 'FAILED');
    END IF;
END $$;

-- Convert digital_twins.status from text to enum
-- First update any existing values to match enum format
UPDATE digital_twins SET status = 'NONE' WHERE status IS NULL OR status = '';
UPDATE digital_twins SET status = UPPER(status) WHERE status IS NOT NULL;

-- Add a new column with the enum type
ALTER TABLE digital_twins ADD COLUMN IF NOT EXISTS status_new twin_status DEFAULT 'NONE';

-- Copy data from old column to new (with casting)
UPDATE digital_twins SET status_new = status::twin_status WHERE status IS NOT NULL AND status != '';

-- Drop old column and rename new one
ALTER TABLE digital_twins DROP COLUMN IF EXISTS status;
ALTER TABLE digital_twins RENAME COLUMN status_new TO status;
