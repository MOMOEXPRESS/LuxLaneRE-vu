import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyPassword, generateAccessToken, generateRefreshToken, setAuthCookies } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const devHeaders: Record<string, string> =
    process.env.NODE_ENV === "development" ? { "X-Login-Fail-Reason": "" } : {}

  try {
    // Dev: catch missing DATABASE_URL so app and seed use same DB
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

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    })

    if (!user) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[Login] No user found for email:", email)
        devHeaders["X-Login-Fail-Reason"] = "no-user"
      }
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401, headers: devHeaders }
      )
    }

    // Catch missing/invalid password hash (wrong schema or wrong DB)
    if (!user.passwordHash || typeof user.passwordHash !== "string") {
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json(
          { error: "Server: user has no password hash. Re-run npm run db:seed from project root." },
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

    const accessToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role.toLowerCase() as "model" | "agency" | "brand" | "client",
    })
    const refreshToken = await generateRefreshToken(user.id)

    await setAuthCookies(accessToken, refreshToken)

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
    console.error("[v0] Login error:", error instanceof Error ? error.message : error)
    console.error("[v0] Login error stack:", error instanceof Error ? error.stack : "no stack")
    return NextResponse.json({ error: `Internal server error: ${error instanceof Error ? error.message : "unknown"}` }, { status: 500 })
  }
}
