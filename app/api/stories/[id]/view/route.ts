import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// POST — mark a story as viewed
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params
    const story = await prisma.story.findUnique({ where: { id } })

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 })
    }

    // Don't track self-views
    if (story.userId === user.id) {
      return NextResponse.json({ viewed: false })
    }

    // Upsert view (idempotent)
    await prisma.storyView.upsert({
      where: {
        storyId_viewerId: { storyId: id, viewerId: user.id },
      },
      create: { storyId: id, viewerId: user.id },
      update: {},
    })

    // Increment view count
    await prisma.story.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    return NextResponse.json({ viewed: true })
  } catch (error) {
    console.error("View story error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
