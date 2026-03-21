import { type NextRequest, NextResponse } from "next/server"
import { verifyPassword, generateAccessToken, setAuthCookies } from "@/lib/auth"
import { findMockUserByEmail, mockUserToAuthUser, TEST_PASSWORD } from "@/lib/mock-users"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const password = typeof body.password === "string" ? body.password.trim() : ""

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Try DB-backed login first
    try {
      const { prisma } = await import("@/lib/prisma")

      const user = await prisma.user.findUnique({
        where: { email },
        include: { profile: true },
      })

      if (!user) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
      }

      if (!user.passwordHash || typeof user.passwordHash !== "string") {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
      }

      const isValidPassword = await verifyPassword(password, user.passwordHash)
      if (!isValidPassword) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
      }

      const role = user.role.toLowerCase() as "model" | "agency" | "brand" | "client"
      const profile = user.profile

      const accessToken = await generateAccessToken({
        userId: user.id,
        email: user.email,
        role,
        username: user.username,
        displayName: profile?.displayName ?? user.username,
      })

      // Store refresh token in DB
      const refreshToken = uuidv4()
      const { createHash } = await import("crypto")
      const tokenHash = createHash("sha256").update(refreshToken).digest("hex")
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)
      try {
        await prisma.refreshToken.create({
          data: { userId: user.id, tokenHash, expiresAt },
        })
      } catch {
        // Refresh token storage failed — continue without it
      }

      await setAuthCookies(accessToken, refreshToken)

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role,
          username: user.username,
          displayName: profile?.displayName ?? user.username,
          avatarUrl: profile?.avatarUrl ?? null,
          isVerified: profile ? profile.verificationStatus !== "UNVERIFIED" : false,
          onboardingComplete: !!profile,
        },
      })
    } catch {
      // DB unavailable or schema mismatch — fall through to mock login
    }

    // Mock login (no database needed)
    const mockUser = findMockUserByEmail(email)
    if (!mockUser || password !== TEST_PASSWORD) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const accessToken = await generateAccessToken({
      userId: mockUser.id,
      email: mockUser.email,
      role: mockUser.role,
      username: mockUser.username,
      displayName: mockUser.displayName,
    })

    // No DB for refresh token — just use a dummy value for the cookie
    const refreshToken = uuidv4()
    await setAuthCookies(accessToken, refreshToken)

    const authUser = mockUserToAuthUser(mockUser)
    return NextResponse.json({ success: true, user: authUser })
  } catch (error) {
    console.error("[v0] Login error:", error instanceof Error ? error.message : error)
    console.error("[v0] Login error stack:", error instanceof Error ? error.stack : "no stack")
    return NextResponse.json({ error: `Internal server error: ${error instanceof Error ? error.message : "unknown"}` }, { status: 500 })
  }
}
