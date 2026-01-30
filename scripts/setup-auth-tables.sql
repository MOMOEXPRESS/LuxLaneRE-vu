-- Luxlane Auth Tables Setup Script
-- This script creates the core tables needed for authentication

-- Create role ENUM type
DO $$ BEGIN
    CREATE TYPE role AS ENUM ('MODEL', 'AGENCY', 'BRAND', 'CLIENT', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create verification_level ENUM type
DO $$ BEGIN
    CREATE TYPE verification_level AS ENUM ('UNVERIFIED', 'AGENCY_VERIFIED', 'LUXLANE_VERIFIED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role role NOT NULL,
    display_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    bio TEXT,
    location TEXT,
    height TEXT,
    hair TEXT,
    eyes TEXT,
    experience TEXT,
    verification_status verification_level DEFAULT 'UNVERIFIED',
    score INTEGER DEFAULT 0,
    avatar_url TEXT,
    cover_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    revoked BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    push_notifs BOOLEAN DEFAULT true,
    email_notifs BOOLEAN DEFAULT true,
    dark_mode BOOLEAN DEFAULT true,
    privacy_mode TEXT DEFAULT 'public',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert a demo user (password: password123)
INSERT INTO users (id, email, username, password_hash, role, display_name, created_at)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'sofia@luxlane.demo',
    'sofia_demo',
    '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu.1u',
    'MODEL',
    'Sofia Martinez',
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Insert demo user profile
INSERT INTO profiles (user_id, display_name, bio, location, verification_status, score)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Sofia Martinez',
    'Professional runway and editorial model based in Paris.',
    'Paris, France',
    'LUXLANE_VERIFIED',
    85
)
ON CONFLICT (user_id) DO NOTHING;

-- Insert demo user settings
INSERT INTO user_settings (user_id)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890')
ON CONFLICT (user_id) DO NOTHING;
