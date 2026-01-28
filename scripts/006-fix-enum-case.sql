-- Drop the incorrectly created enum if it exists
DROP TYPE IF EXISTS twin_status CASCADE;
DROP TYPE IF EXISTS media_type CASCADE;

-- Create TwinStatus enum with UPPERCASE values to match existing data
CREATE TYPE twin_status AS ENUM ('NONE', 'PENDING', 'PROCESSING', 'READY', 'FAILED');

-- Create MediaType enum with UPPERCASE values
CREATE TYPE media_type AS ENUM ('AVATAR', 'PORTFOLIO', 'POLAROID', 'DOCUMENT', 'TWIN_INPUT', 'TWIN_OUTPUT');

-- Update digital_twins status column to use the enum
-- First drop the default, convert the column, then re-add the default
ALTER TABLE digital_twins 
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE digital_twins 
  ALTER COLUMN status TYPE twin_status 
  USING status::twin_status;

ALTER TABLE digital_twins 
  ALTER COLUMN status SET DEFAULT 'NONE'::twin_status;

-- Update media_assets type column to use the enum  
ALTER TABLE media_assets 
  ALTER COLUMN type DROP DEFAULT;

ALTER TABLE media_assets 
  ALTER COLUMN type TYPE media_type 
  USING type::media_type;

-- Create user_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY,
  dark_mode BOOLEAN NOT NULL DEFAULT true,
  notifications JSONB NOT NULL DEFAULT '{"push": true, "email": true, "sms": false, "casting_updates": true, "messages": true, "marketing": false}'::jsonb,
  privacy JSONB NOT NULL DEFAULT '{"profile_visible": true, "show_online_status": true, "allow_messages_from": "everyone"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_settings
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS set_user_settings_updated_at ON user_settings;
CREATE TRIGGER set_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
