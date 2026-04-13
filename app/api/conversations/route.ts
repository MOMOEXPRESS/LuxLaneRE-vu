import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get blocked users to exclude from conversations
    const blocks = await prisma.block.findMany({
      where: { OR: [{ blockerId: user.id }, { blockedId: user.id }] },
      select: { blockerId: true, blockedId: true },
    })
    const blockedIds = new Set(blocks.map((b: { blockerId: string; blockedId: string }) => b.blockerId === user.id ? b.blockedId : b.blockerId))

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

        // For casting rooms, fetch casting title
        let castingTitle: string | null = null
        if (conv.type === "casting_room" && conv.castingId) {
          const casting = await prisma.casting.findUnique({
            where: { id: conv.castingId },
            select: { title: true },
          })
          castingTitle = casting?.title || null
        }

        return {
          id: conv.id,
          type: conv.type,
          castingId: conv.castingId,
          castingTitle,
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

    // Filter out conversations with blocked users
    const filtered = enrichedConversations.filter((conv) =>
      !conv.members.some((m: { id: string }) => blockedIds.has(m.id))
    )

    return NextResponse.json({ conversations: filtered })
  } catch (error) {
    console.error("Get conversations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
