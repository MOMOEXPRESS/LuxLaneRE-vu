import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import {
  verifyRefreshToken,
  revokeRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
} from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await request.cookies
    const refreshTokenCookie = cookieStore.get("refresh_token")?.value

    if (!refreshTokenCookie) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 })
    }

    const userId = await verifyRefreshToken(refreshTokenCookie)
    if (!userId) {
      return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 })
    }

    // Get user with profile
    const users = await sql`
      SELECT 
        u.id, u.email, u.username, u.role, u.display_name,
        p.display_name as profile_display_name,
        p.avatar_url,
        p.verification_status
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.id = ${userId}
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = users[0]

    await revokeRefreshToken(refreshTokenCookie)

    const accessToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role.toLowerCase() as "model" | "agency" | "brand" | "client",
    })
    const newRefreshToken = await generateRefreshToken(user.id)

    await setAuthCookies(accessToken, newRefreshToken)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role.toLowerCase(),
        username: user.username,
        displayName: user.profile_display_name ?? user.display_name ?? user.username,
        avatarUrl: user.avatar_url ?? null,
        isVerified: user.verification_status ? user.verification_status !== "UNVERIFIED" : false,
        onboardingComplete: !!user.profile_display_name,
      },
    })
  } catch (error) {
    console.error("Refresh error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
