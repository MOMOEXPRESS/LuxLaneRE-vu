import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { mediaConfirmSchema } from "@/lib/validations"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const validation = mediaConfirmSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 })
    }

    const { type, url, meta } = validation.data

    // Create media asset record (matches NestJS prisma.mediaAsset.create)
    const mediaId = uuidv4()
    const result = await db`
      INSERT INTO media_assets (id, owner_id, type, url, meta)
      VALUES (${mediaId}, ${user.id}, ${type}, ${url}, ${meta ? JSON.stringify(meta) : null}::jsonb)
      RETURNING id, owner_id, type, url, meta, created_at
    `

    // If it's an avatar, update user's avatar_url
    if (type === "AVATAR") {
      await db`
        UPDATE users SET avatar_url = ${url}, updated_at = NOW() WHERE id = ${user.id}
      `
    }

    return NextResponse.json({
      id: result[0].id,
      ownerId: result[0].owner_id,
      type: result[0].type,
      url: result[0].url,
      meta: result[0].meta,
      createdAt: result[0].created_at,
    })
  } catch (error) {
    console.error("Confirm media error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
