import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// GET — list applications for this agency (both received and sent invites)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    if (user.role !== "agency") {
      return NextResponse.json({ error: "Only agencies can view applications" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "PENDING"

    const applications = await prisma.agencyApplication.findMany({
      where: {
        agencyId: user.id,
        ...(status !== "all" ? { status: status.toUpperCase() } : {}),
      },
      include: {
        model: {
          include: {
            profile: true,
            modelProfile: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const result = applications.map((a) => ({
      id: a.id,
      modelId: a.modelId,
      status: a.status,
      note: a.note,
      createdAt: a.createdAt,
      modelName: a.model.profile?.displayName ?? a.model.username,
      modelAvatar: a.model.profile?.avatarUrl ?? null,
      modelUsername: a.model.username,
      modelLocation: a.model.profile?.location ?? null,
      modelHeightCm: a.model.modelProfile?.heightCm ?? null,
    }))

    return NextResponse.json({ applications: result })
  } catch (error) {
    console.error("Agency applications error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST — model applies to join an agency
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    if (user.role !== "model") {
      return NextResponse.json({ error: "Only models can apply to agencies" }, { status: 403 })
    }

    const { agencyId, note } = await request.json()
    if (!agencyId) {
      return NextResponse.json({ error: "agencyId is required" }, { status: 400 })
    }

    // Check agency exists
    const agency = await prisma.user.findUnique({
      where: { id: agencyId },
      select: { role: true },
    })
    if (!agency || agency.role !== "AGENCY") {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 })
    }

    // Check if already in an agency
    const modelProfile = await prisma.modelProfile.findUnique({
      where: { userId: user.id },
    })
    if (modelProfile?.agencyId) {
      return NextResponse.json({ error: "You are already in an agency" }, { status: 409 })
    }

    const application = await prisma.agencyApplication.upsert({
      where: { modelId_agencyId: { modelId: user.id, agencyId } },
      create: {
        modelId: user.id,
        agencyId,
        status: "PENDING",
        note: note || null,
      },
      update: {
        status: "PENDING",
        note: note || null,
      },
    })

    // Notify agency
    await prisma.notification.create({
      data: {
        userId: agencyId,
        type: "SYSTEM",
        payload: {
          title: "New Roster Application",
          message: `${user.displayName || user.username} has applied to join your roster`,
          relatedId: application.id,
          relatedType: "agency_application",
        },
      },
    })

    return NextResponse.json({ success: true, application: { id: application.id } })
  } catch (error) {
    console.error("Agency application error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
