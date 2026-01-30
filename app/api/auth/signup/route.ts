import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import {
  hashPassword,
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  generateUniqueUsername,
} from "@/lib/auth"

const VALID_ROLES = ["MODEL", "AGENCY", "BRAND"]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, displayName, role: roleInput, username: usernameInput } = body

    if (!email || !password || !displayName || !roleInput) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const roleUpper = String(roleInput).toUpperCase()
    if (!VALID_ROLES.includes(roleUpper)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }
    const role = roleUpper

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase()}
    `
    if (existingUser.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    const username = usernameInput
      ? await ensureUniqueUsername(String(usernameInput).toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30) || "user")
      : await generateUniqueUsername(displayName)

    const passwordHash = await hashPassword(password)
    const normalizedEmail = email.toLowerCase()

    // Create user
    const userResult = await sql`
      INSERT INTO users (email, username, password_hash, role, display_name)
      VALUES (${normalizedEmail}, ${username}, ${passwordHash}, ${role}::role, ${displayName})
      RETURNING id, email, username, role
    `
    const user = userResult[0]

    // Create profile
    await sql`
      INSERT INTO profiles (user_id, display_name)
      VALUES (${user.id}, ${displayName})
    `

    // Create role-specific profile
    if (role === "MODEL") {
      await sql`
        INSERT INTO model_profiles (user_id)
        VALUES (${user.id})
        ON CONFLICT (user_id) DO NOTHING
      `
    } else if (role === "AGENCY") {
      await sql`
        INSERT INTO agency_profiles (user_id, agency_name)
        VALUES (${user.id}, ${displayName})
        ON CONFLICT (user_id) DO NOTHING
      `
    } else if (role === "BRAND") {
      await sql`
        INSERT INTO brand_profiles (user_id, brand_name)
        VALUES (${user.id}, ${displayName})
        ON CONFLICT (user_id) DO NOTHING
      `
    }

    const accessToken = await generateAccessToken({
      userId: user.id as string,
      email: user.email as string,
      role: (user.role as string).toLowerCase() as "model" | "agency" | "brand" | "client",
    })
    const refreshToken = await generateRefreshToken(user.id as string)

    await setAuthCookies(accessToken, refreshToken)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: (user.role as string).toLowerCase(),
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
    const existing = await sql`SELECT id FROM users WHERE username = ${username}`
    if (existing.length === 0) return username
    username = `${base}${counter}`
    counter++
  }
}
