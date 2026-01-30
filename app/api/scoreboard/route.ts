import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") || "top"
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 50)

    const models = await prisma.user.findMany({
      where: { role: "MODEL" },
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
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    return NextResponse.json({ models: list })
  } catch (error) {
    console.error("Get scoreboard error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
