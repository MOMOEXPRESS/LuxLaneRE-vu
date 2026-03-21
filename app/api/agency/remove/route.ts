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
      return NextResponse.json({ error: "Only agencies can remove models" }, { status: 403 })
    }

    const { modelId } = await request.json()
    if (!modelId) {
      return NextResponse.json({ error: "modelId is required" }, { status: 400 })
    }

    // Verify model is in this agency's roster
    const modelProfile = await prisma.modelProfile.findUnique({
      where: { userId: modelId },
    })

    if (!modelProfile || modelProfile.agencyId !== user.id) {
      return NextResponse.json({ error: "Model is not in your roster" }, { status: 404 })
    }

    // Remove from roster
    await prisma.modelProfile.update({
      where: { userId: modelId },
      data: { agencyId: null },
    })

    // Clean up any application record
    await prisma.agencyApplication.deleteMany({
      where: { modelId, agencyId: user.id },
    })

    // Notify model
    await prisma.notification.create({
      data: {
        userId: modelId,
        type: "SYSTEM",
        payload: {
          title: "Roster Update",
          body: "You have been removed from an agency roster",
          relatedType: "agency_roster",
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Agency remove error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
