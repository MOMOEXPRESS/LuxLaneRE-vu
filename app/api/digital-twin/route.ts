import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const twin = await db`
      SELECT id, user_id, status, summary, preview_url, created_at, updated_at 
      FROM digital_twins 
      WHERE user_id = ${user.id}
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
    console.error("Get digital twin error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (user.role !== "model") {
      return NextResponse.json({ error: "Only models can create digital twins" }, { status: 403 })
    }

    // Ensure model profile exists (upsert pattern from NestJS)
    await db`
      INSERT INTO model_profiles (user_id, languages)
      VALUES (${user.id}, '[]'::jsonb)
      ON CONFLICT (user_id) DO NOTHING
    `

    // Upsert digital twin with PENDING status
    await db`
      INSERT INTO digital_twins (id, user_id, status)
      VALUES (gen_random_uuid(), ${user.id}, 'PENDING')
      ON CONFLICT (user_id) DO UPDATE SET status = 'PENDING', updated_at = NOW()
    `

    // Return checklist for UI (from NestJS service)
    const checklist = [
      { key: "face_front", label: "Face Front", required: true },
      { key: "face_left", label: "Face Left", required: true },
      { key: "face_right", label: "Face Right", required: true },
      { key: "body_front", label: "Full Body Front", required: true },
      { key: "body_side", label: "Full Body Side", required: true },
      { key: "body_back", label: "Full Body Back", required: false },
      { key: "walk_video", label: "10-20s Walk Video", required: false },
    ]

    return NextResponse.json({ ok: true, checklist })
  } catch (error) {
    console.error("Create digital twin error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
