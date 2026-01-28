import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import {
  verifyRefreshToken,
  revokeRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
} from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const refreshTokenCookie = cookieStore.get("refresh_token")?.value

    if (!refreshTokenCookie) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 })
    }

    // Verify refresh token
    const userId = await verifyRefreshToken(refreshTokenCookie)
    if (!userId) {
      return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 })
    }

    // Get user data
    const result = await db`
      SELECT id, email, role, username, display_name, avatar_url, is_verified, onboarding_complete
      FROM users WHERE id = ${userId}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = result[0]

    // Revoke old refresh token (rotation)
    await revokeRefreshToken(refreshTokenCookie)

    // Generate new tokens
    const accessToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })
    const newRefreshToken = await generateRefreshToken(user.id)

    // Set new cookies
    await setAuthCookies(accessToken, newRefreshToken)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        isVerified: user.is_verified,
        onboardingComplete: user.onboarding_complete,
      },
    })
  } catch (error) {
    console.error("Refresh error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
