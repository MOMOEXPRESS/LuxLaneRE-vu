import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/follows/:username/list?type=followers|following&limit=30&cursor=id
export async function GET(request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "followers"
    const limit = Math.min(Number(searchParams.get("limit") || 30), 100)
    const cursor = searchParams.get("cursor")

    // Get user by username
    const users = await db`
      SELECT id FROM users WHERE username = ${username}
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = users[0].id

    let results
    if (type === "followers") {
      // Get users who follow this user
      if (cursor) {
        results = await db`
          SELECT u.id, u.username, u.display_name, u.avatar_url, u.role, u.is_verified, u.tier
          FROM follows f
          JOIN users u ON u.id = f.follower_id
          WHERE f.following_id = ${userId}
            AND f.created_at < (SELECT created_at FROM follows WHERE follower_id = ${cursor} AND following_id = ${userId})
          ORDER BY f.created_at DESC
          LIMIT ${limit}
        `
      } else {
        results = await db`
          SELECT u.id, u.username, u.display_name, u.avatar_url, u.role, u.is_verified, u.tier
          FROM follows f
          JOIN users u ON u.id = f.follower_id
          WHERE f.following_id = ${userId}
          ORDER BY f.created_at DESC
          LIMIT ${limit}
        `
      }
    } else {
      // Get users this user follows
      if (cursor) {
        results = await db`
          SELECT u.id, u.username, u.display_name, u.avatar_url, u.role, u.is_verified, u.tier
          FROM follows f
          JOIN users u ON u.id = f.following_id
          WHERE f.follower_id = ${userId}
            AND f.created_at < (SELECT created_at FROM follows WHERE follower_id = ${userId} AND following_id = ${cursor})
          ORDER BY f.created_at DESC
          LIMIT ${limit}
        `
      } else {
        results = await db`
          SELECT u.id, u.username, u.display_name, u.avatar_url, u.role, u.is_verified, u.tier
          FROM follows f
          JOIN users u ON u.id = f.following_id
          WHERE f.follower_id = ${userId}
          ORDER BY f.created_at DESC
          LIMIT ${limit}
        `
      }
    }

    // Get next cursor
    const nextCursor = results.length === limit ? results[results.length - 1]?.id : null

    return NextResponse.json({
      users: results,
      nextCursor,
    })
  } catch (error) {
    console.error("Get follow list error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
