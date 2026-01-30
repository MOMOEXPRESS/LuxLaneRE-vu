-- Luxlane Database Setup Script
-- This script creates all necessary tables for authentication and core features

-- Create ENUM types
DO $$ BEGIN
    CREATE TYPE role AS ENUM ('MODEL', 'AGENCY', 'BRAND', 'CLIENT', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_level AS ENUM ('UNVERIFIED', 'AGENCY_VERIFIED', 'LUXLANE_VERIFIED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE availability_status AS ENUM ('AVAILABLE', 'HOLD', 'BOOKED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE casting_status AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE casting_type AS ENUM ('RUNWAY', 'CAMPAIGN', 'EDITORIAL', 'EVENT', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE submission_status AS ENUM ('APPLIED', 'SUBMITTED', 'SHORTLISTED', 'OFFERED', 'ACCEPTED', 'DECLINED', 'CONFIRMED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('INVITE', 'OFFER', 'SHORTLISTED', 'CONFIRMED', 'SYSTEM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE media_type AS ENUM ('AVATAR', 'PORTFOLIO', 'POLAROID', 'DOCUMENT', 'TWIN_INPUT', 'TWIN_OUTPUT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE twin_status AS ENUM ('NONE', 'PENDING', 'PROCESSING', 'READY', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    "passwordHash" TEXT NOT NULL,
    role role NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    "userId" UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    "displayName" TEXT NOT NULL,
    bio TEXT,
    location TEXT,
    height TEXT,
    hair TEXT,
    eyes TEXT,
    experience TEXT,
    "verificationStatus" verification_level DEFAULT 'UNVERIFIED',
    score INTEGER DEFAULT 0,
    "avatarUrl" TEXT,
    "coverUrl" TEXT,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "tokenHash" TEXT NOT NULL,
    revoked BOOLEAN DEFAULT false,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens("userId");

-- Model profiles table
CREATE TABLE IF NOT EXISTS model_profiles (
    "userId" UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    "heightCm" INTEGER,
    "bustCm" INTEGER,
    "waistCm" INTEGER,
    "hipsCm" INTEGER,
    "shoeSize" TEXT,
    hair TEXT,
    eyes TEXT,
    languages TEXT[],
    availability availability_status DEFAULT 'AVAILABLE',
    "agencyId" TEXT,
    "verificationLevel" verification_level DEFAULT 'UNVERIFIED',
    "luxlaneScore" INTEGER DEFAULT 0,
    details JSONB
);

-- Agency profiles table
CREATE TABLE IF NOT EXISTS agency_profiles (
    "userId" UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    "agencyName" TEXT NOT NULL,
    website TEXT,
    verified BOOLEAN DEFAULT false
);

-- Brand profiles table
CREATE TABLE IF NOT EXISTS brand_profiles (
    "userId" UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    "brandName" TEXT NOT NULL,
    website TEXT,
    verified BOOLEAN DEFAULT false
);

-- Follows table
CREATE TABLE IF NOT EXISTS follows (
    "followerId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "followingId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY ("followerId", "followingId")
);

CREATE INDEX IF NOT EXISTS idx_follows_following ON follows("followingId");

-- Castings table
CREATE TABLE IF NOT EXISTS castings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "createdBy" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type casting_type NOT NULL,
    description TEXT,
    location TEXT,
    "startDate" TIMESTAMP WITH TIME ZONE,
    "endDate" TIMESTAMP WITH TIME ZONE,
    "payMin" INTEGER,
    "payMax" INTEGER,
    deadline TIMESTAMP WITH TIME ZONE,
    status casting_status DEFAULT 'DRAFT',
    "verifiedOnly" BOOLEAN DEFAULT false,
    "requireDigitalTwin" BOOLEAN DEFAULT false,
    "maxSubmissionsPerAgency" INTEGER,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_castings_status ON castings(status);
CREATE INDEX IF NOT EXISTS idx_castings_creator ON castings("createdBy");

-- Saved castings table
CREATE TABLE IF NOT EXISTS saved_castings (
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "castingId" UUID NOT NULL REFERENCES castings(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY ("userId", "castingId")
);

CREATE INDEX IF NOT EXISTS idx_saved_castings_casting ON saved_castings("castingId");

-- Casting requirements table
CREATE TABLE IF NOT EXISTS casting_requirements (
    "castingId" UUID PRIMARY KEY REFERENCES castings(id) ON DELETE CASCADE,
    "minHeightCm" INTEGER,
    "maxHeightCm" INTEGER,
    tags TEXT[],
    notes TEXT
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "castingId" UUID NOT NULL REFERENCES castings(id) ON DELETE CASCADE,
    "modelId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "submittedBy" TEXT NOT NULL,
    status submission_status DEFAULT 'APPLIED',
    note TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE ("castingId", "modelId")
);

CREATE INDEX IF NOT EXISTS idx_submissions_casting_status ON submissions("castingId", status);
CREATE INDEX IF NOT EXISTS idx_submissions_model_status ON submissions("modelId", status);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    "castingId" UUID REFERENCES castings(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation members table
CREATE TABLE IF NOT EXISTS conversation_members (
    "conversationId" UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "joinedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY ("conversationId", "userId")
);

CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON conversation_members("userId");

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "conversationId" UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    "senderId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages("conversationId", "createdAt");

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    payload JSONB NOT NULL,
    read BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications("userId", read, "createdAt");

-- Media assets table
CREATE TABLE IF NOT EXISTS media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ownerId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type media_type NOT NULL,
    url TEXT NOT NULL,
    meta JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_owner ON media_assets("ownerId", type);

-- Digital twins table
CREATE TABLE IF NOT EXISTS digital_twins (
    "userId" UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    status twin_status DEFAULT 'NONE',
    summary JSONB,
    "previewUrl" TEXT,
    "modelUrl" TEXT,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
    "userId" UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    "pushNotifs" BOOLEAN DEFAULT true,
    "emailNotifs" BOOLEAN DEFAULT true,
    "darkMode" BOOLEAN DEFAULT true,
    "privacyMode" TEXT DEFAULT 'public',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "imageUrl" TEXT NOT NULL,
    caption TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_user ON posts("userId");

-- Post likes table
CREATE TABLE IF NOT EXISTS post_likes (
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "postId" UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY ("userId", "postId")
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes("postId");

-- Post saves table
CREATE TABLE IF NOT EXISTS post_saves (
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "postId" UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY ("userId", "postId")
);

CREATE INDEX IF NOT EXISTS idx_post_saves_post ON post_saves("postId");

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "postId" UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments("postId");
