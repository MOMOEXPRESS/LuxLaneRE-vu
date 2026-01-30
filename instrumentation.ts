/**
 * Runs once when the Next.js server starts.
 * Auto-seeding is disabled in the v0 environment.
 * To seed the database locally, run: npm run db:seed
 */
export async function register() {
  // Auto-seeding disabled - Prisma client requires generation which isn't available in v0
  // For local development, run: npm run db:seed
  console.log("[Luxlane] Server started. Run 'npm run db:seed' to seed the database if needed.")
}
