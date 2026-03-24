import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const saves = await prisma.postSave.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        post: {
          include: {
            user: { include: { profile: true } },
            _count: { select: { likes: true, comments: true } },
          },
        },
      },
    })

    const posts = saves.map((s) => ({
      id: s.post.id,
      userId: s.post.userId,
      user: {
        id: s.post.user.id,
        name: s.post.user.profile?.displayName ?? s.post.user.username,
        username: s.post.user.username,
        avatar: s.post.user.profile?.avatarUrl ?? "/placeholder.svg",
        verified: s.post.user.profile?.verificationStatus !== "UNVERIFIED",
      },
      imageUrl: s.post.imageUrl,
      caption: s.post.caption,
      likes: s.post._count.likes,
      comments: s.post._count.comments,
      likedByMe: false,
      savedByMe: true,
      createdAt: s.post.createdAt.toISOString(),
    }))

    return NextResponse.json({ posts })
  } catch (error) {
    console.error("Get saved posts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
