import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100)

    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      take: limit,
      include: { user: { include: { profile: true } } },
    })

    const formatted = comments.map((c) => ({
      id: c.id,
      postId: c.postId,
      userId: c.userId,
      user: {
        id: c.user.id,
        name: c.user.profile?.displayName ?? c.user.username,
        username: c.user.username,
        avatar: c.user.profile?.avatarUrl ?? "/placeholder.svg",
      },
      body: c.body,
      createdAt: c.createdAt.toISOString(),
    }))

    return NextResponse.json({ comments: formatted })
  } catch (error) {
    console.error("Get comments error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    const body = await request.json().catch(() => ({}))
    const commentBody = (body.body ?? body.content) as string | undefined
    if (!commentBody?.trim()) {
      return NextResponse.json({ error: "Comment body is required" }, { status: 400 })
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        userId: user.id,
        body: commentBody.trim(),
      },
      include: { user: { include: { profile: true } } },
    })

    return NextResponse.json({
      comment: {
        id: comment.id,
        postId: comment.postId,
        userId: comment.userId,
        user: {
          id: comment.user.id,
          name: comment.user.profile?.displayName ?? comment.user.username,
          username: comment.user.username,
          avatar: comment.user.profile?.avatarUrl ?? "/placeholder.svg",
        },
        body: comment.body,
        createdAt: comment.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Create comment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
