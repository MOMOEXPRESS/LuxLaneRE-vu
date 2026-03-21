import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// DELETE — delete a story
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
    const story = await prisma.story.findUnique({ where: { id } })

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 })
    }
    if (story.userId !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    await prisma.story.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete story error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
