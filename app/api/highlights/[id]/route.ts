import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// PATCH — update a highlight (add/remove stories, rename)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params
    const highlight = await prisma.storyHighlight.findUnique({ where: { id } })

    if (!highlight) {
      return NextResponse.json({ error: "Highlight not found" }, { status: 404 })
    }
    if (highlight.userId !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const body = await request.json()
    const { title, coverUrl, addStoryIds, removeStoryIds } = body as {
      title?: string
      coverUrl?: string
      addStoryIds?: string[]
      removeStoryIds?: string[]
    }

    // Update highlight metadata
    if (title || coverUrl !== undefined) {
      await prisma.storyHighlight.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(coverUrl !== undefined && { coverUrl }),
        },
      })
    }

    // Add stories
    if (addStoryIds?.length) {
      await prisma.story.updateMany({
        where: { id: { in: addStoryIds }, userId: user.id },
        data: { highlightId: id },
      })
    }

    // Remove stories
    if (removeStoryIds?.length) {
      await prisma.story.updateMany({
        where: { id: { in: removeStoryIds }, highlightId: id },
        data: { highlightId: null },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update highlight error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE — delete a highlight
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params
    const highlight = await prisma.storyHighlight.findUnique({ where: { id } })

    if (!highlight) {
      return NextResponse.json({ error: "Highlight not found" }, { status: 404 })
    }
    if (highlight.userId !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    // Detach stories first
    await prisma.story.updateMany({
      where: { highlightId: id },
      data: { highlightId: null },
    })

    await prisma.storyHighlight.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete highlight error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
