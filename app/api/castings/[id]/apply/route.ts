import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: castingId } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const casting = await prisma.casting.findUnique({
      where: { id: castingId },
      select: { id: true, createdBy: true, title: true, status: true },
    })

    if (!casting) {
      return NextResponse.json({ error: "Casting not found" }, { status: 404 })
    }

    if (casting.status !== "ACTIVE") {
      return NextResponse.json({ error: "Casting is not accepting applications" }, { status: 400 })
    }

    const existing = await prisma.submission.findUnique({
      where: { castingId_modelId: { castingId, modelId: user.id } },
    })

    if (existing) {
      return NextResponse.json({ error: "Already applied to this casting" }, { status: 409 })
    }

    const body = await request.json().catch(() => ({}))
    const note = (body?.note as string) || null

    const submission = await prisma.submission.create({
      data: {
        castingId,
        modelId: user.id,
        submittedBy: user.id,
        status: "APPLIED",
        note,
      },
    })

    await prisma.notification.create({
      data: {
        userId: casting.createdBy,
        type: "SYSTEM",
        payload: {
          type: "new_application",
          submissionId: submission.id,
          castingId,
          castingTitle: casting.title,
          modelDisplayName: user.displayName,
        },
      },
    })

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        status: submission.status.toLowerCase(),
      },
    })
  } catch (error) {
    console.error("Apply to casting error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
