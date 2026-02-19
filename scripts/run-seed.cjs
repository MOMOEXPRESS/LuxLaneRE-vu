"use strict"

const path = require("path")
const { execSync } = require("child_process")
const dotenv = require("dotenv")

// Load .env and .env.local so DATABASE_URL is set before the seed runs
dotenv.config({ path: path.join(process.cwd(), ".env") })
dotenv.config({ path: path.join(process.cwd(), ".env.local") })

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Create a .env or .env.local file with DATABASE_URL=...")
  process.exit(1)
}

// Run seed with env set (no shell quoting - cross-platform)
execSync("npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts", {
  stdio: "inherit",
  env: process.env,
  cwd: process.cwd(),
  shell: true,
})
