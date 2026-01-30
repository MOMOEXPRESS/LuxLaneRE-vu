import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  hashPassword,
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  generateUniqueUsername,
} from "@/lib/auth"
import { Role } from "@prisma/client"

const VALID_ROLES: Role[] = [Role.MODEL, Role.AGENCY, Role.BRAND, Role.CLIENT]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, displayName, role: roleInput, username: usernameInput } = body

    if (!email || !password || !displayName || !roleInput) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const roleUpper = String(roleInput).toUpperCase()
    if (!VALID_ROLES.includes(roleUpper as Role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }
    const role = roleUpper as Role

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
        role,
      },
    })

    await prisma.profile.create({
      data: {
        userId: user.id,
        displayName,
      },
    })

    if (role === Role.MODEL) {
      await prisma.modelProfile.create({
        data: { userId: user.id },
      })
    } else if (role === Role.AGENCY) {
      await prisma.agencyProfile.create({
        data: { userId: user.id, agencyName: displayName },
      })
    } else if (role === Role.BRAND) {
      await prisma.brandProfile.create({
        data: { userId: user.id, brandName: displayName },
      })
    }

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
        displayName,
        avatarUrl: null,
        isVerified: false,
        onboardingComplete: false,
      },
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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
