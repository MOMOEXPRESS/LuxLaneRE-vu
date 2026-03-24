-- Phase 2 Schema Upgrades

-- 1. ModelAgency junction table (multi-agency support with contract status)
CREATE TABLE IF NOT EXISTS "model_agencies" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "model_id" TEXT NOT NULL,
  "agency_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "contract_status" TEXT NOT NULL DEFAULT 'NONE',
  "joined_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "model_agencies_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "model_agencies_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "model_agencies_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "model_agencies_model_id_agency_id_key" ON "model_agencies"("model_id", "agency_id");
CREATE INDEX IF NOT EXISTS "model_agencies_agency_id_status_idx" ON "model_agencies"("agency_id", "status");

-- 2. isDemo + authProvider on User
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_demo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "auth_provider" TEXT NOT NULL DEFAULT 'credentials';

-- 3. parentCommentId on Comment (threaded replies)
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "parent_id" TEXT;
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE SET NULL;

-- 4. Post: mediaUrls JSON array + mediaType (keep imageUrl for backward compat)
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "media_urls" JSONB DEFAULT '[]';
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "media_type" TEXT DEFAULT 'image';
