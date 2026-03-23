import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET — list all models (optionally filter unsigned only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const unsignedOnly = searchParams.get("unsigned") === "true"
    const query = searchParams.get("query")
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100)

    const where: Record<string, unknown> = { role: "MODEL" }

    // Filter out models already signed to an agency
    if (unsignedOnly) {
      where.modelProfile = { agencyId: null }
    }

    if (query) {
      where.OR = [
        { username: { contains: query, mode: "insensitive" } },
        { displayName: { contains: query, mode: "insensitive" } },
        { profile: { location: { contains: query, mode: "insensitive" } } },
      ]
    }

    const users = await prisma.user.findMany({
      where: where as any,
      take: limit,
      include: {
        profile: true,
        modelProfile: true,
      },
      orderBy: { createdAt: "desc" },
    })

    const models = users.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      role: u.role.toLowerCase(),
      avatarUrl: u.profile?.avatarUrl || null,
      bio: u.profile?.bio || null,
      location: u.profile?.location || null,
      verified: u.profile?.verificationStatus !== "UNVERIFIED",
      verificationStatus: u.profile?.verificationStatus || "UNVERIFIED",
      height: u.modelProfile?.height || null,
      bust: u.modelProfile?.bust || null,
      waist: u.modelProfile?.waist || null,
      hips: u.modelProfile?.hips || null,
      hairColor: u.modelProfile?.hairColor || null,
      eyeColor: u.modelProfile?.eyeColor || null,
      agencyId: u.modelProfile?.agencyId || null,
      createdAt: u.createdAt.toISOString(),
    }))

    return NextResponse.json({ models })
  } catch (error) {
    console.error("List models error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
