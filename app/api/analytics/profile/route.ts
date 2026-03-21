import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// GET — profile analytics for the current user (or a specific profile)
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get("profileId") || user.id

    // Only allow viewing own analytics unless admin
    if (profileId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Can only view own analytics" }, { status: 403 })
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Total views
    const totalViews = await prisma.profileView.count({
      where: { profileId },
    })

    // Views last 30 days
    const views30d = await prisma.profileView.count({
      where: { profileId, createdAt: { gte: thirtyDaysAgo } },
    })

    // Views last 7 days
    const views7d = await prisma.profileView.count({
      where: { profileId, createdAt: { gte: sevenDaysAgo } },
    })

    // Unique viewers last 30 days
    const uniqueViewers30d = await prisma.profileView.groupBy({
      by: ["viewerId"],
      where: { profileId, createdAt: { gte: thirtyDaysAgo }, viewerId: { not: null } },
    })

    // Views by source
    const viewsBySource = await prisma.profileView.groupBy({
      by: ["source"],
      where: { profileId, createdAt: { gte: thirtyDaysAgo } },
      _count: true,
    })

    // Daily views for chart (last 30 days)
    const dailyViews = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
      FROM "profile_views"
      WHERE "profileId" = ${profileId}
        AND "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `

    // Follower count
    const followers = await prisma.follow.count({ where: { followingId: profileId } })
    const following = await prisma.follow.count({ where: { followerId: profileId } })

    // Post engagement
    const posts = await prisma.post.count({ where: { userId: profileId } })
    const totalLikes = await prisma.postLike.count({
      where: { post: { userId: profileId } },
    })
    const totalComments = await prisma.comment.count({
      where: { post: { userId: profileId } },
    })

    return NextResponse.json({
      totalViews,
      views30d,
      views7d,
      uniqueViewers30d: uniqueViewers30d.length,
      viewsBySource: viewsBySource.map((v: typeof viewsBySource[number]) => ({
        source: v.source || "direct",
        count: v._count,
      })),
      dailyViews: dailyViews.map((d: typeof dailyViews[number]) => ({
        date: d.date,
        count: Number(d.count),
      })),
      followers,
      following,
      posts,
      totalLikes,
      totalComments,
      engagementRate: posts > 0 ? Math.round(((totalLikes + totalComments) / posts) * 10) / 10 : 0,
    })
  } catch (error) {
    console.error("Profile analytics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
