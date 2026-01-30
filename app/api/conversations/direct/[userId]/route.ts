import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId: otherUserId } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (user.id === otherUserId) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 })
    }

    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
    })
    if (!otherUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const directConvs = await prisma.conversation.findMany({
      where: {
        type: "direct",
        members: { some: { userId: user.id } },
      },
      include: { members: { select: { userId: true } } },
    })
    const existing = directConvs.find(
      (c) => c.members.length === 2 && c.members.some((m) => m.userId === otherUserId),
    )

    if (existing) {
      return NextResponse.json({ conversationId: existing.id })
    }

    const conv = await prisma.conversation.create({
      data: {
        type: "direct",
        members: {
          create: [
            { userId: user.id },
            { userId: otherUserId },
          ],
        },
      },
    })

    return NextResponse.json({ conversationId: conv.id })
  } catch (error) {
    console.error("Create direct conversation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
