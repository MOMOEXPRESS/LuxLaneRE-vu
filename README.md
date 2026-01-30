# Luxlane MVP build

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/momoexpress-projects/v0-luxlane-mvp-build)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/o6EZfZtXkCh)

## Quick start (every time)

From anywhere, run:

```bash
cd /Users/j.pebalemaurice/Desktop/LuxLaneRE-vu && docker compose up -d
```

Then start the app (from the same directory):

```bash
npm run dev
```

Or use the helper script from the project root: `./start.sh` (starts Docker Postgres, then you can run `npm run dev`).

---

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deploy on Vercel (fix signup / DB)

Signup on Vercel fails if the app has no database. Vercel **cannot** use your local Docker Postgres.

1. **Add a hosted Postgres** (pick one):
   - [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) (one-click in Vercel dashboard)
   - [Neon](https://neon.tech) → create project → copy connection string
   - [Supabase](https://supabase.com) → Project Settings → Database → connection string

2. **In Vercel → your project → Settings → Environment Variables**, add:
   - `DATABASE_URL` = your **hosted** Postgres URL (e.g. `postgresql://user:pass@host/db?sslmode=require`)
   - `JWT_SECRET` = a long random string (e.g. `openssl rand -base64 32`)

3. **Run migrations** on that DB once:
   - Either in Vercel Build: add build command `prisma generate && prisma migrate deploy && next build` (and keep `next build` in there), or
   - Locally: set `DATABASE_URL` to the **production** URL temporarily and run `npx prisma migrate deploy`, then switch back to local.

4. **Redeploy** (new deployment or “Redeploy” on the latest).

After that, signup and login use the hosted DB. Local Docker is only for your machine.

---

## Deployment

Your project is live at:

**[https://vercel.com/momoexpress-projects/v0-luxlane-mvp-build](https://vercel.com/momoexpress-projects/v0-luxlane-mvp-build)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/o6EZfZtXkCh](https://v0.app/chat/o6EZfZtXkCh)**

## Local Setup

1. **Start Postgres** (Docker):
   ```bash
   docker compose up -d
   ```

2. **Environment**: Copy env example and set secrets:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local`: set `DATABASE_URL` (default works with Docker above) and `JWT_SECRET`.

3. **Run the app** (from project root):
   ```bash
   npm run dev
   ```
   **First run:** If the DB has no users, the app will auto-apply migrations and run the seed on startup. Then log in with **sofia@luxlane.demo** / **password123**.

4. **Manual DB reset/seed** (optional):
   - Full reset: `npm run db:reset` (drops DB, reapplies migrations, runs seed).
   - Seed only: `npm run db:seed` (applies pending migrations, then seed). Ensure **Docker (Postgres)** is running.

Commands summary: `docker compose up -d` → create `.env` with `DATABASE_URL` → `npm run dev` (from project root). Login: **sofia@luxlane.demo** / **password123**.

**Tips:**
- Run all commands from the **project root** (`LuxLaneRE-vu`). Use **`npm run dev`** (not `nmp run dev`) to start the app.

**Login troubleshooting (Invalid email or password):**
1. **Check the response header** (DevTools → Network → click the `login` request → Headers → Response Headers). In development you’ll see **`X-Login-Fail-Reason`**:
   - **`no-user`** → No account with that email in the DB. The app is likely using a different DB than the one you seeded. Ensure `.env` or `.env.local` has `DATABASE_URL` (e.g. `postgresql://luxlane:luxlane@localhost:5433/luxlane`), run `npm run db:seed` from project root, then try again with **sofia@luxlane.demo**.
   - **`password-mismatch`** → User exists but password is wrong. Use exactly **password123** (no spaces, lowercase). See `lib/test-credentials.ts` for all test accounts.
2. If the **error message** says "DATABASE_URL not set", add `DATABASE_URL` to `.env` or `.env.local` in the project root and restart `npm run dev`.
3. Ensure **Docker (Postgres)** is running and you’ve run the seed from the **project root** so the app and seed use the same DB.

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository