import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: submissionId } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get submission with casting info
    const submission = await db`
      SELECT s.*, c.creator_id, c.title as casting_title
      FROM submissions s
      JOIN castings c ON s.casting_id = c.id
      WHERE s.id = ${submissionId}
    `

    if (submission.length === 0) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // Verify user is the casting creator
    if (submission[0].creator_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const body = await request.json()
    const { status } = body

    const validStatuses = [
      "applied",
      "submitted",
      "shortlisted",
      "offered",
      "accepted",
      "declined",
      "confirmed",
      "rejected",
    ]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    await db`
      UPDATE submissions SET status = ${status}, updated_at = NOW() WHERE id = ${submissionId}
    `

    // Create notification for the model
    let notificationTitle = ""
    let notificationBody = ""
    let notificationType = ""

    if (status === "shortlisted") {
      notificationType = "shortlisted"
      notificationTitle = "You've been shortlisted!"
      notificationBody = `You've been shortlisted for "${submission[0].casting_title}"`
    } else if (status === "offered") {
      notificationType = "offer_received"
      notificationTitle = "You received an offer!"
      notificationBody = `You've been offered a spot in "${submission[0].casting_title}"`
    } else if (status === "rejected") {
      notificationType = "application_update"
      notificationTitle = "Application Update"
      notificationBody = `Your application for "${submission[0].casting_title}" was not selected`
    }

    if (notificationType) {
      await db`
        INSERT INTO notifications (id, user_id, type, title, body, related_id, related_type)
        VALUES (
          ${uuidv4()}, ${submission[0].model_id}, ${notificationType},
          ${notificationTitle}, ${notificationBody},
          ${submissionId}, 'submission'
        )
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update submission status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
