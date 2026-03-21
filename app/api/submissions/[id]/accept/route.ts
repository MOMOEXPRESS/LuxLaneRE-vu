import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    if (submission.modelId !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    if (submission.status !== "OFFERED") {
      return NextResponse.json({ error: "Can only accept offers" }, { status: 400 })
    }

    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "ACCEPTED" },
    })

    await prisma.notification.create({
      data: {
        userId: submission.casting.createdBy,
        type: "CONFIRMED",
        payload: {
          title: "Offer Accepted",
          body: `${user.displayName} accepted your offer for "${submission.casting.title}"`,
          relatedId: submissionId,
          relatedType: "submission",
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Accept offer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
