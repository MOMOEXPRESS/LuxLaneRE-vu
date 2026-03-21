import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    if (user.role !== "agency") {
      return NextResponse.json({ error: "Only agencies can invite models" }, { status: 403 })
    }

    const { modelId, note } = await request.json()
    if (!modelId) {
      return NextResponse.json({ error: "modelId is required" }, { status: 400 })
    }

    // Verify model exists and is a model
    const model = await prisma.user.findUnique({
      where: { id: modelId },
      select: { id: true, role: true, modelProfile: { select: { agencyId: true } } },
    })

    if (!model || model.role !== "MODEL") {
      return NextResponse.json({ error: "Model not found" }, { status: 404 })
    }

    if (model.modelProfile?.agencyId === user.id) {
      return NextResponse.json({ error: "Model is already in your roster" }, { status: 409 })
    }

    // Create or update application
    const application = await prisma.agencyApplication.upsert({
      where: { modelId_agencyId: { modelId, agencyId: user.id } },
      create: {
        modelId,
        agencyId: user.id,
        status: "INVITED",
        note: note || null,
      },
      update: {
        status: "INVITED",
        note: note || null,
      },
    })

    // Send notification to model
    await prisma.notification.create({
      data: {
        userId: modelId,
        type: "INVITE",
        payload: {
          title: "Agency Invitation",
          body: `An agency has invited you to join their roster`,
          relatedId: application.id,
          relatedType: "agency_application",
        },
      },
    })

    return NextResponse.json({ success: true, application: { id: application.id } })
  } catch (error) {
    console.error("Agency invite error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
