import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: conversationId } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: user.id },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this conversation" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100)
    const before = searchParams.get("before")

    const orderBy = { createdAt: "desc" as const }
    const where = { conversationId }

    const messages = before
      ? await prisma.message.findMany({
          where: { ...where, createdAt: { lt: new Date(before) } },
          orderBy,
          take: limit,
          include: { sender: { include: { profile: true } } },
        })
      : await prisma.message.findMany({
          where,
          orderBy,
          take: limit,
          include: { sender: { include: { profile: true } } },
        })

    const formatted = messages.reverse().map((m) => ({
      id: m.id,
      content: m.body,
      senderId: m.senderId,
      senderName: m.sender.profile?.displayName ?? m.sender.username,
      senderAvatar: m.sender.profile?.avatarUrl ?? null,
      attachmentUrl: m.attachmentUrl,
      createdAt: m.createdAt.toISOString(),
    }))

    return NextResponse.json({ messages: formatted })
  } catch (error) {
    console.error("Get messages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: conversationId } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: user.id },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this conversation" }, { status: 403 })
    }

    const raw = await request.json().catch(() => ({}))
    const content = (raw.content ?? raw.body) as string | undefined
    const attachmentUrl = (raw.attachmentUrl ?? raw.attachments?.[0]) as string | undefined
    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 })
    }
    const body = content.trim()

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        body,
        attachmentUrl: attachmentUrl ?? null,
      },
      include: { sender: { include: { profile: true } } },
    })

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.body,
        senderId: message.senderId,
        senderName: message.sender.profile?.displayName ?? message.sender.username,
        createdAt: message.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Send message error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
