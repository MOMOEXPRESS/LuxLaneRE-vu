import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        profile: true,
        modelProfile: true,
        agencyProfile: true,
        brandProfile: true,
      },
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const profile = dbUser.profile
    const roleProfile = dbUser.modelProfile ?? dbUser.agencyProfile ?? dbUser.brandProfile ?? null

    let digitalTwin = null
    if (dbUser.modelProfile) {
      const twin = await prisma.digitalTwin.findUnique({
        where: { userId: dbUser.id },
      })
      if (twin) digitalTwin = { id: twin.userId, status: twin.status, previewUrl: twin.previewUrl, summary: twin.summary }
    }

    const [followersCount, followingCount, portfolio] = await Promise.all([
      prisma.follow.count({ where: { followingId: dbUser.id } }),
      prisma.follow.count({ where: { followerId: dbUser.id } }),
      prisma.mediaAsset.findMany({
        where: { ownerId: dbUser.id, type: { in: ["PORTFOLIO", "POLAROID"] } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ])

    const mp = dbUser.modelProfile
    const details = (mp?.details as Record<string, unknown> | null) ?? {}
    const measurements =
      mp &&
      (mp.heightCm != null ||
        mp.bustCm != null ||
        mp.waistCm != null ||
        mp.hipsCm != null ||
        mp.shoeSize ||
        mp.hair ||
        mp.eyes)
        ? {
            height: mp.heightCm != null ? `${mp.heightCm} cm` : "",
            bust: mp.bustCm != null ? `${mp.bustCm} cm` : "",
            waist: mp.waistCm != null ? `${mp.waistCm} cm` : "",
            hips: mp.hipsCm != null ? `${mp.hipsCm} cm` : "",
            shoeSize: mp.shoeSize ?? "",
            dressSize: (details.dressSize as string) ?? undefined,
            hairColor: mp.hair ?? "",
            eyeColor: mp.eyes ?? "",
            heightCm: mp.heightCm ?? undefined,
          }
        : undefined
    const experience = (details.experience as string[] | undefined) ?? []
    const skinTone = (details.skinTone as string | undefined) ?? undefined
    const availabilityStatus =
      mp?.availability != null ? (mp.availability.toLowerCase() as "available" | "hold" | "booked") : undefined

    return NextResponse.json({
      profile: {
        id: dbUser.id,
        email: dbUser.email,
        username: dbUser.username,
        displayName: profile?.displayName ?? dbUser.username,
        name: profile?.displayName ?? dbUser.username,
        avatarUrl: profile?.avatarUrl,
        avatar: profile?.avatarUrl ?? "/placeholder.svg?height=400&width=400",
        bio: profile?.bio,
        location: profile?.location,
        role: dbUser.role.toLowerCase(),
        roleProfile,
        digitalTwin,
        followersCount,
        followingCount,
        verificationStatus: profile?.verificationStatus ?? "UNVERIFIED",
        isVerified: profile ? profile.verificationStatus !== "UNVERIFIED" : false,
        score: profile?.score ?? 0,
        portfolio: portfolio.map((p) => ({ id: p.id, url: p.url, type: p.type })),
        measurements,
        languages: mp?.languages ?? [],
        experience,
        skinTone,
        availabilityStatus,
        createdAt: dbUser.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { displayName, bio, location, avatarUrl } = body

    if (displayName != null && displayName.length > 40) {
      return NextResponse.json({ error: "Display name must be 40 characters or less" }, { status: 400 })
    }
    if (bio != null && bio.length > 160) {
      return NextResponse.json({ error: "Bio must be 160 characters or less" }, { status: 400 })
    }

    await prisma.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        displayName: displayName ?? user.username,
        ...(bio != null && { bio }),
        ...(location != null && { location }),
        ...(avatarUrl != null && { avatarUrl }),
      },
      update: {
        ...(displayName != null && { displayName }),
        ...(bio != null && { bio }),
        ...(location != null && { location }),
        ...(avatarUrl != null && { avatarUrl }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
