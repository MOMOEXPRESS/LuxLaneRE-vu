import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: castingId } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (user.role !== "model") {
      return NextResponse.json({ error: "Only models can apply to castings" }, { status: 403 })
    }

    // Check casting exists and is active
    const casting = await db`
      SELECT id, creator_id, title, status FROM castings WHERE id = ${castingId}
    `

    if (casting.length === 0) {
      return NextResponse.json({ error: "Casting not found" }, { status: 404 })
    }

    if (casting[0].status !== "active") {
      return NextResponse.json({ error: "Casting is not accepting applications" }, { status: 400 })
    }

    // Check if already applied
    const existing = await db`
      SELECT id FROM submissions WHERE casting_id = ${castingId} AND model_id = ${user.id}
    `

    if (existing.length > 0) {
      return NextResponse.json({ error: "Already applied to this casting" }, { status: 409 })
    }

    const body = await request.json()
    const { note, portfolioIds } = body

    // Create submission
    const submissionId = uuidv4()
    await db`
      INSERT INTO submissions (id, casting_id, model_id, submitted_by_id, note, portfolio_ids, status)
      VALUES (${submissionId}, ${castingId}, ${user.id}, ${user.id}, ${note || null}, ${portfolioIds || []}, 'applied')
    `

    // Create notification for casting creator
    await db`
      INSERT INTO notifications (id, user_id, type, title, body, related_id, related_type)
      VALUES (
        ${uuidv4()}, ${casting[0].creator_id}, 'new_application',
        'New Application', ${`${user.displayName} applied to "${casting[0].title}"`},
        ${submissionId}, 'submission'
      )
    `

    return NextResponse.json({
      success: true,
      submission: { id: submissionId, status: "applied" },
    })
  } catch (error) {
    console.error("Apply to casting error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
