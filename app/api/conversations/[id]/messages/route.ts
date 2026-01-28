import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: conversationId } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Verify user is a member
    const membership = await db`
      SELECT id FROM conversation_members WHERE conversation_id = ${conversationId} AND user_id = ${user.id}
    `

    if (membership.length === 0) {
      return NextResponse.json({ error: "Not a member of this conversation" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get("limit")) || 50
    const before = searchParams.get("before") // cursor for pagination

    let messages
    if (before) {
      messages = await db`
        SELECT m.*, u.display_name as sender_name, u.avatar_url as sender_avatar
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ${conversationId} AND m.created_at < ${before}
        ORDER BY m.created_at DESC
        LIMIT ${limit}
      `
    } else {
      messages = await db`
        SELECT m.*, u.display_name as sender_name, u.avatar_url as sender_avatar
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ${conversationId}
        ORDER BY m.created_at DESC
        LIMIT ${limit}
      `
    }

    // Update last_read_at
    await db`
      UPDATE conversation_members SET last_read_at = NOW() 
      WHERE conversation_id = ${conversationId} AND user_id = ${user.id}
    `

    return NextResponse.json({ messages: messages.reverse() }) // Return in chronological order
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

    // Verify user is a member
    const membership = await db`
      SELECT id FROM conversation_members WHERE conversation_id = ${conversationId} AND user_id = ${user.id}
    `

    if (membership.length === 0) {
      return NextResponse.json({ error: "Not a member of this conversation" }, { status: 403 })
    }

    const body = await request.json()
    const { content, attachments } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 })
    }

    // Create message
    const messageId = uuidv4()
    await db`
      INSERT INTO messages (id, conversation_id, sender_id, content, attachments)
      VALUES (${messageId}, ${conversationId}, ${user.id}, ${content}, ${attachments || []})
    `

    // Update conversation last_message_at
    await db`
      UPDATE conversations SET last_message_at = NOW() WHERE id = ${conversationId}
    `

    // Update sender's last_read_at
    await db`
      UPDATE conversation_members SET last_read_at = NOW() 
      WHERE conversation_id = ${conversationId} AND user_id = ${user.id}
    `

    // Create notifications for other members
    const otherMembers = await db`
      SELECT user_id FROM conversation_members 
      WHERE conversation_id = ${conversationId} AND user_id != ${user.id}
    `

    for (const member of otherMembers) {
      await db`
        INSERT INTO notifications (id, user_id, type, title, body, related_id, related_type)
        VALUES (
          ${uuidv4()}, ${member.user_id}, 'new_message',
          'New Message', ${`${user.displayName}: ${content.substring(0, 50)}${content.length > 50 ? "..." : ""}`},
          ${conversationId}, 'conversation'
        )
      `
    }

    return NextResponse.json({
      success: true,
      message: {
        id: messageId,
        content,
        senderId: user.id,
        senderName: user.displayName,
        createdAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Send message error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
