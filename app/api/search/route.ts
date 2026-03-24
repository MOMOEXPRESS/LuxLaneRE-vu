import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// GET /api/search?q=sofia&type=users|castings|posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")?.trim()
    const type = searchParams.get("type") || "all"
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 50)

    if (!q || q.length < 2) {
      return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 })
    }

    const currentUser = await getCurrentUser()
    const results: Record<string, unknown[]> = {}

    // Search users
    if (type === "all" || type === "users") {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: q, mode: "insensitive" } },
            { displayName: { contains: q, mode: "insensitive" } },
          ],
        },
        include: { profile: true },
        take: limit,
      })

      results.users = users.map((u) => ({
        id: u.id,
        username: u.username,
        name: u.profile?.displayName ?? u.displayName,
        avatar: u.profile?.avatarUrl ?? u.avatarUrl ?? "/placeholder.svg",
        role: u.role.toLowerCase(),
        verified: u.profile?.verificationStatus !== "UNVERIFIED",
        bio: u.profile?.bio ?? "",
        location: u.profile?.location ?? "",
      }))
    }

    // Search castings
    if (type === "all" || type === "castings") {
      const castings = await prisma.casting.findMany({
        where: {
          status: "ACTIVE",
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { location: { contains: q, mode: "insensitive" } },
          ],
        },
        include: {
          creator: { include: { profile: true } },
          _count: { select: { submissions: true } },
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      })

      results.castings = castings.map((c) => ({
        id: c.id,
        title: c.title,
        type: c.type.toLowerCase(),
        location: c.location,
        payMin: c.payMin,
        payMax: c.payMax,
        deadline: c.deadline?.toISOString(),
        status: c.status.toLowerCase(),
        applicationsCount: c._count.submissions,
        creator: {
          id: c.creator.id,
          name: c.creator.profile?.displayName ?? c.creator.displayName,
          username: c.creator.username,
          avatar: c.creator.profile?.avatarUrl ?? "/placeholder.svg",
        },
        createdAt: c.createdAt.toISOString(),
      }))
    }

    // Search posts
    if (type === "all" || type === "posts") {
      const posts = await prisma.post.findMany({
        where: {
          caption: { contains: q, mode: "insensitive" },
        },
        include: {
          user: { include: { profile: true } },
          _count: { select: { likes: true, comments: true } },
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      })

      results.posts = posts.map((p) => ({
        id: p.id,
        imageUrl: p.imageUrl,
        caption: p.caption,
        likes: p._count.likes,
        comments: p._count.comments,
        user: {
          id: p.user.id,
          name: p.user.profile?.displayName ?? p.user.displayName,
          username: p.user.username,
          avatar: p.user.profile?.avatarUrl ?? "/placeholder.svg",
        },
        createdAt: p.createdAt.toISOString(),
      }))
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
