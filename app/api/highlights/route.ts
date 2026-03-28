import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// GET — get highlights for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    let userId = searchParams.get("userId")

    if (!userId) {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
      }
      userId = user.id
    }

    const highlights = await prisma.storyHighlight.findMany({
      where: { userId },
      include: {
        stories: {
          select: {
            id: true,
            mediaUrl: true,
            mediaType: true,
            caption: true,
            viewCount: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    })

    return NextResponse.json({
      highlights: highlights.map((h: typeof highlights[number]) => ({
        id: h.id,
        title: h.title,
        coverUrl: h.coverUrl || h.stories[0]?.mediaUrl || null,
        storyCount: h.stories.length,
        stories: h.stories,
      })),
    })
  } catch (error) {
    console.error("Highlights error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST — create a new highlight
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { title, coverUrl, storyIds } = body as {
      title: string
      coverUrl?: string
      storyIds?: string[]
    }

    if (!title) {
      return NextResponse.json({ error: "title required" }, { status: 400 })
    }

    const highlight = await prisma.storyHighlight.create({
      data: {
        userId: user.id,
        title,
        coverUrl: coverUrl || null,
      },
    })

    // Attach stories to highlight if provided
    if (storyIds?.length) {
      await prisma.story.updateMany({
        where: {
          id: { in: storyIds },
          userId: user.id,
        },
        data: { highlightId: highlight.id },
      })
    }

    return NextResponse.json(highlight, { status: 201 })
  } catch (error) {
    console.error("Create highlight error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
