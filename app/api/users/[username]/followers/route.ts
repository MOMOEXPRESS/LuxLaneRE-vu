import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/users/:username/followers?type=followers|following&limit=30&cursor=id
export async function GET(request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "followers"
    const limit = Math.min(Number(searchParams.get("limit") || 30), 100)
    const cursor = searchParams.get("cursor")

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (type === "followers") {
      const follows = await prisma.follow.findMany({
        where: { followingId: user.id },
        include: {
          follower: {
            include: { profile: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        ...(cursor
          ? {
              cursor: { followerId_followingId: { followerId: cursor, followingId: user.id } },
              skip: 1,
            }
          : {}),
      })

      const results = follows.map((f) => ({
        id: f.follower.id,
        username: f.follower.username,
        displayName: f.follower.profile?.displayName ?? f.follower.username,
        avatarUrl: f.follower.profile?.avatarUrl ?? null,
        role: f.follower.role,
      }))

      const nextCursor = results.length === limit ? results[results.length - 1]?.id : null
      return NextResponse.json({ users: results, nextCursor })
    } else {
      const follows = await prisma.follow.findMany({
        where: { followerId: user.id },
        include: {
          following: {
            include: { profile: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        ...(cursor
          ? {
              cursor: { followerId_followingId: { followerId: user.id, followingId: cursor } },
              skip: 1,
            }
          : {}),
      })

      const results = follows.map((f) => ({
        id: f.following.id,
        username: f.following.username,
        displayName: f.following.profile?.displayName ?? f.following.username,
        avatarUrl: f.following.profile?.avatarUrl ?? null,
        role: f.following.role,
      }))

      const nextCursor = results.length === limit ? results[results.length - 1]?.id : null
      return NextResponse.json({ users: results, nextCursor })
    }
  } catch (error) {
    console.error("Get follow list error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
