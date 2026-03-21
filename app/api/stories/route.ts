import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// GET — get stories feed (active stories from followed users) or a specific user's stories
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const now = new Date()

    if (userId) {
      // Get stories for a specific user
      const stories = await prisma.story.findMany({
        where: {
          userId,
          expiresAt: { gt: now },
        },
        include: {
          views: { where: { viewerId: user.id }, select: { viewedAt: true } },
        },
        orderBy: { createdAt: "asc" },
      })

      return NextResponse.json({
        stories: stories.map((s: typeof stories[number]) => ({
          id: s.id,
          mediaUrl: s.mediaUrl,
          mediaType: s.mediaType,
          caption: s.caption,
          viewCount: s.viewCount,
          viewed: s.views.length > 0,
          createdAt: s.createdAt,
          expiresAt: s.expiresAt,
        })),
      })
    }

    // Get story feed — users who have active stories
    const followedIds = await prisma.follow.findMany({
      where: { followerId: user.id },
      select: { followingId: true },
    })
    const followingIds = followedIds.map((f: typeof followedIds[number]) => f.followingId)

    // Include own stories
    const userIds = [user.id, ...followingIds]

    const usersWithStories = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        stories: { some: { expiresAt: { gt: now } } },
      },
      select: {
        id: true,
        username: true,
        profile: { select: { displayName: true, avatarUrl: true } },
        stories: {
          where: { expiresAt: { gt: now } },
          select: {
            id: true,
            mediaUrl: true,
            mediaType: true,
            caption: true,
            viewCount: true,
            createdAt: true,
            expiresAt: true,
            views: { where: { viewerId: user.id }, select: { viewedAt: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    })

    // Sort: own stories first, then unviewed, then viewed
    const storyFeed = usersWithStories
      .map((u: typeof usersWithStories[number]) => ({
        userId: u.id,
        username: u.username,
        name: u.profile?.displayName || u.username,
        avatar: u.profile?.avatarUrl || null,
        isOwn: u.id === user.id,
        hasUnviewed: u.stories.some((s) => s.views.length === 0),
        stories: u.stories.map((s) => ({
          id: s.id,
          mediaUrl: s.mediaUrl,
          mediaType: s.mediaType,
          caption: s.caption,
          viewCount: s.viewCount,
          viewed: s.views.length > 0,
          createdAt: s.createdAt,
          expiresAt: s.expiresAt,
        })),
      }))
      .sort((a, b) => {
        if (a.isOwn) return -1
        if (b.isOwn) return 1
        if (a.hasUnviewed && !b.hasUnviewed) return -1
        if (!a.hasUnviewed && b.hasUnviewed) return 1
        return 0
      })

    return NextResponse.json({ feed: storyFeed })
  } catch (error) {
    console.error("Stories feed error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST — create a new story
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { mediaUrl, mediaType, caption } = body as {
      mediaUrl: string
      mediaType?: string
      caption?: string
    }

    if (!mediaUrl) {
      return NextResponse.json({ error: "mediaUrl required" }, { status: 400 })
    }

    // Stories expire after 24 hours
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const story = await prisma.story.create({
      data: {
        userId: user.id,
        mediaUrl,
        mediaType: mediaType || "image",
        caption: caption || null,
        expiresAt,
      },
    })

    return NextResponse.json(story, { status: 201 })
  } catch (error) {
    console.error("Create story error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
