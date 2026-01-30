-- Map profiles columns to snake_case for compatibility with DBs that use snake_case (e.g. Vercel Postgres)
-- Rename columns if they exist with camelCase (from initial migration)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'userId') THEN
    ALTER TABLE "profiles" RENAME COLUMN "userId" TO "user_id";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'displayName') THEN
    ALTER TABLE "profiles" RENAME COLUMN "displayName" TO "display_name";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'verificationStatus') THEN
    ALTER TABLE "profiles" RENAME COLUMN "verificationStatus" TO "verification_status";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatarUrl') THEN
    ALTER TABLE "profiles" RENAME COLUMN "avatarUrl" TO "avatar_url";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'coverUrl') THEN
    ALTER TABLE "profiles" RENAME COLUMN "coverUrl" TO "cover_url";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updatedAt') THEN
    ALTER TABLE "profiles" RENAME COLUMN "updatedAt" TO "updated_at";
    ALTER TABLE "profiles" ALTER COLUMN "updated_at" DROP NOT NULL;
  END IF;
END $$;
