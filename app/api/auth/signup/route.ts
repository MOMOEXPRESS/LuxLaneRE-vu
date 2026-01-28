import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  hashPassword,
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  generateUniqueUsername,
  type UserRole,
} from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, displayName, role } = body

    // Validate input
    if (!email || !password || !displayName || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate role
    const validRoles: UserRole[] = ["model", "agency", "brand", "client"]
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await db`
      SELECT id FROM users WHERE email = ${email.toLowerCase()}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    // Generate unique username
    const username = await generateUniqueUsername(displayName)

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const userId = uuidv4()
    await db`
      INSERT INTO users (id, email, password_hash, role, username, display_name)
      VALUES (${userId}, ${email.toLowerCase()}, ${passwordHash}, ${role}, ${username}, ${displayName})
    `

    // Create role-specific profile
    if (role === "model") {
      await db`
        INSERT INTO model_profiles (user_id) VALUES (${userId})
      `
    } else if (role === "agency") {
      await db`
        INSERT INTO agency_profiles (user_id) VALUES (${userId})
      `
    } else if (role === "brand") {
      await db`
        INSERT INTO brand_profiles (user_id) VALUES (${userId})
      `
    }

    // Generate tokens
    const accessToken = await generateAccessToken({
      userId,
      email: email.toLowerCase(),
      role,
    })
    const refreshToken = await generateRefreshToken(userId)

    // Set cookies
    await setAuthCookies(accessToken, refreshToken)

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: email.toLowerCase(),
        role,
        username,
        displayName,
        onboardingComplete: false,
      },
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
