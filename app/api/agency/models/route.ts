import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

/**
 * GET /api/agency/models
 * Returns the agency's roster: models with profile, availability, and casting history (submissions with casting event, when, status).
 */
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (user.role !== "agency") {
      return NextResponse.json({ error: "Only agencies can access roster" }, { status: 403 })
    }

    const modelProfiles = await prisma.modelProfile.findMany({
      where: { agencyId: user.id },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { userId: "asc" },
    })

    const modelIds = modelProfiles.map((mp) => mp.userId)

    const submissions = await prisma.submission.findMany({
      where: { modelId: { in: modelIds } },
      include: {
        casting: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            location: true,
            startDate: true,
            endDate: true,
            deadline: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const submissionsByModel = submissions.reduce<Record<string, typeof submissions>>((acc, s) => {
      if (!acc[s.modelId]) acc[s.modelId] = []
      acc[s.modelId].push(s)
      return acc
    }, {})

    const roster = modelProfiles.map((mp) => {
      const profile = mp.user.profile
      const modelSubmissions = (submissionsByModel[mp.userId] ?? []).map((s) => ({
        id: s.id,
        status: s.status,
        submittedAt: s.createdAt,
        casting: s.casting
          ? {
              id: s.casting.id,
              title: s.casting.title,
              type: s.casting.type,
              status: s.casting.status,
              location: s.casting.location,
              startDate: s.casting.startDate,
              endDate: s.casting.endDate,
              deadline: s.casting.deadline,
            }
          : null,
      }))

      return {
        id: mp.userId,
        username: mp.user.username,
        email: mp.user.email,
        displayName: profile?.displayName ?? mp.user.username,
        avatarUrl: profile?.avatarUrl ?? null,
        location: profile?.location ?? null,
        bio: profile?.bio ?? null,
        verificationStatus: profile?.verificationStatus ?? "UNVERIFIED",
        availability: mp.availability,
        luxlaneScore: mp.luxlaneScore,
        submissions: modelSubmissions,
      }
    })

    return NextResponse.json({ roster })
  } catch (error) {
    console.error("Agency models error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
