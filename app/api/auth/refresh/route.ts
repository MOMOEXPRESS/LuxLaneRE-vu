import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    await revokeRefreshToken(refreshTokenCookie)

    const accessToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role.toLowerCase() as "model" | "agency" | "brand" | "client",
    })
    const newRefreshToken = await generateRefreshToken(user.id)

    await setAuthCookies(accessToken, newRefreshToken)

    const profile = user.profile
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role.toLowerCase(),
        username: user.username,
        displayName: profile?.displayName ?? user.username,
        avatarUrl: profile?.avatarUrl ?? null,
        isVerified: profile ? profile.verificationStatus !== "UNVERIFIED" : false,
        onboardingComplete: !!profile,
      },
    })
  } catch (error) {
    console.error("Refresh error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
