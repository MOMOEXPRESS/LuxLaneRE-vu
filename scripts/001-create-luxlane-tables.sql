-- Luxlane Database Schema Migration
-- Run this script to create all tables

-- Create enums
CREATE TYPE role AS ENUM ('MODEL', 'AGENCY', 'BRAND', 'CLIENT', 'ADMIN');
CREATE TYPE verification_level AS ENUM ('UNVERIFIED', 'AGENCY_VERIFIED', 'LUXLANE_VERIFIED');
CREATE TYPE availability_status AS ENUM ('AVAILABLE', 'HOLD', 'BOOKED');
CREATE TYPE casting_status AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');
CREATE TYPE casting_type AS ENUM ('RUNWAY', 'CAMPAIGN', 'EDITORIAL', 'EVENT', 'OTHER');
CREATE TYPE submission_status AS ENUM ('APPLIED', 'SUBMITTED', 'SHORTLISTED', 'OFFERED', 'ACCEPTED', 'DECLINED', 'CONFIRMED', 'REJECTED');
CREATE TYPE notification_type AS ENUM ('INVITE', 'OFFER', 'SHORTLISTED', 'CONFIRMED', 'SYSTEM');
CREATE TYPE media_type AS ENUM ('AVATAR', 'PORTFOLIO', 'POLAROID', 'DOCUMENT', 'TWIN_INPUT', 'TWIN_OUTPUT');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role role NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  location_city TEXT,
  avatar_url TEXT,
  onboarding_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  revoked BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- Model profiles table
CREATE TABLE model_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  height_cm INT,
  bust_cm INT,
  waist_cm INT,
  hips_cm INT,
  shoe_size TEXT,
  hair TEXT,
  eyes TEXT,
  languages TEXT[],
  availability availability_status DEFAULT 'AVAILABLE',
  agency_id UUID REFERENCES users(id),
  verification_level verification_level DEFAULT 'UNVERIFIED',
  luxlane_score INT DEFAULT 0
);

-- Agency profiles table
CREATE TABLE agency_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  agency_name TEXT NOT NULL,
  website TEXT,
  verified BOOLEAN DEFAULT false
);

-- Brand profiles table
CREATE TABLE brand_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  website TEXT,
  verified BOOLEAN DEFAULT false
);

-- Follows table
CREATE TABLE follows (
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

CREATE INDEX idx_follows_following_id ON follows(following_id);

-- Castings table
CREATE TABLE castings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type casting_type NOT NULL,
  description TEXT,
  location TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  pay_min INT,
  pay_max INT,
  deadline TIMESTAMP WITH TIME ZONE,
  status casting_status DEFAULT 'DRAFT',
  verified_only BOOLEAN DEFAULT false,
  require_digital_twin BOOLEAN DEFAULT false,
  max_submissions_per_agency INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_castings_status ON castings(status);
CREATE INDEX idx_castings_created_by ON castings(created_by);
CREATE INDEX idx_castings_deadline ON castings(deadline);

-- Casting requirements table
CREATE TABLE casting_requirements (
  casting_id UUID PRIMARY KEY REFERENCES castings(id) ON DELETE CASCADE,
  min_height_cm INT,
  max_height_cm INT,
  tags TEXT[],
  notes TEXT
);

-- Submissions table
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  casting_id UUID NOT NULL REFERENCES castings(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status submission_status DEFAULT 'APPLIED',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (casting_id, model_id)
);

CREATE INDEX idx_submissions_casting_status ON submissions(casting_id, status);
CREATE INDEX idx_submissions_model_status ON submissions(model_id, status);

-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'direct' | 'casting_room'
  casting_id UUID REFERENCES castings(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Conversation members table
CREATE TABLE conversation_members (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX idx_conversation_members_user_id ON conversation_members(user_id);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  payload JSONB NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_notifications_user_read_created ON notifications(user_id, read, created_at);

-- Media assets table
CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type media_type NOT NULL,
  url TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_media_assets_owner_type ON media_assets(owner_id, type);

-- Digital twins table
CREATE TABLE digital_twins (
  user_id UUID PRIMARY KEY REFERENCES model_profiles(user_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'none', -- 'none' | 'pending' | 'processing' | 'ready' | 'failed'
  summary JSONB,
  preview_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_castings_updated_at BEFORE UPDATE ON castings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_digital_twins_updated_at BEFORE UPDATE ON digital_twins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
