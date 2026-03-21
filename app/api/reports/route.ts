import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Allow brand, agency roles (and admin if added later)
    if (!["brand", "agency"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const status = request.nextUrl.searchParams.get("status") || "PENDING"

    const reports = await prisma.report.findMany({
      where: { status },
      include: {
        reporter: { select: { username: true } },
        target: { select: { username: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    const mapped = reports.map((r: any) => ({
      id: r.id,
      reason: r.reason,
      details: r.details,
      status: r.status,
      createdAt: r.createdAt,
      reporterUsername: r.reporter.username,
      targetUsername: r.target.username,
    }))

    return NextResponse.json({ reports: mapped })
  } catch (error) {
    console.error("GET /api/reports error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
