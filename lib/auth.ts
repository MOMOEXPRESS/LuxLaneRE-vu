import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { sql } from "./db"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "luxlane-secret-key-change-in-production")
const ACCESS_TOKEN_EXPIRY = "15m"
const REFRESH_TOKEN_EXPIRY_DAYS = 7

export type UserRole = "model" | "agency" | "brand" | "client"

export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
  iat?: number
  exp?: number
}

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  username: string
  displayName: string
  avatarUrl: string | null
  isVerified: boolean
  onboardingComplete: boolean
}

// Generate access token (short-lived)
export async function generateAccessToken(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET)
}

// Generate refresh token (long-lived, stored in DB)
export async function generateRefreshToken(userId: string): Promise<string> {
  const token = uuidv4()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS)

  // Store in database
  await sql`
    INSERT INTO refresh_tokens (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt})
  `

  return token
}

// Verify access token
export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as JWTPayload
  } catch {
    return null
  }
}

// Verify refresh token (check DB)
export async function verifyRefreshToken(token: string): Promise<string | null> {
  const result = await sql`
    SELECT user_id FROM refresh_tokens
    WHERE token = ${token} AND expires_at > NOW() AND revoked = false
  `

  if (result.length === 0) return null
  return result[0].user_id
}

// Revoke refresh token
export async function revokeRefreshToken(token: string): Promise<void> {
  await sql`
    UPDATE refresh_tokens SET revoked = true WHERE token = ${token}
  `
}

// Revoke all refresh tokens for user
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await sql`
    UPDATE refresh_tokens SET revoked = true WHERE user_id = ${userId}
  `
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Get current user from request
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("access_token")?.value

  if (!accessToken) return null

  const payload = await verifyAccessToken(accessToken)
  if (!payload) return null

  const result = await sql`
    SELECT id, email, role, username, display_name, avatar_url, is_verified, onboarding_complete
    FROM users WHERE id = ${payload.userId}
  `

  if (result.length === 0) return null

  const user = result[0]
  return {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
    username: user.username,
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
    isVerified: user.is_verified,
    onboardingComplete: user.onboarding_complete,
  }
}

// Set auth cookies
export async function setAuthCookies(accessToken: string, refreshToken: string): Promise<void> {
  const cookieStore = await cookies()

  // Access token - short lived, httpOnly
  cookieStore.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60, // 15 minutes
    path: "/",
  })

  // Refresh token - long lived, httpOnly
  cookieStore.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
    path: "/",
  })
}

// Clear auth cookies
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete("access_token")
  cookieStore.delete("refresh_token")
}

// Generate unique username from display name
export async function generateUniqueUsername(displayName: string): Promise<string> {
  const base = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 15)

  let username = base
  let counter = 1

  while (true) {
    const existing = await sql`
      SELECT id FROM users WHERE username = ${username}
    `
    if (existing.length === 0) break
    username = `${base}${counter}`
    counter++
  }

  return username
}

export async function getAuthHeader(): Promise<string | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("access_token")?.value
  return accessToken ? `Bearer ${accessToken}` : null
}
