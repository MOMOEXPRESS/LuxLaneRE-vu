import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  hashPassword,
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  generateUniqueUsername,
} from "@/lib/auth"
const VALID_ROLES = ["MODEL", "AGENCY", "BRAND", "CLIENT"] as const

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("[v0] Signup request body:", { ...body, password: "***" })
    const { email, password, displayName, role: roleInput, username: usernameInput } = body

    if (!email || !password || !displayName || !roleInput) {
      console.log("[v0] Missing required fields:", { email: !!email, password: !!password, displayName: !!displayName, roleInput: !!roleInput })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const roleUpper = String(roleInput).toUpperCase()
    if (!VALID_ROLES.includes(roleUpper as any)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }
    const role = roleUpper as string

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    const username = usernameInput
      ? await ensureUniqueUsername(String(usernameInput).toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30) || "user")
      : await generateUniqueUsername(displayName)

    const passwordHash = await hashPassword(password)
    const normalizedEmail = email.toLowerCase()

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        username,
        passwordHash,
        displayName,
        role,
      },
    })

    // Create profile record
    await prisma.profile.create({
      data: {
        userId: user.id,
        displayName,
      },
    })

    if (role === "MODEL") {
      await prisma.modelProfile.create({
        data: { userId: user.id },
      })
    } else if (role === "AGENCY") {
      await prisma.agencyProfile.create({
        data: { userId: user.id, agencyName: displayName },
      })
    } else if (role === "BRAND") {
      await prisma.brandProfile.create({
        data: { userId: user.id, brandName: displayName },
      })
    } else if (role === "CLIENT") {
      await prisma.clientProfile.create({
        data: { userId: user.id, clientName: displayName },
      })
    }

    const accessToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role.toLowerCase() as "model" | "agency" | "brand" | "client",
      username: user.username,
      displayName,
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
        displayName,
        avatarUrl: null,
        isVerified: false,
        onboardingComplete: false,
      },
    })
  } catch (error) {
    console.error("Signup error:", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    const isDbError = message.includes("connect") || message.includes("Can't reach") || message.includes("P1001")
    return NextResponse.json(
      {
        error: isDbError
          ? "Database unavailable. On Vercel: add a hosted Postgres (Neon/Vercel Postgres), set DATABASE_URL, and run migrations."
          : "Internal server error",
      },
      { status: 500 }
    )
  }
}

async function ensureUniqueUsername(base: string): Promise<string> {
  let username = base
  let counter = 1
  while (true) {
    const existing = await prisma.user.findUnique({ where: { username } })
    if (!existing) return username
    username = `${base}${counter}`
    counter++
  }
}
