import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// GET — casting analytics for a specific casting
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const castingId = searchParams.get("castingId")

    if (!castingId) {
      return NextResponse.json({ error: "castingId required" }, { status: 400 })
    }

    // Verify user owns this casting
    const casting = await prisma.casting.findUnique({ where: { id: castingId } })
    if (!casting) {
      return NextResponse.json({ error: "Casting not found" }, { status: 404 })
    }
    if (casting.createdBy !== user.id) {
      return NextResponse.json({ error: "Only casting creator can view analytics" }, { status: 403 })
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Total views
    const totalViews = await prisma.castingView.count({ where: { castingId } })

    // Views last 30 days
    const views30d = await prisma.castingView.count({
      where: { castingId, createdAt: { gte: thirtyDaysAgo } },
    })

    // Unique viewers
    const uniqueViewers = await prisma.castingView.groupBy({
      by: ["viewerId"],
      where: { castingId, viewerId: { not: null } },
    })

    // Daily views for chart
    const dailyViews = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
      FROM "casting_views"
      WHERE "castingId" = ${castingId}
        AND "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `

    // Submission funnel
    const totalSubmissions = await prisma.submission.count({ where: { castingId } })
    const shortlisted = await prisma.submission.count({ where: { castingId, status: "SHORTLISTED" } })
    const offered = await prisma.submission.count({ where: { castingId, status: "OFFERED" } })
    const accepted = await prisma.submission.count({ where: { castingId, status: "ACCEPTED" } })
    const confirmed = await prisma.submission.count({ where: { castingId, status: "CONFIRMED" } })
    const rejected = await prisma.submission.count({ where: { castingId, status: "REJECTED" } })
    const declined = await prisma.submission.count({ where: { castingId, status: "DECLINED" } })

    // Saved count
    const savedCount = await prisma.savedCasting.count({ where: { castingId } })

    return NextResponse.json({
      totalViews,
      views30d,
      uniqueViewers: uniqueViewers.length,
      dailyViews: dailyViews.map((d: typeof dailyViews[number]) => ({
        date: d.date,
        count: Number(d.count),
      })),
      funnel: {
        views: totalViews,
        applications: totalSubmissions,
        shortlisted,
        offered,
        accepted,
        confirmed,
        rejected,
        declined,
      },
      conversionRate: totalViews > 0 ? Math.round((totalSubmissions / totalViews) * 1000) / 10 : 0,
      savedCount,
    })
  } catch (error) {
    console.error("Casting analytics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
