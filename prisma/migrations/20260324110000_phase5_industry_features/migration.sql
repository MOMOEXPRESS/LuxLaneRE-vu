-- Phase 5: Industry Features

-- Work History / Credits
CREATE TABLE IF NOT EXISTS "work_credits" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "model_id" TEXT NOT NULL,
  "brand_name" TEXT NOT NULL,
  "project_title" TEXT NOT NULL,
  "role" TEXT,
  "photographer" TEXT,
  "year" INT,
  "type" TEXT NOT NULL DEFAULT 'campaign',
  "confirmed_by" TEXT,
  "confirmed_at" TIMESTAMP(3),
  "image_url" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "work_credits_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "work_credits_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "work_credits_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "users"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "work_credits_model_id_idx" ON "work_credits"("model_id");

-- Endorsements
CREATE TABLE IF NOT EXISTS "endorsements" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "model_id" TEXT NOT NULL,
  "endorser_id" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "tags" TEXT[] DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "endorsements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "endorsements_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "endorsements_endorser_id_fkey" FOREIGN KEY ("endorser_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "endorsements_model_id_endorser_id_key" ON "endorsements"("model_id", "endorser_id");
CREATE INDEX IF NOT EXISTS "endorsements_model_id_idx" ON "endorsements"("model_id");

-- Job Alerts
CREATE TABLE IF NOT EXISTS "job_alerts" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL,
  "criteria" JSONB NOT NULL DEFAULT '{}',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "last_notified" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "job_alerts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "job_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "job_alerts_user_id_idx" ON "job_alerts"("user_id");
