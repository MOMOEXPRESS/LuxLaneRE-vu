import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "ACTIVE"
    const query = searchParams.get("query")
    const creatorId = searchParams.get("creatorId")
    const limit = Number(searchParams.get("limit")) || 20
    const offset = Number(searchParams.get("offset")) || 0
    const type = searchParams.get("type")
    const payMin = searchParams.get("payMin")
    const payMax = searchParams.get("payMax")
    const location = searchParams.get("location")
    const sortBy = searchParams.get("sortBy")

    const where: Record<string, unknown> = {}

    if (creatorId) {
      where.createdBy = creatorId
    } else {
      where.status = status.toUpperCase()
    }

    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ]
    }

    // Type filter
    if (type) {
      where.type = type.toUpperCase()
    }

    // Pay range filters
    if (payMin) {
      where.payMax = { ...(where.payMax as Record<string, unknown> || {}), gte: Number(payMin) }
    }
    if (payMax) {
      where.payMin = { ...(where.payMin as Record<string, unknown> || {}), lte: Number(payMax) }
    }

    // Location filter
    if (location) {
      where.location = { contains: location, mode: "insensitive" }
    }

    // Sort order
    let orderBy: Record<string, string>[] | Record<string, string>
    if (sortBy === "newest") {
      orderBy = { createdAt: "desc" }
    } else if (sortBy === "deadline") {
      orderBy = [{ deadline: "asc" }, { createdAt: "desc" }]
    } else if (sortBy === "pay") {
      orderBy = [{ payMax: "desc" }, { createdAt: "desc" }]
    } else if (creatorId) {
      orderBy = { createdAt: "desc" }
    } else {
      orderBy = [{ deadline: "asc" }, { createdAt: "desc" }]
    }

    const castings = await prisma.casting.findMany({
      where,
      include: {
        creator: {
          include: { profile: true },
        },
        requirements: true,
        _count: { select: { submissions: true } },
      },
      orderBy: orderBy as any,
      take: limit,
      skip: offset,
    })

    // Fetch shortlisted counts in parallel
    const shortlistedCounts = await Promise.all(
      castings.map((c) =>
        prisma.submission.count({
          where: { castingId: c.id, status: { in: ["SHORTLISTED", "OFFERED", "ACCEPTED", "CONFIRMED"] } },
        })
      )
    )

    const result = castings.map((c, i) => ({
      id: c.id,
      createdBy: c.createdBy,
      title: c.title,
      type: c.type,
      description: c.description,
      location: c.location,
      startDate: c.startDate,
      endDate: c.endDate,
      payMin: c.payMin,
      payMax: c.payMax,
      deadline: c.deadline,
      status: c.status,
      verifiedOnly: c.verifiedOnly,
      requireDigitalTwin: c.requireDigitalTwin,
      maxSubmissionsPerAgency: c.maxSubmissionsPerAgency,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      creatorName: c.creator.profile?.displayName ?? c.creator.username,
      creatorAvatar: c.creator.profile?.avatarUrl ?? null,
      creatorUsername: c.creator.username,
      creator: {
        id: c.creator.id,
        displayName: c.creator.profile?.displayName ?? c.creator.displayName ?? c.creator.username,
        username: c.creator.username,
        avatarUrl: c.creator.profile?.avatarUrl ?? c.creator.avatarUrl ?? null,
        role: c.creator.role,
        verified: c.creator.profile?.verificationStatus !== "UNVERIFIED",
      },
      requirements: c.requirements ?? null,
      submissionsCount: c._count.submissions,
      shortlistedCount: shortlistedCounts[i],
    }))

    return NextResponse.json({ castings: result })
  } catch (error) {
    console.error("Get castings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const roleLower = user.role.toLowerCase()
    if (!["brand", "agency", "client"].includes(roleLower)) {
      return NextResponse.json({ error: "Only brands, agencies, and clients can create castings" }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      type,
      location,
      payMin,
      payMax,
      deadline,
      startDate,
      endDate,
      verifiedOnly,
      requireDigitalTwin,
      maxSubmissionsPerAgency,
      requirements,
    } = body

    if (!title || !type) {
      return NextResponse.json({ error: "Title and type are required" }, { status: 400 })
    }

    const casting = await prisma.casting.create({
      data: {
        createdBy: user.id,
        title,
        description: description || null,
        type: type.toUpperCase(),
        location: location || null,
        payMin: payMin || null,
        payMax: payMax || null,
        deadline: deadline ? new Date(deadline) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        verifiedOnly: verifiedOnly || false,
        requireDigitalTwin: requireDigitalTwin || false,
        maxSubmissionsPerAgency: maxSubmissionsPerAgency || null,
        status: "DRAFT",
        ...(requirements
          ? {
              requirements: {
                create: {
                  minHeightCm: requirements.minHeightCm || null,
                  maxHeightCm: requirements.maxHeightCm || null,
                  tags: requirements.tags || [],
                  notes: requirements.notes || null,
                },
              },
            }
          : {}),
      },
    })

    return NextResponse.json({
      success: true,
      casting: { id: casting.id },
    })
  } catch (error) {
    console.error("Create casting error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
