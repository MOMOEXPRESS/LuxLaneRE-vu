import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params

    const user = await db`
      SELECT id FROM users WHERE username = ${username}
    `

    if (user.length === 0) {
      return NextResponse.json(null)
    }

    const twin = await db`
      SELECT id, user_id, status, summary, preview_url, created_at, updated_at 
      FROM digital_twins 
      WHERE user_id = ${user[0].id}
    `

    if (twin.length === 0) {
      return NextResponse.json(null)
    }

    return NextResponse.json({
      id: twin[0].id,
      userId: twin[0].user_id,
      status: twin[0].status,
      summary: twin[0].summary,
      previewUrl: twin[0].preview_url,
      createdAt: twin[0].created_at,
      updatedAt: twin[0].updated_at,
    })
  } catch (error) {
    console.error("Get digital twin by username error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
