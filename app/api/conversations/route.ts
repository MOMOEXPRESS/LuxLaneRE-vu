import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get all conversations where user is a member
    const conversations = await db`
      SELECT c.*, cm.last_read_at
      FROM conversations c
      JOIN conversation_members cm ON c.id = cm.conversation_id
      WHERE cm.user_id = ${user.id}
      ORDER BY c.last_message_at DESC NULLS LAST
    `

    // For each conversation, get the other participant(s) and last message
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv: Record<string, unknown>) => {
        // Get other members
        const members = await db`
          SELECT u.id, u.display_name, u.avatar_url, u.username
          FROM conversation_members cm
          JOIN users u ON cm.user_id = u.id
          WHERE cm.conversation_id = ${conv.id} AND cm.user_id != ${user.id}
        `

        // Get last message
        const lastMessage = await db`
          SELECT m.*, u.display_name as sender_name
          FROM messages m
          JOIN users u ON m.sender_id = u.id
          WHERE m.conversation_id = ${conv.id}
          ORDER BY m.created_at DESC
          LIMIT 1
        `

        // Get unread count
        const unreadCount = await db`
          SELECT COUNT(*) as count FROM messages 
          WHERE conversation_id = ${conv.id} 
            AND sender_id != ${user.id}
            AND created_at > COALESCE(${conv.last_read_at}, '1970-01-01')
        `

        return {
          ...conv,
          members,
          lastMessage: lastMessage[0] || null,
          unreadCount: Number(unreadCount[0]?.count || 0),
        }
      }),
    )

    return NextResponse.json({ conversations: enrichedConversations })
  } catch (error) {
    console.error("Get conversations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
