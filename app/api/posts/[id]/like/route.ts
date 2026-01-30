import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    await prisma.postLike.upsert({
      where: { userId_postId: { userId: user.id, postId } },
      create: { userId: user.id, postId },
      update: {},
    })

    const count = await prisma.postLike.count({ where: { postId } })
    return NextResponse.json({ liked: true, likes: count })
  } catch (error) {
    console.error("Like post error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await prisma.postLike.deleteMany({
      where: { userId: user.id, postId },
    })

    const count = await prisma.postLike.count({ where: { postId } })
    return NextResponse.json({ liked: false, likes: count })
  } catch (error) {
    console.error("Unlike post error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
