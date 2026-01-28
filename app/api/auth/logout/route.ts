import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { revokeRefreshToken, clearAuthCookies } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get("refresh_token")?.value

    // Revoke refresh token in DB if exists
    if (refreshToken) {
      await revokeRefreshToken(refreshToken)
    }

    // Clear cookies
    await clearAuthCookies()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
