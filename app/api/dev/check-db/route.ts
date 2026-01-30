import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/dev/check-db
 * Dev only: returns user count so you can verify the app's DB has seeded users.
 * If userCount is 0, run `npm run db:seed` from project root (or fix DATABASE_URL).
 */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 })
  }
  try {
    const userCount = await prisma.user.count()
    const hasSofia = await prisma.user.findUnique({
      where: { email: "sofia@luxlane.demo" },
      select: { id: true },
    })
    return NextResponse.json({
      userCount,
      hasTestUser: !!hasSofia,
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
