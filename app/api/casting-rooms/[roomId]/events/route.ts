import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// GET — list events for a casting room
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { roomId } = await params

    // Verify user is a member
    const membership = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: roomId, userId: user.id } },
    })
    if (!membership) {
      return NextResponse.json({ error: "Not a member of this room" }, { status: 403 })
    }

    const events = await prisma.roomEvent.findMany({
      where: { roomId },
      orderBy: { createdAt: "asc" },
    })

    // Fetch user details for events
    const allUserIds: string[] = []
    for (const e of events) {
      allUserIds.push(e.userId)
      if (e.targetUserId) allUserIds.push(e.targetUserId)
    }
    const uniqueUserIds = [...new Set(allUserIds)]
    const users = await prisma.user.findMany({
      where: { id: { in: uniqueUserIds } },
      include: { profile: true },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userMap = new Map<string, any>()
    for (const u of users) userMap.set(u.id, u)

    const formatUser = (u: typeof users[number]) => ({
      id: u.id,
      username: u.username,
      name: u.profile?.displayName || u.username,
      avatar: u.profile?.avatarUrl,
      role: u.role.toLowerCase(),
    })

    return NextResponse.json({
      events: events.map((e: typeof events[number]) => {
        const eventUser = userMap.get(e.userId)
        const targetUser = e.targetUserId ? userMap.get(e.targetUserId) : null
        return {
          id: e.id,
          roomId: e.roomId,
          type: e.type,
          userId: e.userId,
          user: eventUser ? formatUser(eventUser) : null,
          targetUserId: e.targetUserId,
          targetUser: targetUser ? formatUser(targetUser) : null,
          message: e.message,
          createdAt: e.createdAt,
        }
      }),
    })
  } catch (error) {
    console.error("Get room events error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST — create event in a casting room
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { roomId } = await params

    // Verify user is a member
    const membership = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: roomId, userId: user.id } },
    })
    if (!membership) {
      return NextResponse.json({ error: "Not a member of this room" }, { status: 403 })
    }

    const body = await request.json()
    const { type, targetUserId, message } = body as {
      type: string
      targetUserId?: string
      message?: string
    }

    const event = await prisma.roomEvent.create({
      data: {
        roomId,
        type,
        userId: user.id,
        targetUserId,
        message,
      },
    })

    return NextResponse.json({ event })
  } catch (error) {
    console.error("Create room event error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
