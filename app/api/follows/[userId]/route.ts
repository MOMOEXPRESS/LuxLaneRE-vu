import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId: followingId } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (user.id === followingId) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
    }

    const target = await db`
      SELECT id FROM users WHERE id = ${followingId}
    `
    if (target.length === 0) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 })
    }

    await db`
      INSERT INTO follows (id, follower_id, following_id)
      VALUES (${uuidv4()}, ${user.id}, ${followingId})
      ON CONFLICT (follower_id, following_id) DO NOTHING
    `

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Follow error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId: followingId } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await db`
      DELETE FROM follows WHERE follower_id = ${user.id} AND following_id = ${followingId}
    `

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Unfollow error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
