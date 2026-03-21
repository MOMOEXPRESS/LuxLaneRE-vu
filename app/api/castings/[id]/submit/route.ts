import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

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

    const casting = await prisma.casting.findUnique({
      where: { id: castingId },
      select: { id: true, createdBy: true, title: true, status: true },
    })

    if (!casting) {
      return NextResponse.json({ error: "Casting not found" }, { status: 404 })
    }

    if (casting.status !== "ACTIVE") {
      return NextResponse.json({ error: "Casting is not accepting submissions" }, { status: 400 })
    }

    const body = await request.json()
    const { modelIds, note } = body

    if (!modelIds || !Array.isArray(modelIds) || modelIds.length === 0) {
      return NextResponse.json({ error: "Model IDs are required" }, { status: 400 })
    }

    // Verify all models belong to this agency
    const models = await prisma.modelProfile.findMany({
      where: { userId: { in: modelIds }, agencyId: user.id },
      select: { userId: true },
    })

    if (models.length !== modelIds.length) {
      return NextResponse.json({ error: "Some models do not belong to your agency" }, { status: 400 })
    }

    // Create submissions for each model (skip already submitted)
    const submissions = []
    for (const modelId of modelIds) {
      const existing = await prisma.submission.findUnique({
        where: { castingId_modelId: { castingId, modelId } },
      })

      if (existing) continue

      const submission = await prisma.submission.create({
        data: {
          castingId,
          modelId,
          submittedBy: user.id,
          note: note || null,
          status: "SUBMITTED",
        },
      })
      submissions.push({ id: submission.id, modelId })
    }

    // Notify casting creator
    if (submissions.length > 0) {
      await prisma.notification.create({
        data: {
          userId: casting.createdBy,
          type: "SYSTEM",
          payload: {
            title: "New Submission",
            body: `Agency submitted ${submissions.length} model(s) to "${casting.title}"`,
            relatedId: castingId,
            relatedType: "casting",
          },
        },
      })
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
