import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params
    const currentUser = await getCurrentUser()

    // Get base user data
    const userData = await db`
      SELECT id, email, role, username, display_name, avatar_url, bio, location, website,
             is_verified, tier, created_at
      FROM users WHERE username = ${username}
    `

    if (userData.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const baseProfile = userData[0]
    let roleProfile = null

    // Get role-specific profile
    if (baseProfile.role === "model") {
      const modelData = await db`
        SELECT height_cm, bust_cm, waist_cm, hips_cm, shoe_size, eye_color, hair_color,
               gender, ethnicity, experience_tags, score, rank, languages, availability
        FROM model_profiles WHERE user_id = ${baseProfile.id}
      `
      if (modelData.length > 0) roleProfile = modelData[0]
    } else if (baseProfile.role === "agency") {
      const agencyData = await db`
        SELECT agency_name, founded_year, model_count, specialties
        FROM agency_profiles WHERE user_id = ${baseProfile.id}
      `
      if (agencyData.length > 0) roleProfile = agencyData[0]
    } else if (baseProfile.role === "brand") {
      const brandData = await db`
        SELECT brand_name, industry, company_size
        FROM brand_profiles WHERE user_id = ${baseProfile.id}
      `
      if (brandData.length > 0) roleProfile = brandData[0]
    }

    let digitalTwin = null
    if (baseProfile.role === "model") {
      const twinData = await db`
        SELECT id, status, preview_url, summary, created_at
        FROM digital_twins WHERE user_id = ${baseProfile.id}
      `
      if (twinData.length > 0) digitalTwin = twinData[0]
    }

    // Get follower/following counts and isFollowing in parallel
    const [followersCount, followingCount, isFollowingResult] = await Promise.all([
      db`SELECT COUNT(*)::int as count FROM follows WHERE following_id = ${baseProfile.id}`,
      db`SELECT COUNT(*)::int as count FROM follows WHERE follower_id = ${baseProfile.id}`,
      currentUser && currentUser.id !== baseProfile.id
        ? db`SELECT 1 FROM follows WHERE follower_id = ${currentUser.id} AND following_id = ${baseProfile.id}`
        : Promise.resolve([]),
    ])

    const isFollowing = isFollowingResult.length > 0

    // Get portfolio media
    const portfolio = await db`
      SELECT id, url, thumbnail_url, type, caption, created_at
      FROM media_assets 
      WHERE owner_id = ${baseProfile.id} AND type IN ('PORTFOLIO', 'POLAROID')
      ORDER BY created_at DESC
      LIMIT 20
    `

    return NextResponse.json({
      profile: {
        ...baseProfile,
        roleProfile,
        digitalTwin,
        followersCount: followersCount[0]?.count || 0,
        followingCount: followingCount[0]?.count || 0,
        isFollowing,
        portfolio,
      },
    })
  } catch (error) {
    console.error("Get profile by username error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
