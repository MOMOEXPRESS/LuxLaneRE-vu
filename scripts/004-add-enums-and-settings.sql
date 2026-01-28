-- Add MediaType enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_type') THEN
    CREATE TYPE media_type AS ENUM (
      'AVATAR',
      'PORTFOLIO', 
      'POLAROID',
      'DOCUMENT',
      'TWIN_INPUT',
      'TWIN_OUTPUT'
    );
  END IF;
END
$$;

-- Add TwinStatus enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'twin_status') THEN
    CREATE TYPE twin_status AS ENUM (
      'NONE',
      'PENDING',
      'PROCESSING',
      'READY',
      'FAILED'
    );
  END IF;
END
$$;

-- Update digital_twins.status to use enum if it's still text
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'digital_twins' 
    AND column_name = 'status' 
    AND data_type = 'text'
  ) THEN
    ALTER TABLE digital_twins 
    ALTER COLUMN status TYPE twin_status 
    USING status::twin_status;
  END IF;
END
$$;

-- Create user_settings table if not exists
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY,
  dark_mode BOOLEAN NOT NULL DEFAULT true,
  notifications JSONB NOT NULL DEFAULT '{"email": true, "push": true, "castingInvites": true, "messages": true, "offers": true}',
  privacy JSONB NOT NULL DEFAULT '{"profileVisibility": "public", "showMeasurements": true, "showLocation": true}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create updated_at trigger for user_settings
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_settings_updated_at ON user_settings;
CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();
