import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { createHash } from "crypto"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "luxlane-secret-key-change-in-production")
const ACCESS_TOKEN_EXPIRY = "24h"

export type UserRole = "model" | "agency" | "brand" | "client"

export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
  username: string
  displayName: string
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

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

// Generate access token
export async function generateAccessToken(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET)
}

// Verify access token
export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Try to get Prisma client — returns null if DB is unavailable or schema is out of sync
async function tryPrisma() {
  try {
    const { prisma } = await import("./prisma")
    // Check connectivity AND schema by touching a real table
    await prisma.user.findFirst({ take: 1, select: { id: true } })
    return prisma
  } catch {
    return null
  }
}

// Generate refresh token (DB-backed, silently skipped if DB unavailable)
export async function generateRefreshToken(userId: string): Promise<string> {
  const token = uuidv4()
  try {
    const prisma = await tryPrisma()
    if (prisma) {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)
      await prisma.refreshToken.create({
        data: { userId, tokenHash: hashToken(token), expiresAt },
      })
    }
  } catch {
    // DB unavailable or mock user ID — skip storing refresh token
  }
  return token
}

// Get current user from JWT (falls back to JWT-only when DB is unavailable)
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("access_token")?.value

  if (!accessToken) return null

  const payload = await verifyAccessToken(accessToken)
  if (!payload) return null

  // Try DB first for full profile data
  const prisma = await tryPrisma()
  if (prisma) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { profile: true },
      })
      if (user) {
        const profile = user.profile
        return {
          id: user.id,
          email: user.email,
          role: user.role.toLowerCase() as UserRole,
          username: user.username,
          displayName: profile?.displayName ?? user.username,
          avatarUrl: profile?.avatarUrl ?? null,
          isVerified: profile ? profile.verificationStatus !== "UNVERIFIED" : false,
          onboardingComplete: !!profile,
        }
      }
    } catch {
      // DB query failed, fall through to JWT-only
    }
  }

  // JWT-only fallback (mock / no-DB mode)
  return {
    id: payload.userId,
    email: payload.email,
    role: payload.role,
    username: payload.username || payload.email.split("@")[0],
    displayName: payload.displayName || payload.username || payload.email.split("@")[0],
    avatarUrl: null,
    isVerified: false,
    onboardingComplete: true,
  }
}

// Set auth cookies
export async function setAuthCookies(accessToken: string, refreshToken: string): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60,
    path: "/",
  })

  cookieStore.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
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

  const prisma = await tryPrisma()
  if (!prisma) return base

  let username = base
  let counter = 1

  while (true) {
    const existing = await prisma.user.findUnique({ where: { username } })
    if (!existing) break
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

export function parseBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null
  return authHeader.slice(7)
}
