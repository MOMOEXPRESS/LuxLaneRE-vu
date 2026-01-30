import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter")
    const limit = Math.min(Number(searchParams.get("limit")) || 10, 50)

    const where: { role: "MODEL"; profile?: { experience?: { contains: string; mode: "insensitive" } } } = {
      role: "MODEL",
    }
    if (filter && filter.length > 0) {
      where.profile = { experience: { contains: filter, mode: "insensitive" } }
    }

    const models = await prisma.user.findMany({
      where,
      include: {
        profile: true,
        modelProfile: true,
      },
      take: limit * 2,
    })

    const list = models
      .filter((u) => u.profile != null)
      .map((u) => ({
        id: u.id,
        displayName: u.profile!.displayName,
        avatarUrl: u.profile!.avatarUrl,
        username: u.username,
        isVerified: u.profile!.verificationStatus !== "UNVERIFIED",
        score: u.profile!.score ?? u.modelProfile?.luxlaneScore ?? 0,
        heightCm: u.modelProfile?.heightCm,
        hair: u.profile!.hair ?? u.modelProfile?.hair,
        eyes: u.profile!.eyes ?? u.modelProfile?.eyes,
        experience: u.profile!.experience,
        location: u.profile!.location,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    return NextResponse.json({ models: list })
  } catch (error) {
    console.error("Get top models error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
