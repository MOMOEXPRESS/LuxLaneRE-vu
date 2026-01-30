import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { createHash } from "crypto"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"
import { sql, toCamelCase } from "./db"

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

interface UserRow {
  id: string
  email: string
  username: string
  role: string
  displayName: string
}

interface ProfileRow {
  userId: string
  displayName: string
  avatarUrl: string | null
  verificationStatus: string
}

interface RefreshTokenRow {
  userId: string
  expiresAt: Date
}

function roleToLower(role: string): UserRole {
  return role.toLowerCase() as UserRole
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
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

  await sql`
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
    VALUES (${userId}, ${hashToken(token)}, ${expiresAt})
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
  const hash = hashToken(token)
  const rows = await sql`
    SELECT user_id, expires_at FROM refresh_tokens 
    WHERE token_hash = ${hash} AND revoked = false
    LIMIT 1
  `
  if (rows.length === 0) return null
  const row = toCamelCase<RefreshTokenRow>(rows[0] as Record<string, unknown>)
  if (new Date(row.expiresAt) < new Date()) return null
  return row.userId
}

// Revoke refresh token
export async function revokeRefreshToken(token: string): Promise<void> {
  const hash = hashToken(token)
  await sql`
    UPDATE refresh_tokens SET revoked = true WHERE token_hash = ${hash}
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

// Get current user from request (tries refresh token if access token missing/expired)
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("access_token")?.value

  if (accessToken) {
    const payload = await verifyAccessToken(accessToken)
    if (payload) {
      const userRows = await sql`
        SELECT id, email, username, role, display_name FROM users WHERE id = ${payload.userId}
      `
      if (userRows.length > 0) {
        const user = toCamelCase<UserRow>(userRows[0] as Record<string, unknown>)
        const profileRows = await sql`
          SELECT user_id, display_name, avatar_url, verification_status FROM profiles WHERE user_id = ${user.id}
        `
        const profile = profileRows.length > 0 
          ? toCamelCase<ProfileRow>(profileRows[0] as Record<string, unknown>) 
          : null
        return {
          id: user.id,
          email: user.email,
          role: roleToLower(user.role),
          username: user.username,
          displayName: profile?.displayName ?? user.displayName ?? user.username,
          avatarUrl: profile?.avatarUrl ?? null,
          isVerified: profile ? profile.verificationStatus !== "UNVERIFIED" : false,
          onboardingComplete: !!profile,
        }
      }
    }
  }

  // Access token missing or expired – try refresh token
  const refreshToken = cookieStore.get("refresh_token")?.value
  if (!refreshToken) return null

  const userId = await verifyRefreshToken(refreshToken)
  if (!userId) return null

  const userRows = await sql`
    SELECT id, email, username, role, display_name FROM users WHERE id = ${userId}
  `
  if (userRows.length === 0) return null
  const user = toCamelCase<UserRow>(userRows[0] as Record<string, unknown>)

  const profileRows = await sql`
    SELECT user_id, display_name, avatar_url, verification_status FROM profiles WHERE user_id = ${user.id}
  `
  const profile = profileRows.length > 0 
    ? toCamelCase<ProfileRow>(profileRows[0] as Record<string, unknown>) 
    : null

  await revokeRefreshToken(refreshToken)
  const newAccessToken = await generateAccessToken({
    userId: user.id,
    email: user.email,
    role: roleToLower(user.role),
  })
  const newRefreshToken = await generateRefreshToken(user.id)
  await setAuthCookies(newAccessToken, newRefreshToken)

  return {
    id: user.id,
    email: user.email,
    role: roleToLower(user.role),
    username: user.username,
    displayName: profile?.displayName ?? user.displayName ?? user.username,
    avatarUrl: profile?.avatarUrl ?? null,
    isVerified: profile ? profile.verificationStatus !== "UNVERIFIED" : false,
    onboardingComplete: !!profile,
  }
}

// Set auth cookies
export async function setAuthCookies(accessToken: string, refreshToken: string): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60,
    path: "/",
  })

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
    .slice(0, 15) || "user"

  let username = base
  let counter = 1

  while (true) {
    const existing = await sql`SELECT id FROM users WHERE username = ${username}`
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

// For API routes that receive Authorization header (e.g. fetch with credentials)
export function parseBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null
  return authHeader.slice(7)
}
