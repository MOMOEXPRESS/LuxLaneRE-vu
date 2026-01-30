import { type NextRequest, NextResponse } from "next/server"
import { sql, toCamelCase } from "@/lib/db"
import { verifyPassword, generateAccessToken, generateRefreshToken, setAuthCookies } from "@/lib/auth"

interface UserRow {
  id: string
  email: string
  username: string
  passwordHash: string
  role: string
  displayName: string
}

interface ProfileRow {
  userId: string
  displayName: string
  avatarUrl: string | null
  verificationStatus: string
}

export async function POST(request: NextRequest) {
  const devHeaders: Record<string, string> =
    process.env.NODE_ENV === "development" ? { "X-Login-Fail-Reason": "" } : {}

  try {
    if (process.env.NODE_ENV === "development" && !process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Server: DATABASE_URL not set. Add it to .env or .env.local in project root and restart npm run dev." },
        { status: 500 }
      )
    }

    const body = await request.json()
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const password = typeof body.password === "string" ? body.password.trim() : ""

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Query user from database using Neon
    const userRows = await sql`
      SELECT id, email, username, password_hash, role, display_name 
      FROM users 
      WHERE email = ${email}
    `

    if (userRows.length === 0) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[Login] No user found for email:", email)
        devHeaders["X-Login-Fail-Reason"] = "no-user"
      }
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401, headers: devHeaders }
      )
    }

    const user = toCamelCase<UserRow>(userRows[0] as Record<string, unknown>)

    // Catch missing/invalid password hash
    if (!user.passwordHash || typeof user.passwordHash !== "string") {
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json(
          { error: "Server: user has no password hash. Re-run database seed." },
          { status: 500 }
        )
      }
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash)
    if (!isValidPassword) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[Login] Password mismatch for email:", email)
        devHeaders["X-Login-Fail-Reason"] = "password-mismatch"
      }
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401, headers: devHeaders }
      )
    }

    // Get profile data
    const profileRows = await sql`
      SELECT user_id, display_name, avatar_url, verification_status 
      FROM profiles 
      WHERE user_id = ${user.id}
    `
    const profile = profileRows.length > 0 
      ? toCamelCase<ProfileRow>(profileRows[0] as Record<string, unknown>) 
      : null

    const accessToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role.toLowerCase() as "model" | "agency" | "brand" | "client",
    })
    const refreshToken = await generateRefreshToken(user.id)

    await setAuthCookies(accessToken, refreshToken)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role.toLowerCase(),
        username: user.username,
        displayName: profile?.displayName ?? user.displayName ?? user.username,
        avatarUrl: profile?.avatarUrl ?? null,
        isVerified: profile ? profile.verificationStatus !== "UNVERIFIED" : false,
        onboardingComplete: !!profile,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
