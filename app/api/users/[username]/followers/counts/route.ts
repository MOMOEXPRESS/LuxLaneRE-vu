import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/follows/:username/counts - Get follower/following counts by username
export async function GET(request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params

    // Get user by username
    const users = await db`
      SELECT id FROM users WHERE username = ${username}
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = users[0].id

    // Get counts
    const [followers, following] = await Promise.all([
      db`SELECT COUNT(*)::int as count FROM follows WHERE following_id = ${userId}`,
      db`SELECT COUNT(*)::int as count FROM follows WHERE follower_id = ${userId}`,
    ])

    return NextResponse.json({
      followersCount: followers[0]?.count || 0,
      followingCount: following[0]?.count || 0,
    })
  } catch (error) {
    console.error("Get follow counts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
