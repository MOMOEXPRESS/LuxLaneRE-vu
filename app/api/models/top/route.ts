import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") // runway, editorial, commercial, etc.
    const limit = Number(searchParams.get("limit")) || 10

    let models

    if (filter) {
      models = await db`
        SELECT u.id, u.display_name, u.avatar_url, u.username, u.is_verified, u.tier, u.location,
               mp.score, mp.rank, mp.experience_tags, mp.height_cm, mp.eye_color, mp.hair_color
        FROM users u
        JOIN model_profiles mp ON u.id = mp.user_id
        WHERE u.role = 'model' AND ${filter} = ANY(mp.experience_tags)
        ORDER BY mp.score DESC NULLS LAST
        LIMIT ${limit}
      `
    } else {
      models = await db`
        SELECT u.id, u.display_name, u.avatar_url, u.username, u.is_verified, u.tier, u.location,
               mp.score, mp.rank, mp.experience_tags, mp.height_cm, mp.eye_color, mp.hair_color
        FROM users u
        JOIN model_profiles mp ON u.id = mp.user_id
        WHERE u.role = 'model'
        ORDER BY mp.score DESC NULLS LAST
        LIMIT ${limit}
      `
    }

    return NextResponse.json({ models })
  } catch (error) {
    console.error("Get top models error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
