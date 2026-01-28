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
    const ownerId = searchParams.get("ownerId") || user.id
    const type = searchParams.get("type")

    let media
    if (type) {
      media = await db`
        SELECT id, url, thumbnail_url, type, caption, created_at
        FROM media_assets 
        WHERE owner_id = ${ownerId} AND type = ${type}
        ORDER BY created_at DESC
      `
    } else {
      media = await db`
        SELECT id, url, thumbnail_url, type, caption, created_at
        FROM media_assets 
        WHERE owner_id = ${ownerId}
        ORDER BY created_at DESC
      `
    }

    return NextResponse.json({ media })
  } catch (error) {
    console.error("Get media error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
