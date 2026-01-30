import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const memberships = await prisma.conversationMember.findMany({
      where: { userId: user.id },
      include: { conversation: true },
      orderBy: { joinedAt: "desc" },
    })

    const enrichedConversations = await Promise.all(
      memberships.map(async (mem) => {
        const conv = mem.conversation
        const otherMemberIds = await prisma.conversationMember.findMany({
          where: { conversationId: conv.id, userId: { not: user.id } },
          select: { userId: true },
        })
        const otherUsers = await prisma.user.findMany({
          where: { id: { in: otherMemberIds.map((m) => m.userId) } },
          include: { profile: true },
        })
        const lastMessage = await prisma.message.findFirst({
          where: { conversationId: conv.id },
          orderBy: { createdAt: "desc" },
          include: { sender: { include: { profile: true } } },
        })

        const members = otherUsers.map((u) => ({
          id: u.id,
          displayName: u.profile?.displayName ?? u.username,
          avatarUrl: u.profile?.avatarUrl ?? null,
          username: u.username,
        }))

        return {
          id: conv.id,
          type: conv.type,
          castingId: conv.castingId,
          createdAt: conv.createdAt.toISOString(),
          members,
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                content: lastMessage.body,
                senderId: lastMessage.senderId,
                senderName: lastMessage.sender.profile?.displayName ?? lastMessage.sender.username,
                createdAt: lastMessage.createdAt.toISOString(),
              }
            : null,
          unreadCount: 0,
        }
      }),
    )

    return NextResponse.json({ conversations: enrichedConversations })
  } catch (error) {
    console.error("Get conversations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
