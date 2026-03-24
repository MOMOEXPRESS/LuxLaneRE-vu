import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth"

// POST — request password reset (in production, sends email; here, resets directly)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, newPassword } = body as { email?: string; newPassword?: string }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) {
      // Don't reveal if email exists — always return success
      return NextResponse.json({ success: true, message: "If an account exists, a reset link has been sent." })
    }

    if (newPassword) {
      // Direct reset (dev/demo mode — in production this would use a token)
      if (newPassword.length < 8) {
        return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
      }

      const passwordHash = await hashPassword(newPassword)
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      })

      return NextResponse.json({ success: true, message: "Password has been reset." })
    }

    // In production: generate token, send email
    return NextResponse.json({ success: true, message: "If an account exists, a reset link has been sent." })
  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
