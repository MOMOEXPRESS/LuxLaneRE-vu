-- Create MediaType enum if not exists
DO $$ BEGIN
  CREATE TYPE media_type AS ENUM ('AVATAR', 'PORTFOLIO', 'POLAROID', 'DOCUMENT', 'TWIN_INPUT', 'TWIN_OUTPUT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create TwinStatus enum if not exists
DO $$ BEGIN
  CREATE TYPE twin_status AS ENUM ('NONE', 'PENDING', 'PROCESSING', 'READY', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Update digital_twins.status column to use the enum
-- First, drop the default, then alter the type with explicit cast, then set new default
ALTER TABLE digital_twins 
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE digital_twins 
  ALTER COLUMN status TYPE twin_status 
  USING (
    CASE status
      WHEN 'pending' THEN 'PENDING'::twin_status
      WHEN 'processing' THEN 'PROCESSING'::twin_status
      WHEN 'ready' THEN 'READY'::twin_status
      WHEN 'failed' THEN 'FAILED'::twin_status
      ELSE 'NONE'::twin_status
    END
  );

ALTER TABLE digital_twins 
  ALTER COLUMN status SET DEFAULT 'NONE'::twin_status;

-- Update media_assets.type column to use the enum
ALTER TABLE media_assets 
  ALTER COLUMN type DROP DEFAULT;

ALTER TABLE media_assets 
  ALTER COLUMN type TYPE media_type 
  USING (
    CASE type
      WHEN 'avatar' THEN 'AVATAR'::media_type
      WHEN 'portfolio' THEN 'PORTFOLIO'::media_type
      WHEN 'polaroid' THEN 'POLAROID'::media_type
      WHEN 'document' THEN 'DOCUMENT'::media_type
      WHEN 'twin_input' THEN 'TWIN_INPUT'::media_type
      WHEN 'twin_output' THEN 'TWIN_OUTPUT'::media_type
      ELSE 'PORTFOLIO'::media_type
    END
  );

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY,
  dark_mode BOOLEAN NOT NULL DEFAULT true,
  notifications JSONB NOT NULL DEFAULT '{"push": true, "email": true, "casting_updates": true, "messages": true, "marketing": false}'::jsonb,
  privacy JSONB NOT NULL DEFAULT '{"profile_visible": true, "show_measurements": true, "show_portfolio": true, "allow_messages": true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create updated_at trigger for user_settings
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
