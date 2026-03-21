import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: castingId } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const casting = await prisma.casting.findUnique({
      where: { id: castingId },
      select: { createdBy: true },
    })

    if (!casting) {
      return NextResponse.json({ error: "Casting not found" }, { status: 404 })
    }

    if (casting.createdBy !== user.id) {
      return NextResponse.json({ error: "Not authorized to view submissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const submissions = await prisma.submission.findMany({
      where: {
        castingId,
        ...(status ? { status: status.toUpperCase() as never } : {}),
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

    const result = submissions.map((s) => ({
      id: s.id,
      castingId: s.castingId,
      modelId: s.modelId,
      submittedBy: s.submittedBy,
      status: s.status,
      note: s.note,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      modelName: s.model.profile?.displayName ?? s.model.username,
      modelAvatar: s.model.profile?.avatarUrl ?? null,
      modelUsername: s.model.username,
      modelHeightCm: s.model.modelProfile?.heightCm ?? null,
      modelScore: s.model.modelProfile?.luxlaneScore ?? 0,
    }))

    return NextResponse.json({ submissions: result })
  } catch (error) {
    console.error("Get submissions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
