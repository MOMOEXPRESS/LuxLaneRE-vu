import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// GET — list messages in a casting room
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

    const membership = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: roomId, userId: user.id } },
    })
    if (!membership) {
      return NextResponse.json({ error: "Not a member of this room" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const before = searchParams.get("before")
    const limit = 50

    const messages = await prisma.message.findMany({
      where: {
        conversationId: roomId,
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      include: {
        sender: { include: { profile: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return NextResponse.json({
      messages: messages.reverse().map((m: typeof messages[number]) => ({
        id: m.id,
        userId: m.senderId,
        user: {
          id: m.sender.id,
          username: m.sender.username,
          name: m.sender.profile?.displayName || m.sender.username,
          avatar: m.sender.profile?.avatarUrl,
          role: m.sender.role.toLowerCase(),
        },
        content: m.body,
        createdAt: m.createdAt,
      })),
    })
  } catch (error) {
    console.error("Get room messages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST — send a message in the casting room
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

    const membership = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: roomId, userId: user.id } },
    })
    if (!membership) {
      return NextResponse.json({ error: "Not a member of this room" }, { status: 403 })
    }

    const body = await request.json()
    const { content } = body as { content: string }

    if (!content?.trim()) {
      return NextResponse.json({ error: "content is required" }, { status: 400 })
    }

    const message = await prisma.message.create({
      data: {
        conversationId: roomId,
        senderId: user.id,
        body: content,
      },
      include: {
        sender: { include: { profile: true } },
      },
    })

    return NextResponse.json({
      message: {
        id: message.id,
        userId: message.senderId,
        user: {
          id: message.sender.id,
          username: message.sender.username,
          name: message.sender.profile?.displayName || message.sender.username,
          avatar: message.sender.profile?.avatarUrl,
          role: message.sender.role.toLowerCase(),
        },
        content: message.body,
        createdAt: message.createdAt,
      },
    })
  } catch (error) {
    console.error("Send room message error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
