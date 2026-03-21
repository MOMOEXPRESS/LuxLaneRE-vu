import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

const VALID_REASONS = ["spam", "harassment", "inappropriate", "fake", "other"]

// POST — report a user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { username } = await params
    const target = await prisma.user.findUnique({ where: { username } })
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    if (target.id === user.id) {
      return NextResponse.json({ error: "Cannot report yourself" }, { status: 400 })
    }

    const body = await request.json()
    const { reason, details } = body as { reason: string; details?: string }

    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json({ error: "Invalid reason. Must be one of: " + VALID_REASONS.join(", ") }, { status: 400 })
    }

    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        targetId: target.id,
        reason,
        details,
      },
    })

    return NextResponse.json({ success: true, reportId: report.id })
  } catch (error) {
    console.error("Report user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
