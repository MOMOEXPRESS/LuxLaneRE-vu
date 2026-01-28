-- Drop the old enum if it exists (from previous failed attempts)
DROP TYPE IF EXISTS twin_status CASCADE;

-- Create TwinStatus enum with ALL values including NONE
CREATE TYPE twin_status AS ENUM ('NONE', 'PENDING', 'PROCESSING', 'READY', 'FAILED');

-- Convert digital_twins.status from text to enum
ALTER TABLE digital_twins 
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE twin_status USING status::twin_status,
  ALTER COLUMN status SET DEFAULT 'NONE'::twin_status;
