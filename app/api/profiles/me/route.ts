import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get user with profile
    const users = await sql`
      SELECT 
        u.id, u.email, u.username, u.role, u.display_name, u.created_at,
        p.display_name as profile_display_name,
        p.avatar_url,
        p.bio,
        p.location,
        p.verification_status,
        p.score
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.id = ${user.id}
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const dbUser = users[0]

    // Get follower and following counts
    const [followersResult, followingResult] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM follows WHERE following_id = ${user.id}`,
      sql`SELECT COUNT(*) as count FROM follows WHERE follower_id = ${user.id}`,
    ])

    const followersCount = parseInt(followersResult[0]?.count ?? '0')
    const followingCount = parseInt(followingResult[0]?.count ?? '0')

    return NextResponse.json({
      profile: {
        id: dbUser.id,
        email: dbUser.email,
        username: dbUser.username,
        displayName: dbUser.profile_display_name ?? dbUser.display_name ?? dbUser.username,
        name: dbUser.profile_display_name ?? dbUser.display_name ?? dbUser.username,
        avatarUrl: dbUser.avatar_url,
        avatar: dbUser.avatar_url ?? "/placeholder.svg?height=400&width=400",
        bio: dbUser.bio,
        location: dbUser.location,
        role: dbUser.role.toLowerCase(),
        roleProfile: null,
        digitalTwin: null,
        followersCount,
        followingCount,
        verificationStatus: dbUser.verification_status ?? "UNVERIFIED",
        isVerified: dbUser.verification_status ? dbUser.verification_status !== "UNVERIFIED" : false,
        score: dbUser.score ?? 0,
        portfolio: [],
        measurements: undefined,
        languages: [],
        experience: [],
        skinTone: undefined,
        availabilityStatus: undefined,
        createdAt: dbUser.created_at ? new Date(dbUser.created_at).toISOString() : new Date().toISOString(),
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
    const { displayName, bio, location, avatarUrl } = body

    if (displayName != null && displayName.length > 40) {
      return NextResponse.json({ error: "Display name must be 40 characters or less" }, { status: 400 })
    }
    if (bio != null && bio.length > 160) {
      return NextResponse.json({ error: "Bio must be 160 characters or less" }, { status: 160 })
    }

    // Upsert profile
    await sql`
      INSERT INTO profiles (user_id, display_name, bio, location, avatar_url)
      VALUES (
        ${user.id},
        ${displayName ?? user.username},
        ${bio ?? null},
        ${location ?? null},
        ${avatarUrl ?? null}
      )
      ON CONFLICT (user_id) DO UPDATE SET
        display_name = COALESCE(${displayName}, profiles.display_name),
        bio = COALESCE(${bio}, profiles.bio),
        location = COALESCE(${location}, profiles.location),
        avatar_url = COALESCE(${avatarUrl}, profiles.avatar_url),
        updated_at = NOW()
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
