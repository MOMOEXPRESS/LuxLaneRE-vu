-- Phase 3: Analytics, Earnings, Stories/Highlights

-- Profile views (analytics)
CREATE TABLE "profile_views" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "viewerId" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_views_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "profile_views_profileId_createdAt_idx" ON "profile_views"("profileId", "createdAt");
CREATE INDEX "profile_views_viewerId_idx" ON "profile_views"("viewerId");

ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Casting views (analytics)
CREATE TABLE "casting_views" (
    "id" TEXT NOT NULL,
    "castingId" TEXT NOT NULL,
    "viewerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "casting_views_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "casting_views_castingId_createdAt_idx" ON "casting_views"("castingId", "createdAt");
CREATE INDEX "casting_views_viewerId_idx" ON "casting_views"("viewerId");

ALTER TABLE "casting_views" ADD CONSTRAINT "casting_views_castingId_fkey" FOREIGN KEY ("castingId") REFERENCES "castings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "casting_views" ADD CONSTRAINT "casting_views_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Earnings
CREATE TABLE "earnings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "castingId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "earnings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "earnings_userId_status_idx" ON "earnings"("userId", "status");
CREATE INDEX "earnings_castingId_idx" ON "earnings"("castingId");

ALTER TABLE "earnings" ADD CONSTRAINT "earnings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "earnings" ADD CONSTRAINT "earnings_castingId_fkey" FOREIGN KEY ("castingId") REFERENCES "castings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Stories
CREATE TABLE "stories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL DEFAULT 'image',
    "caption" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "highlightId" TEXT,

    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "stories_userId_createdAt_idx" ON "stories"("userId", "createdAt");
CREATE INDEX "stories_expiresAt_idx" ON "stories"("expiresAt");

ALTER TABLE "stories" ADD CONSTRAINT "stories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Story views
CREATE TABLE "story_views" (
    "storyId" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_views_pkey" PRIMARY KEY ("storyId","viewerId")
);

ALTER TABLE "story_views" ADD CONSTRAINT "story_views_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "story_views" ADD CONSTRAINT "story_views_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Story highlights
CREATE TABLE "story_highlights" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "coverUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_highlights_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "story_highlights_userId_sortOrder_idx" ON "story_highlights"("userId", "sortOrder");

ALTER TABLE "story_highlights" ADD CONSTRAINT "story_highlights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add highlight FK to stories
ALTER TABLE "stories" ADD CONSTRAINT "stories_highlightId_fkey" FOREIGN KEY ("highlightId") REFERENCES "story_highlights"("id") ON DELETE SET NULL ON UPDATE CASCADE;
