import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: submissionId } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get submission
    const submission = await db`
      SELECT s.*, c.creator_id, c.title as casting_title
      FROM submissions s
      JOIN castings c ON s.casting_id = c.id
      WHERE s.id = ${submissionId}
    `

    if (submission.length === 0) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // Verify user is the model
    if (submission[0].model_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    // Can only decline if status is 'offered'
    if (submission[0].status !== "offered") {
      return NextResponse.json({ error: "Can only decline offers" }, { status: 400 })
    }

    await db`
      UPDATE submissions SET status = 'declined', updated_at = NOW() WHERE id = ${submissionId}
    `

    // Notify casting creator
    await db`
      INSERT INTO notifications (id, user_id, type, title, body, related_id, related_type)
      VALUES (
        ${uuidv4()}, ${submission[0].creator_id}, 'offer_declined',
        'Offer Declined', ${`${user.displayName} declined your offer for "${submission[0].casting_title}"`},
        ${submissionId}, 'submission'
      )
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Decline offer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
