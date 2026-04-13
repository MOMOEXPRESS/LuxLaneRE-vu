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
    } else if (newStatus === "CONFIRMED") {
      notificationType = "CONFIRMED"
      notificationTitle = "You're confirmed!"
      notificationBody = `Your booking for "${submission.casting.title}" has been confirmed`

      // Auto-add model to casting room (uses Conversation model with type "casting_room")
      try {
        let room = await prisma.conversation.findFirst({
          where: { type: "casting_room", castingId: submission.castingId },
        })
        if (!room) {
          room = await prisma.conversation.create({
            data: {
              type: "casting_room",
              castingId: submission.castingId,
              status: "active",
              members: { create: { userId: submission.casting.createdBy } },
            },
          })
        }
        // Add model as member (skip if already member)
        const existingMember = await prisma.conversationMember.findFirst({
          where: { conversationId: room.id, userId: submission.modelId },
        })
        if (!existingMember) {
          await prisma.conversationMember.create({
            data: { conversationId: room.id, userId: submission.modelId },
          })
          // Create timeline event
          await prisma.roomEvent.create({
            data: {
              conversationId: room.id,
              type: "member_added",
              userId: user.id,
              targetUserId: submission.modelId,
              message: `Booking confirmed — added to casting room`,
            },
          })
        }
      } catch (roomError) {
        console.error("Failed to add model to casting room:", roomError)
      }
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
            message: notificationBody,
            castingId: submission.castingId,
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
