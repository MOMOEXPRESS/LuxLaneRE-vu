import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// GET /api/users/suggestions — suggest users to follow based on mutual follows, role, activity
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get who I already follow
    const myFollows = await prisma.follow.findMany({
      where: { followerId: user.id },
      select: { followingId: true },
    })
    const followedIds = new Set(myFollows.map((f: { followingId: string }) => f.followingId))
    followedIds.add(user.id) // exclude self

    // Get blocked users
    const blocks = await prisma.block.findMany({
      where: { OR: [{ blockerId: user.id }, { blockedId: user.id }] },
      select: { blockerId: true, blockedId: true },
    })
    for (const b of blocks) {
      followedIds.add(b.blockerId === user.id ? b.blockedId : b.blockerId)
    }

    // Strategy 1: Mutual follows — people followed by people I follow
    const mutualCandidates = await prisma.follow.findMany({
      where: {
        followerId: { in: [...myFollows.map((f: { followingId: string }) => f.followingId)] },
        followingId: { notIn: [...followedIds] },
      },
      select: { followingId: true },
    })

    const mutualCounts = new Map<string, number>()
    for (const m of mutualCandidates) {
      mutualCounts.set(m.followingId, (mutualCounts.get(m.followingId) || 0) + 1)
    }

    // Strategy 2: Same role users (models follow models, brands follow brands)
    const roleUpper = user.role.toUpperCase()
    const sameRoleUsers = await prisma.user.findMany({
      where: {
        role: roleUpper as any,
        id: { notIn: [...followedIds] },
      },
      include: { profile: true, _count: { select: { followers: true } } },
      take: 20,
      orderBy: { followers: { _count: "desc" } },
    })

    // Strategy 3: Complementary roles (models → brands/agencies, brands → models)
    const complementaryRoles = roleUpper === "MODEL"
      ? ["BRAND", "AGENCY"]
      : roleUpper === "BRAND" || roleUpper === "CLIENT"
        ? ["MODEL"]
        : ["MODEL", "BRAND"]

    const complementaryUsers = await prisma.user.findMany({
      where: {
        role: { in: complementaryRoles as any[] },
        id: { notIn: [...followedIds] },
      },
      include: { profile: true, _count: { select: { followers: true } } },
      take: 20,
      orderBy: { followers: { _count: "desc" } },
    })

    // Merge and score
    const allCandidates = new Map<string, { user: any; score: number }>()

    for (const u of [...sameRoleUsers, ...complementaryUsers]) {
      const mutualScore = (mutualCounts.get(u.id) || 0) * 10
      const followerScore = Math.min(u._count.followers, 50) // cap at 50
      const isVerified = u.profile?.verificationStatus !== "UNVERIFIED" ? 5 : 0

      allCandidates.set(u.id, {
        user: {
          id: u.id,
          username: u.username,
          name: u.profile?.displayName ?? u.displayName,
          avatar: u.profile?.avatarUrl ?? u.avatarUrl ?? "/placeholder.svg",
          role: u.role.toLowerCase(),
          verified: u.profile?.verificationStatus !== "UNVERIFIED",
          bio: u.profile?.bio ?? "",
          location: u.profile?.location ?? "",
          followers: u._count.followers,
          mutualFollows: mutualCounts.get(u.id) || 0,
        },
        score: mutualScore + followerScore + isVerified,
      })
    }

    // Sort by score descending, return top 15
    const suggestions = [...allCandidates.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)
      .map((s) => s.user)

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("Suggestions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
