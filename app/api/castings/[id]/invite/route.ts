import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

/**
 * POST /api/castings/[id]/invite
 * Brand or agency invites a model to the casting (creates a submission on behalf of the model).
 * Body: { modelId: string }
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: castingId } = await params
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const isBrand = currentUser.role === "brand"
    const isAgency = currentUser.role === "agency"
    const casting = await prisma.casting.findUnique({
      where: { id: castingId },
      select: { id: true, createdBy: true, title: true, status: true },
    })

    if (!casting) {
      return NextResponse.json({ error: "Casting not found" }, { status: 404 })
    }

    const isCreator = casting.createdBy === currentUser.id
    if (!isBrand && !isAgency && !isCreator) {
      return NextResponse.json({ error: "Only brand, agency, or casting creator can invite models" }, { status: 403 })
    }

    if (casting.status !== "ACTIVE") {
      return NextResponse.json({ error: "Casting is not accepting submissions" }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const modelId = body?.modelId as string
    if (!modelId || typeof modelId !== "string") {
      return NextResponse.json({ error: "modelId is required" }, { status: 400 })
    }

    const model = await prisma.user.findUnique({
      where: { id: modelId },
      include: { profile: true, modelProfile: true },
    })
    if (!model || model.role !== "MODEL") {
      return NextResponse.json({ error: "Model not found" }, { status: 404 })
    }

    // If agency: only allow inviting models from their roster (optional rule)
    if (isAgency && model.modelProfile?.agencyId && model.modelProfile.agencyId !== currentUser.id) {
      // Still allow – agency can propose any model; or restrict: return 403
      // We allow so agencies can propose to brand castings.
    }

    const existing = await prisma.submission.findUnique({
      where: { castingId_modelId: { castingId, modelId } },
    })
    if (existing) {
      return NextResponse.json({ error: "Model already has a submission for this casting" }, { status: 409 })
    }

    const submission = await prisma.submission.create({
      data: {
        castingId,
        modelId,
        submittedBy: currentUser.id,
        status: "SUBMITTED",
        note: isAgency ? "Proposed by agency" : isBrand || isCreator ? "Invited by brand" : null,
      },
    })

    await prisma.notification.create({
      data: {
        userId: modelId,
        type: "INVITE",
        payload: {
          type: "casting_invite",
          submissionId: submission.id,
          castingId,
          castingTitle: casting.title,
          invitedBy: currentUser.displayName ?? currentUser.username,
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
    console.error("Invite to casting error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
