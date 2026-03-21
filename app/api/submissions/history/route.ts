import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// GET — get job history (past bookings / completed castings for a model)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") // filter by status
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const offset = parseInt(searchParams.get("offset") || "0", 10)

    // Build filter
    const where: Record<string, unknown> = { modelId: user.id }

    if (status) {
      where.status = status.toUpperCase()
    } else {
      // Default: show completed/accepted/confirmed/declined/rejected (past jobs)
      where.status = { in: ["ACCEPTED", "CONFIRMED", "DECLINED", "REJECTED"] }
    }

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          casting: {
            include: {
              creator: { include: { profile: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.submission.count({ where }),
    ])

    return NextResponse.json({
      submissions: submissions.map((s: typeof submissions[number]) => ({
        id: s.id,
        status: s.status,
        note: s.note,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        casting: s.casting
          ? {
              id: s.casting.id,
              title: s.casting.title,
              type: s.casting.type,
              status: s.casting.status,
              location: s.casting.location,
              startDate: s.casting.startDate,
              endDate: s.casting.endDate,
              payMin: s.casting.payMin,
              payMax: s.casting.payMax,
              creator: {
                id: s.casting.creator.id,
                username: s.casting.creator.username,
                name: s.casting.creator.profile?.displayName || s.casting.creator.username,
                avatar: s.casting.creator.profile?.avatarUrl,
                role: s.casting.creator.role.toLowerCase(),
              },
            }
          : null,
      })),
      total,
    })
  } catch (error) {
    console.error("Get job history error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
