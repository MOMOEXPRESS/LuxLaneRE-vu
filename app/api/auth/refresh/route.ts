import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, generateAccessToken, generateRefreshToken, setAuthCookies } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // getCurrentUser already handles both DB and JWT-only modes
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const accessToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
      displayName: user.displayName,
    })
    const refreshToken = await generateRefreshToken(user.id)
    await setAuthCookies(accessToken, refreshToken)

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("Refresh error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
