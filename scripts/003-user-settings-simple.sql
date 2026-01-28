-- Create TwinStatus enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'twin_status') THEN
    CREATE TYPE twin_status AS ENUM ('none', 'pending', 'processing', 'ready', 'failed');
  END IF;
END $$;

-- Create user_settings table without foreign key
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY,
  dark_mode BOOLEAN DEFAULT true,
  notifications JSONB DEFAULT '{"push": true, "email": true, "casting_alerts": true, "messages": true}'::jsonb,
  privacy JSONB DEFAULT '{"profile_visible": true, "show_measurements": true, "allow_messages": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
