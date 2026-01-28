import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"

// Agency submits models to a casting
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: castingId } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (user.role !== "agency") {
      return NextResponse.json({ error: "Only agencies can submit models" }, { status: 403 })
    }

    // Check casting exists and is active
    const casting = await db`
      SELECT id, creator_id, title, status FROM castings WHERE id = ${castingId}
    `

    if (casting.length === 0) {
      return NextResponse.json({ error: "Casting not found" }, { status: 404 })
    }

    if (casting[0].status !== "active") {
      return NextResponse.json({ error: "Casting is not accepting submissions" }, { status: 400 })
    }

    const body = await request.json()
    const { modelIds, note } = body

    if (!modelIds || !Array.isArray(modelIds) || modelIds.length === 0) {
      return NextResponse.json({ error: "Model IDs are required" }, { status: 400 })
    }

    // Verify all models belong to this agency
    const models = await db`
      SELECT user_id FROM model_profiles WHERE user_id = ANY(${modelIds}) AND agency_id = ${user.id}
    `

    if (models.length !== modelIds.length) {
      return NextResponse.json({ error: "Some models do not belong to your agency" }, { status: 400 })
    }

    // Create submissions for each model
    const submissions = []
    for (const modelId of modelIds) {
      // Check if already submitted
      const existing = await db`
        SELECT id FROM submissions WHERE casting_id = ${castingId} AND model_id = ${modelId}
      `

      if (existing.length > 0) continue // Skip already submitted

      const submissionId = uuidv4()
      await db`
        INSERT INTO submissions (id, casting_id, model_id, submitted_by_id, note, status)
        VALUES (${submissionId}, ${castingId}, ${modelId}, ${user.id}, ${note || null}, 'submitted')
      `
      submissions.push({ id: submissionId, modelId })
    }

    // Create notification for casting creator
    if (submissions.length > 0) {
      await db`
        INSERT INTO notifications (id, user_id, type, title, body, related_id, related_type)
        VALUES (
          ${uuidv4()}, ${casting[0].creator_id}, 'new_submission',
          'New Submission', ${`Agency submitted ${submissions.length} model(s) to "${casting[0].title}"`},
          ${castingId}, 'casting'
        )
      `
    }

    return NextResponse.json({
      success: true,
      submissionsCreated: submissions.length,
    })
  } catch (error) {
    console.error("Submit models error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
