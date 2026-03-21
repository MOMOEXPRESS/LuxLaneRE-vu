import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
// Enum values matching Prisma schema
const SubmissionStatusValues = ["APPLIED", "SUBMITTED", "SHORTLISTED", "OFFERED", "ACCEPTED", "DECLINED", "CONFIRMED", "REJECTED"] as const
type SubmissionStatus = (typeof SubmissionStatusValues)[number]

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: submissionId } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        casting: { select: { createdBy: true, title: true } },
      },
    })

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    if (submission.casting.createdBy !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const body = await request.json()
    const { status } = body

    if (!SubmissionStatusValues.includes(status.toUpperCase() as SubmissionStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const newStatus = status.toUpperCase() as SubmissionStatus

    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: newStatus },
    })

    // Create notification for the model
    let notificationType: string | null = null
    let notificationTitle = ""
    let notificationBody = ""

    if (newStatus === "SHORTLISTED") {
      notificationType = "SHORTLISTED"
      notificationTitle = "You've been shortlisted!"
      notificationBody = `You've been shortlisted for "${submission.casting.title}"`
    } else if (newStatus === "OFFERED") {
      notificationType = "OFFER"
      notificationTitle = "You received an offer!"
      notificationBody = `You've been offered a spot in "${submission.casting.title}"`
    } else if (newStatus === "REJECTED") {
      notificationType = "SYSTEM"
      notificationTitle = "Application Update"
      notificationBody = `Your application for "${submission.casting.title}" was not selected`
    }

    if (notificationType) {
      await prisma.notification.create({
        data: {
          userId: submission.modelId,
          type: notificationType,
          payload: {
            title: notificationTitle,
            body: notificationBody,
            relatedId: submissionId,
            relatedType: "submission",
          },
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update submission status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
