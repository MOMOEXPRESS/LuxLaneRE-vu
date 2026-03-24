import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 50)
    const cursor = searchParams.get("cursor")
    const feed = searchParams.get("feed") // "following" or null (all)

    // Build where clause — filter by followed users if feed=following
    let where: Record<string, unknown> = {}
    if (feed === "following" && currentUser) {
      const follows = await prisma.follow.findMany({
        where: { followerId: currentUser.id },
        select: { followingId: true },
      })
      const followedIds = follows.map((f: { followingId: string }) => f.followingId)
      // Include own posts + followed users
      where = { userId: { in: [currentUser.id, ...followedIds] } }
    }

    const posts = await prisma.post.findMany({
      where,
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: "desc" },
      include: {
        user: { include: { profile: true } },
        _count: { select: { likes: true, comments: true } },
      },
    })

    const hasMore = posts.length > limit
    const list = hasMore ? posts.slice(0, limit) : posts
    const nextCursor = hasMore ? list[list.length - 1].id : null

    const currentUserId = currentUser?.id
    const postIds = list.map((p) => p.id)

    const [likedSet, savedSet] =
      currentUserId && postIds.length > 0
        ? await Promise.all([
            prisma.postLike.findMany({
              where: { postId: { in: postIds }, userId: currentUserId },
              select: { postId: true },
            }),
            prisma.postSave.findMany({
              where: { postId: { in: postIds }, userId: currentUserId },
              select: { postId: true },
            }),
          ])
        : [[], []]

    const likedIds = new Set(likedSet.map((l) => l.postId))
    const savedIds = new Set(savedSet.map((s) => s.postId))

    const withMeta = list.map((post) => ({
      id: post.id,
      userId: post.userId,
      user: {
        id: post.user.id,
        name: post.user.profile?.displayName ?? post.user.username,
        username: post.user.username,
        avatar: post.user.profile?.avatarUrl ?? "/placeholder.svg",
        verified: post.user.profile?.verificationStatus !== "UNVERIFIED",
      },
      imageUrl: post.imageUrl,
      caption: post.caption,
      likes: post._count.likes,
      comments: post._count.comments,
      likedByMe: likedIds.has(post.id),
      savedByMe: savedIds.has(post.id),
      createdAt: post.createdAt.toISOString(),
    }))

    return NextResponse.json({ posts: withMeta, nextCursor })
  } catch (error) {
    console.error("Get posts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const imageUrl = body.imageUrl as string | undefined
    const caption = (body.caption as string | undefined)?.trim() ?? null

    if (!imageUrl?.trim()) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 })
    }

    const post = await prisma.post.create({
      data: {
        userId: user.id,
        imageUrl: imageUrl.trim(),
        caption,
      },
      include: {
        user: { include: { profile: true } },
        _count: { select: { likes: true, comments: true } },
      },
    })

    return NextResponse.json({
      post: {
        id: post.id,
        userId: post.userId,
        user: {
          id: post.user.id,
          name: post.user.profile?.displayName ?? post.user.username,
          username: post.user.username,
          avatar: post.user.profile?.avatarUrl ?? "/placeholder.svg",
          verified: post.user.profile?.verificationStatus !== "UNVERIFIED",
        },
        imageUrl: post.imageUrl,
        caption: post.caption,
        likes: post._count.likes,
        comments: post._count.comments,
        likedByMe: false,
        savedByMe: false,
        createdAt: post.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Create post error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
