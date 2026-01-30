import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

/**
 * GET /api/dev/check-db
 * Dev only: returns user count so you can verify the app's DB has seeded users.
 * If userCount is 0, run `npm run db:seed` from project root (or fix DATABASE_URL).
 */
export async function GET() {
  try {
    const countResult = await sql`SELECT COUNT(*) as count FROM users`
    const userCount = parseInt(countResult[0]?.count ?? '0')
    
    const sofiaResult = await sql`SELECT id FROM users WHERE email = 'sofia@luxlane.demo' LIMIT 1`
    const hasSofia = sofiaResult.length > 0

    return NextResponse.json({
      userCount,
      hasTestUser: hasSofia,
      message:
        userCount === 0
          ? "No users in DB. Run: npm run db:seed (from project root)"
          : !hasSofia
            ? "DB has users but not sofia@luxlane.demo. Re-run: npm run db:seed"
            : "DB looks good. Use sofia@luxlane.demo / password123 to log in.",
    })
  } catch (e) {
    console.error("check-db error:", e)
    return NextResponse.json(
      { error: "DB connection failed", detail: String(e) },
      { status: 500 }
    )
  }
}
