import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId: followingId } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (user.id === followingId) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
    }

    const target = await prisma.user.findUnique({
      where: { id: followingId },
    })
    if (!target) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 })
    }

    await prisma.follow.upsert({
      where: {
        followerId_followingId: { followerId: user.id, followingId },
      },
      create: { followerId: user.id, followingId },
      update: {},
    })

    // Notify the user being followed
    await prisma.notification.create({
      data: {
        userId: followingId,
        type: "SYSTEM",
        payload: {
          title: "New follower",
          message: `${user.displayName || user.username} started following you`,
          followerId: user.id,
        },
      },
    }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Follow error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId: followingId } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await prisma.follow.deleteMany({
      where: { followerId: user.id, followingId },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Unfollow error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
