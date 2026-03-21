import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// POST — block a user
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { username } = await params
    const target = await prisma.user.findUnique({ where: { username } })
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    if (target.id === user.id) {
      return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 })
    }

    await prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: user.id, blockedId: target.id } },
      create: { blockerId: user.id, blockedId: target.id },
      update: {},
    })

    // Also unfollow in both directions
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: user.id, followingId: target.id },
          { followerId: target.id, followingId: user.id },
        ],
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Block user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE — unblock a user
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { username } = await params
    const target = await prisma.user.findUnique({ where: { username } })
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    await prisma.block.deleteMany({
      where: { blockerId: user.id, blockedId: target.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unblock user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET — check if blocked
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { username } = await params
    const target = await prisma.user.findUnique({ where: { username } })
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const block = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: user.id, blockedId: target.id } },
    })

    return NextResponse.json({ blocked: !!block })
  } catch (error) {
    console.error("Check block error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
