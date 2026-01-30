import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params
    const currentUser = await getCurrentUser()

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        profile: true,
        modelProfile: true,
        agencyProfile: true,
        brandProfile: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const profile = user.profile
    const roleProfile = user.modelProfile ?? user.agencyProfile ?? user.brandProfile ?? null

    let digitalTwin = null
    if (user.role === "MODEL" && user.modelProfile) {
      const twin = await prisma.digitalTwin.findUnique({
        where: { userId: user.id },
      })
      if (twin)
        digitalTwin = {
          id: twin.userId,
          status: twin.status,
          previewUrl: twin.previewUrl,
          summary: twin.summary,
        }
    }

    const [followersCount, followingCount, isFollowingRecord] = await Promise.all([
      prisma.follow.count({ where: { followingId: user.id } }),
      prisma.follow.count({ where: { followerId: user.id } }),
      currentUser && currentUser.id !== user.id
        ? prisma.follow.findUnique({
            where: {
              followerId_followingId: { followerId: currentUser.id, followingId: user.id },
            },
          })
        : Promise.resolve(null),
    ])

    const [portfolio, posts] = await Promise.all([
      prisma.mediaAsset.findMany({
        where: { ownerId: user.id, type: { in: ["PORTFOLIO", "POLAROID"] } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.post.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          _count: { select: { likes: true, comments: true } },
        },
      }),
    ])

    const displayName = profile?.displayName ?? user.username
    const avatarUrl = profile?.avatarUrl ?? null
    const bio = profile?.bio ?? null
    const location = profile?.location ?? null
    const score = profile?.score ?? 0
    const verificationStatus = profile?.verificationStatus ?? "UNVERIFIED"

    const mp = user.modelProfile
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
    const experience = (details.experience as string[] | undefined) ?? ([] as string[])
    const skinTone = (details.skinTone as string | undefined) ?? undefined
    const availabilityStatus =
      mp?.availability != null ? (mp.availability.toLowerCase() as "available" | "hold" | "booked") : undefined

    return NextResponse.json({
      profile: {
        id: user.id,
        email: user.role === "MODEL" ? undefined : user.email,
        username: user.username,
        displayName,
        name: displayName,
        role: user.role.toLowerCase(),
        avatarUrl,
        avatar: avatarUrl ?? "/placeholder.svg?height=400&width=400",
        bio,
        location,
        score,
        verificationStatus,
        isVerified: verificationStatus !== "UNVERIFIED",
        roleProfile,
        digitalTwin,
        followersCount,
        followingCount,
        followers: followersCount,
        following: followingCount,
        isFollowing: !!isFollowingRecord,
        portfolio: portfolio.map((p) => ({ id: p.id, url: p.url, type: p.type })),
        posts: posts.map((p) => ({
          id: p.id,
          imageUrl: p.imageUrl,
          caption: p.caption,
          createdAt: p.createdAt.toISOString(),
          likesCount: p._count.likes,
          commentsCount: p._count.comments,
        })),
        measurements,
        languages: mp?.languages ?? [],
        experience,
        skinTone,
        availabilityStatus,
        createdAt: user.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Get profile by username error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
