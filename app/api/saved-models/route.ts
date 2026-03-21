import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// GET — list saved models (talent pool)
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const saved = await prisma.savedModel.findMany({
      where: { userId: user.id },
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

    return NextResponse.json({
      models: saved.map((s: typeof saved[number]) => ({
        id: s.model.id,
        username: s.model.username,
        name: s.model.profile?.displayName || s.model.username,
        avatar: s.model.profile?.avatarUrl,
        location: s.model.profile?.location,
        role: s.model.role.toLowerCase(),
        luxlaneScore: s.model.modelProfile?.luxlaneScore || 0,
        availability: s.model.modelProfile?.availability || "AVAILABLE",
        note: s.note,
        savedAt: s.createdAt,
      })),
    })
  } catch (error) {
    console.error("Get saved models error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST — save a model
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { modelId, note } = body as { modelId: string; note?: string }

    if (!modelId) {
      return NextResponse.json({ error: "modelId is required" }, { status: 400 })
    }

    // Verify target is a model
    const target = await prisma.user.findUnique({ where: { id: modelId } })
    if (!target || target.role !== "MODEL") {
      return NextResponse.json({ error: "Model not found" }, { status: 404 })
    }

    await prisma.savedModel.upsert({
      where: { userId_modelId: { userId: user.id, modelId } },
      create: { userId: user.id, modelId, note },
      update: { note },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Save model error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE — unsave a model
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { modelId } = body as { modelId: string }

    if (!modelId) {
      return NextResponse.json({ error: "modelId is required" }, { status: 400 })
    }

    await prisma.savedModel.deleteMany({
      where: { userId: user.id, modelId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unsave model error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
