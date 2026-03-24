import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// GET /api/endorsements?userId= — get endorsements for a model
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const user = await getCurrentUser()

    const targetId = userId || user?.id
    if (!targetId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 })
    }

    const endorsements = await prisma.endorsement.findMany({
      where: { modelId: targetId },
      include: { endorser: { include: { profile: true } } },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      endorsements: endorsements.map((e) => ({
        id: e.id,
        text: e.text,
        tags: e.tags,
        endorser: {
          id: e.endorser.id,
          name: e.endorser.profile?.displayName ?? e.endorser.displayName,
          username: e.endorser.username,
          avatar: e.endorser.profile?.avatarUrl ?? "/placeholder.svg",
          role: e.endorser.role.toLowerCase(),
          verified: e.endorser.profile?.verificationStatus !== "UNVERIFIED",
        },
        createdAt: e.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("Get endorsements error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/endorsements — endorse a model (brands/agencies/clients only)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (user.role === "MODEL") {
      return NextResponse.json({ error: "Models cannot endorse other models" }, { status: 403 })
    }

    const body = await request.json()
    const { modelId, text, tags } = body as { modelId: string; text: string; tags?: string[] }

    if (!modelId || !text?.trim()) {
      return NextResponse.json({ error: "modelId and text required" }, { status: 400 })
    }

    if (modelId === user.id) {
      return NextResponse.json({ error: "Cannot endorse yourself" }, { status: 400 })
    }

    const endorsement = await prisma.endorsement.upsert({
      where: { modelId_endorserId: { modelId, endorserId: user.id } },
      create: {
        modelId,
        endorserId: user.id,
        text: text.trim(),
        tags: tags || [],
      },
      update: {
        text: text.trim(),
        tags: tags || [],
      },
    })

    // Notify the model
    await prisma.notification.create({
      data: {
        userId: modelId,
        type: "SYSTEM",
        payload: {
          title: "New endorsement",
          message: `${user.displayName || user.username} endorsed you: "${text.trim().slice(0, 50)}${text.trim().length > 50 ? "..." : ""}"`,
          endorsementId: endorsement.id,
        },
      },
    }).catch(() => {})

    return NextResponse.json({ endorsement }, { status: 201 })
  } catch (error) {
    console.error("Create endorsement error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
