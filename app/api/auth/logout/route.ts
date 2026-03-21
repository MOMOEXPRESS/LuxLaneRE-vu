import { type NextRequest, NextResponse } from "next/server"
import { clearAuthCookies } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Clear cookies (works with or without DB)
    await clearAuthCookies()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
