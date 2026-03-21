import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { calculateFitScore } from "@/lib/ai-matching"
import type { User, Casting, ModelMatch } from "@/lib/types"

/**
 * GET /api/castings/[id]/top-matches
 * Returns AI top model matches for a casting. Brand/agency/creator only.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: castingId } = await params
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const castingCheck = await prisma.casting.findUnique({
      where: { id: castingId },
      select: { createdBy: true },
    })
    const isBrandOrAgency = currentUser.role === "brand" || currentUser.role === "agency" || currentUser.role === "client"
    const isCreator = castingCheck?.createdBy === currentUser.id
    if (!isBrandOrAgency && !isCreator) {
      return NextResponse.json({ error: "Only casting creator or brand/agency can view top matches" }, { status: 403 })
    }

    const castingRow = await prisma.casting.findUnique({
      where: { id: castingId },
      include: {
        creator: { include: { profile: true } },
        requirements: true,
      },
    })

    if (!castingRow) {
      return NextResponse.json({ error: "Casting not found" }, { status: 404 })
    }

    const req = castingRow.requirements
    const creatorProfile = castingRow.creator.profile

    const castingForScore: Casting = {
      id: castingRow.id,
      creatorId: castingRow.createdBy,
      creator: {
        id: castingRow.creator.id,
        email: castingRow.creator.email,
        name: creatorProfile?.displayName ?? castingRow.creator.username,
        username: castingRow.creator.username,
        role: castingRow.creator.role.toLowerCase() as User["role"],
        verified: false,
        verificationLevel: "unverified",
        avatar: creatorProfile?.avatarUrl ?? "/placeholder.svg",
        bio: creatorProfile?.bio ?? "",
        location: creatorProfile?.location ?? "",
        followers: 0,
        following: 0,
        createdAt: castingRow.creator.createdAt,
        tags: [],
      },
      title: castingRow.title,
      type: castingRow.type.toLowerCase() as Casting["type"],
      description: castingRow.description ?? "",
      location: castingRow.location ?? "",
      dates: {
        start: castingRow.startDate ?? new Date(),
        end: castingRow.endDate ?? new Date(),
      },
      pay: {
        amount: castingRow.payMax ?? castingRow.payMin ?? 0,
        currency: "EUR",
        type: "flat",
      },
      requirements: {
        heightRangeCm:
          req && req.minHeightCm != null && req.maxHeightCm != null
            ? { min: req.minHeightCm, max: req.maxHeightCm }
            : undefined,
        tags: (req?.tags as string[]) ?? [],
        experience: (req?.tags as string[]) ?? [],
      },
      deadline: castingRow.deadline ?? new Date(),
      status: castingRow.status.toLowerCase() as Casting["status"],
      applicationsCount: 0,
      shortlistedCount: 0,
      createdAt: castingRow.createdAt,
    }

    const modelUsers = await prisma.user.findMany({
      where: { role: "MODEL" },
      include: {
        profile: true,
        modelProfile: true,
      },
    })

    const detailsArr = modelUsers.map((u) => (u.modelProfile?.details as Record<string, unknown>) ?? {})
    const experienceArr = detailsArr.map((d) => (d.experience as string[]) ?? [])

    const usersForScore: User[] = modelUsers.map((u, i) => ({
      id: u.id,
      email: u.email,
      name: u.profile?.displayName ?? u.username,
      username: u.username,
      role: "model" as const,
      verified: (u.profile?.verificationStatus ?? "UNVERIFIED") !== "UNVERIFIED",
      verificationLevel:
        u.profile?.verificationStatus === "LUXLANE_VERIFIED"
          ? "luxlane_verified"
          : u.profile?.verificationStatus === "AGENCY_VERIFIED"
            ? "agency_verified"
            : "unverified",
      avatar: u.profile?.avatarUrl ?? "/placeholder.svg",
      bio: u.profile?.bio ?? "",
      location: u.profile?.location ?? "",
      followers: 0,
      following: 0,
      createdAt: u.createdAt,
      measurements:
        u.modelProfile &&
        (u.modelProfile.heightCm != null ||
          u.modelProfile.bustCm != null ||
          u.modelProfile.waistCm != null ||
          u.modelProfile.hipsCm != null)
          ? {
              height: u.modelProfile.heightCm != null ? `${u.modelProfile.heightCm} cm` : "",
              bust: u.modelProfile.bustCm != null ? `${u.modelProfile.bustCm} cm` : "",
              waist: u.modelProfile.waistCm != null ? `${u.modelProfile.waistCm} cm` : "",
              hips: u.modelProfile.hipsCm != null ? `${u.modelProfile.hipsCm} cm` : "",
              shoeSize: u.modelProfile.shoeSize ?? "",
              hairColor: u.modelProfile.hair ?? "",
              eyeColor: u.modelProfile.eyes ?? "",
              heightCm: u.modelProfile.heightCm ?? undefined,
            }
          : undefined,
      tags: experienceArr[i]?.length ? experienceArr[i] : (u.profile?.experience?.split(", ") ?? []),
      metrics: {
        luxlaneScore: u.modelProfile?.luxlaneScore ?? u.profile?.score ?? 0,
        rank: 0,
        rankTier: "new" as const,
        trend: "stable" as const,
        trendChange: 0,
        components: {
          bookings: 0,
          shortlists: 0,
          profileViews: 0,
          responseRate: 50,
          reliability: 50,
        },
        achievements: [],
        lastUpdated: new Date(),
      },
    }))

    const matches: ModelMatch[] = usersForScore.map((model) => ({
      model,
      fitScore: calculateFitScore(model, castingForScore),
    }))
    matches.sort((a, b) => b.fitScore.total - a.fitScore.total)

    const limit = Math.min(Number(new URL(request.url).searchParams.get("limit")) || 10, 20)
    const topMatches = matches.slice(0, limit)

    return NextResponse.json({
      matches: topMatches.map((m) => ({
        model: {
          id: m.model.id,
          name: m.model.name,
          username: m.model.username,
          avatar: m.model.avatar,
          location: m.model.location,
          verified: m.model.verified,
          verificationLevel: m.model.verificationLevel,
          digitalTwin: m.model.digitalTwin,
        },
        fitScore: m.fitScore,
      })),
    })
  } catch (error) {
    console.error("Top matches error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
