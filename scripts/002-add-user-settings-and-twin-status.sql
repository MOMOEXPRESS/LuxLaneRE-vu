-- Add TwinStatus enum type
DO $$ BEGIN
  CREATE TYPE twin_status AS ENUM ('NONE', 'PENDING', 'PROCESSING', 'READY', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  dark_mode BOOLEAN NOT NULL DEFAULT true,
  notifications JSONB NOT NULL DEFAULT '{}',
  privacy JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update digital_twins.status column to use the enum
-- First, add a temporary column
ALTER TABLE digital_twins 
  ADD COLUMN IF NOT EXISTS status_new twin_status DEFAULT 'NONE';

-- Migrate existing data
UPDATE digital_twins SET status_new = 
  CASE status
    WHEN 'none' THEN 'NONE'::twin_status
    WHEN 'pending' THEN 'PENDING'::twin_status
    WHEN 'processing' THEN 'PROCESSING'::twin_status
    WHEN 'ready' THEN 'READY'::twin_status
    WHEN 'failed' THEN 'FAILED'::twin_status
    ELSE 'NONE'::twin_status
  END;

-- Drop old column and rename new one (only if status is varchar)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'digital_twins' AND column_name = 'status' AND data_type = 'character varying'
  ) THEN
    ALTER TABLE digital_twins DROP COLUMN status;
    ALTER TABLE digital_twins RENAME COLUMN status_new TO status;
  ELSE
    ALTER TABLE digital_twins DROP COLUMN IF EXISTS status_new;
  END IF;
END $$;

-- Create index for settings lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
