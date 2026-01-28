import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unread") === "true"
    const limit = Number(searchParams.get("limit")) || 50

    let notifications
    if (unreadOnly) {
      notifications = await db`
        SELECT * FROM notifications 
        WHERE user_id = ${user.id} AND read = false
        ORDER BY created_at DESC
        LIMIT ${limit}
      `
    } else {
      notifications = await db`
        SELECT * FROM notifications 
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `
    }

    // Get unread count
    const unreadCount = await db`
      SELECT COUNT(*) as count FROM notifications WHERE user_id = ${user.id} AND read = false
    `

    return NextResponse.json({
      notifications,
      unreadCount: Number(unreadCount[0]?.count || 0),
    })
  } catch (error) {
    console.error("Get notifications error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
