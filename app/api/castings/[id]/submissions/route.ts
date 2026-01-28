import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: castingId } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Verify user is the casting creator
    const casting = await db`
      SELECT creator_id FROM castings WHERE id = ${castingId}
    `

    if (casting.length === 0) {
      return NextResponse.json({ error: "Casting not found" }, { status: 404 })
    }

    if (casting[0].creator_id !== user.id) {
      return NextResponse.json({ error: "Not authorized to view submissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    let submissions
    if (status) {
      submissions = await db`
        SELECT s.*, 
               u.display_name as model_name, u.avatar_url as model_avatar, u.username as model_username,
               u.is_verified as model_verified,
               mp.height_cm, mp.experience_tags, mp.score as model_score,
               su.display_name as submitted_by_name
        FROM submissions s
        JOIN users u ON s.model_id = u.id
        LEFT JOIN model_profiles mp ON s.model_id = mp.user_id
        LEFT JOIN users su ON s.submitted_by_id = su.id
        WHERE s.casting_id = ${castingId} AND s.status = ${status}
        ORDER BY s.created_at DESC
      `
    } else {
      submissions = await db`
        SELECT s.*, 
               u.display_name as model_name, u.avatar_url as model_avatar, u.username as model_username,
               u.is_verified as model_verified,
               mp.height_cm, mp.experience_tags, mp.score as model_score,
               su.display_name as submitted_by_name
        FROM submissions s
        JOIN users u ON s.model_id = u.id
        LEFT JOIN model_profiles mp ON s.model_id = mp.user_id
        LEFT JOIN users su ON s.submitted_by_id = su.id
        WHERE s.casting_id = ${castingId}
        ORDER BY s.created_at DESC
      `
    }

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error("Get submissions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
