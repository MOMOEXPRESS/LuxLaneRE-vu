/**
 * Runs once when the Next.js server starts.
 * In development, if the DB has 0 users we auto-run the seed so login works.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "development") {
    return
  }
  // Ensure .env is loaded (Next.js may not have loaded it yet when instrumentation runs)
  try {
    const pathMod = await import("path")
    const root = process.cwd()
    const dotenv = await import("dotenv")
    dotenv.config({ path: pathMod.join(root, ".env") })
    dotenv.config({ path: pathMod.join(root, ".env.local") })
  } catch {
    // dotenv optional
  }
  if (!process.env.DATABASE_URL) {
    return
  }
  try {
    const { PrismaClient } = await import("@prisma/client")
    const prisma = new PrismaClient()
    const count = await prisma.user.count()
    await prisma.$disconnect()
    if (count === 0) {
      console.log("[Luxlane] DB has no users. Applying migrations and running seed...")
      const { execSync } = await import("child_process")
      const root = process.cwd()
      try {
        execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env, cwd: root })
      } catch (e) {
        console.warn("[Luxlane] Migrate deploy failed (run manually: npm run db:seed):", e)
        return
      }
      execSync("node scripts/run-seed.cjs", {
        stdio: "inherit",
        env: process.env,
        cwd: root,
      })
      console.log("[Luxlane] Seed complete. Use sofia@luxlane.demo / password123 to log in.")
    }
  } catch (e) {
    console.warn("[Luxlane] Auto-seed check failed:", e)
  }
}
