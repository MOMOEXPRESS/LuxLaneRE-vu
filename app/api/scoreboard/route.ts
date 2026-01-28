import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") || "top" // top, rising, runway, editorial
    const limit = Number(searchParams.get("limit")) || 20

    let models

    if (filter === "rising") {
      // Models who recently improved score (simplified - by recent activity)
      models = await db`
        SELECT u.id, u.display_name, u.avatar_url, u.username, u.is_verified, u.tier,
               mp.score, mp.rank, mp.experience_tags, mp.height_cm
        FROM users u
        JOIN model_profiles mp ON u.id = mp.user_id
        WHERE u.role = 'model'
        ORDER BY mp.updated_at DESC, mp.score DESC
        LIMIT ${limit}
      `
    } else if (filter === "runway") {
      // Models with runway experience
      models = await db`
        SELECT u.id, u.display_name, u.avatar_url, u.username, u.is_verified, u.tier,
               mp.score, mp.rank, mp.experience_tags, mp.height_cm
        FROM users u
        JOIN model_profiles mp ON u.id = mp.user_id
        WHERE u.role = 'model' AND 'runway' = ANY(mp.experience_tags)
        ORDER BY mp.score DESC
        LIMIT ${limit}
      `
    } else if (filter === "editorial") {
      // Models with editorial experience
      models = await db`
        SELECT u.id, u.display_name, u.avatar_url, u.username, u.is_verified, u.tier,
               mp.score, mp.rank, mp.experience_tags, mp.height_cm
        FROM users u
        JOIN model_profiles mp ON u.id = mp.user_id
        WHERE u.role = 'model' AND 'editorial' = ANY(mp.experience_tags)
        ORDER BY mp.score DESC
        LIMIT ${limit}
      `
    } else {
      // Top models by score
      models = await db`
        SELECT u.id, u.display_name, u.avatar_url, u.username, u.is_verified, u.tier,
               mp.score, mp.rank, mp.experience_tags, mp.height_cm
        FROM users u
        JOIN model_profiles mp ON u.id = mp.user_id
        WHERE u.role = 'model'
        ORDER BY mp.score DESC NULLS LAST
        LIMIT ${limit}
      `
    }

    return NextResponse.json({ models })
  } catch (error) {
    console.error("Get scoreboard error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
