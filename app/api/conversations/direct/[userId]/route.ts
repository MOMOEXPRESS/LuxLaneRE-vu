import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"

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

    // Check if direct conversation already exists
    const existing = await db`
      SELECT c.id FROM conversations c
      WHERE c.type = 'direct'
        AND EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = c.id AND user_id = ${user.id})
        AND EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = c.id AND user_id = ${otherUserId})
    `

    if (existing.length > 0) {
      return NextResponse.json({ conversationId: existing[0].id })
    }

    // Create new conversation
    const conversationId = uuidv4()
    await db`
      INSERT INTO conversations (id, type) VALUES (${conversationId}, 'direct')
    `

    // Add members
    await db`
      INSERT INTO conversation_members (id, conversation_id, user_id)
      VALUES 
        (${uuidv4()}, ${conversationId}, ${user.id}),
        (${uuidv4()}, ${conversationId}, ${otherUserId})
    `

    return NextResponse.json({ conversationId })
  } catch (error) {
    console.error("Create direct conversation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
