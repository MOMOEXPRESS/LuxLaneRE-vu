import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

const VALID_ACTIONS = ["shortlist", "reject", "offer", "invite"]

// POST — perform bulk action on submissions or invite multiple models
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id: castingId } = await params

    // Verify casting exists and user is creator
    const casting = await prisma.casting.findUnique({ where: { id: castingId } })
    if (!casting) {
      return NextResponse.json({ error: "Casting not found" }, { status: 404 })
    }
    if (casting.createdBy !== user.id) {
      return NextResponse.json({ error: "Only the casting creator can perform bulk actions" }, { status: 403 })
    }

    const body = await request.json()
    const { action, submissionIds, modelIds } = body as {
      action: string
      submissionIds?: string[]
      modelIds?: string[]
    }

    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: "Invalid action. Must be one of: " + VALID_ACTIONS.join(", ") }, { status: 400 })
    }

    let affected = 0

    if (action === "invite" && modelIds?.length) {
      // Bulk invite models to casting
      const existingSubmissions = await prisma.submission.findMany({
        where: { castingId, modelId: { in: modelIds } },
        select: { modelId: true },
      })
      const alreadySubmitted = new Set(existingSubmissions.map((s: typeof existingSubmissions[number]) => s.modelId))

      const toCreate = modelIds.filter((id: string) => !alreadySubmitted.has(id))
      if (toCreate.length > 0) {
        const result = await prisma.submission.createMany({
          data: toCreate.map((modelId: string) => ({
            castingId,
            modelId,
            submittedBy: user.id,
            status: "APPLIED",
            note: "Invited by casting creator",
          })),
        })
        affected = result.count

        // Create notifications for each invited model
        await prisma.notification.createMany({
          data: toCreate.map((modelId: string) => ({
            userId: modelId,
            type: "INVITE" as const,
            payload: {
              castingId,
              castingTitle: casting.title,
              message: `You've been invited to "${casting.title}"`,
            },
          })),
        })
      }
    } else if (submissionIds?.length) {
      // Bulk update submissions
      const statusMap: Record<string, string> = {
        shortlist: "SHORTLISTED",
        reject: "REJECTED",
        offer: "OFFERED",
      }

      const newStatus = statusMap[action]
      if (!newStatus) {
        return NextResponse.json({ error: "Invalid action for submissions" }, { status: 400 })
      }

      const result = await prisma.submission.updateMany({
        where: {
          id: { in: submissionIds },
          castingId,
        },
        data: { status: newStatus },
      })
      affected = result.count

      // Create notifications
      const submissions = await prisma.submission.findMany({
        where: { id: { in: submissionIds } },
        select: { modelId: true },
      })

      const notifType = action === "shortlist" ? "SHORTLISTED" : action === "offer" ? "OFFER" : "SYSTEM"
      const notifMessage = action === "shortlist"
        ? `You've been shortlisted for "${casting.title}"`
        : action === "offer"
          ? `You've received an offer for "${casting.title}"`
          : `Your application for "${casting.title}" was not selected`

      await prisma.notification.createMany({
        data: submissions.map((s: typeof submissions[number]) => ({
          userId: s.modelId,
          type: notifType as "SHORTLISTED" | "OFFER" | "SYSTEM",
          payload: {
            castingId,
            castingTitle: casting.title,
            message: notifMessage,
          },
        })),
      })
    } else {
      return NextResponse.json({ error: "submissionIds or modelIds required" }, { status: 400 })
    }

    return NextResponse.json({ success: true, affected })
  } catch (error) {
    console.error("Bulk action error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
