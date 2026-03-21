import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    const casting = await prisma.casting.findUnique({
      where: { id },
      include: {
        creator: { include: { profile: true } },
        requirements: true,
        _count: { select: { submissions: true } },
      },
    })

    if (!casting) {
      return NextResponse.json({ error: "Casting not found" }, { status: 404 })
    }

    let userSubmission = null
    if (user && user.role === "model") {
      userSubmission = await prisma.submission.findUnique({
        where: { castingId_modelId: { castingId: id, modelId: user.id } },
        select: { id: true, status: true, createdAt: true },
      })
    }

    return NextResponse.json({
      casting: {
        id: casting.id,
        createdBy: casting.createdBy,
        title: casting.title,
        type: casting.type,
        description: casting.description,
        location: casting.location,
        startDate: casting.startDate,
        endDate: casting.endDate,
        payMin: casting.payMin,
        payMax: casting.payMax,
        deadline: casting.deadline,
        status: casting.status,
        verifiedOnly: casting.verifiedOnly,
        requireDigitalTwin: casting.requireDigitalTwin,
        createdAt: casting.createdAt,
        updatedAt: casting.updatedAt,
        creatorName: casting.creator.profile?.displayName ?? casting.creator.username,
        creatorAvatar: casting.creator.profile?.avatarUrl ?? null,
        creatorUsername: casting.creator.username,
        creatorRole: casting.creator.role,
        requirements: casting.requirements ?? null,
        submissionCount: casting._count.submissions,
        userSubmission,
      },
    })
  } catch (error) {
    console.error("Get casting error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const casting = await prisma.casting.findUnique({
      where: { id },
      select: { createdBy: true },
    })

    if (!casting) {
      return NextResponse.json({ error: "Casting not found" }, { status: 404 })
    }

    if (casting.createdBy !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const body = await request.json()

    await prisma.casting.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.payMin !== undefined && { payMin: body.payMin }),
        ...(body.payMax !== undefined && { payMax: body.payMax }),
        ...(body.deadline !== undefined && { deadline: body.deadline ? new Date(body.deadline) : null }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update casting error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
