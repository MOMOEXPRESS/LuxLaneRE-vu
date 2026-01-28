import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get base user data
    const userData = await db`
      SELECT id, email, role, username, display_name, avatar_url, bio, location, website,
             is_verified, tier, onboarding_complete, created_at
      FROM users WHERE id = ${user.id}
    `

    if (userData.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const baseProfile = userData[0]
    let roleProfile = null

    // Get role-specific profile
    if (user.role === "model") {
      const modelData = await db`
        SELECT height_cm, bust_cm, waist_cm, hips_cm, shoe_size, eye_color, hair_color,
               date_of_birth, gender, ethnicity, experience_tags, agency_id, score, rank,
               languages, availability
        FROM model_profiles WHERE user_id = ${user.id}
      `
      if (modelData.length > 0) roleProfile = modelData[0]
    } else if (user.role === "agency") {
      const agencyData = await db`
        SELECT agency_name, founded_year, model_count, specialties
        FROM agency_profiles WHERE user_id = ${user.id}
      `
      if (agencyData.length > 0) roleProfile = agencyData[0]
    } else if (user.role === "brand") {
      const brandData = await db`
        SELECT brand_name, industry, company_size
        FROM brand_profiles WHERE user_id = ${user.id}
      `
      if (brandData.length > 0) roleProfile = brandData[0]
    }

    let digitalTwin = null
    if (user.role === "model") {
      const twinData = await db`
        SELECT id, status, input_urls, preview_url, summary, created_at, updated_at
        FROM digital_twins WHERE user_id = ${user.id}
      `
      if (twinData.length > 0) digitalTwin = twinData[0]
    }

    // Get follower/following counts
    const [followersCount, followingCount] = await Promise.all([
      db`SELECT COUNT(*)::int as count FROM follows WHERE following_id = ${user.id}`,
      db`SELECT COUNT(*)::int as count FROM follows WHERE follower_id = ${user.id}`,
    ])

    return NextResponse.json({
      profile: {
        ...baseProfile,
        roleProfile,
        digitalTwin,
        followersCount: followersCount[0]?.count || 0,
        followingCount: followingCount[0]?.count || 0,
      },
    })
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { displayName, bio, location, website, avatarUrl } = body

    if (displayName && displayName.length > 40) {
      return NextResponse.json({ error: "Display name must be 40 characters or less" }, { status: 400 })
    }
    if (bio && bio.length > 160) {
      return NextResponse.json({ error: "Bio must be 160 characters or less" }, { status: 400 })
    }

    // Update base user profile
    await db`
      UPDATE users SET
        display_name = COALESCE(${displayName}, display_name),
        bio = COALESCE(${bio}, bio),
        location = COALESCE(${location}, location),
        website = COALESCE(${website}, website),
        avatar_url = COALESCE(${avatarUrl}, avatar_url),
        updated_at = NOW()
      WHERE id = ${user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
