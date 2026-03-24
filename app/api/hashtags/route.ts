import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/hashtags?q=fashion — search/trending hashtags
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")?.trim()
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 50)

    // Find posts containing the hashtag and count occurrences
    if (q) {
      const tag = q.startsWith("#") ? q : `#${q}`
      const posts = await prisma.post.findMany({
        where: { caption: { contains: tag, mode: "insensitive" } },
        select: { id: true, caption: true },
        take: 100,
      })

      // Extract all hashtags from matching posts
      const tagCounts = new Map<string, number>()
      for (const post of posts) {
        const tags = (post.caption || "").match(/#[\w]+/g) || []
        for (const t of tags) {
          const lower = t.toLowerCase()
          tagCounts.set(lower, (tagCounts.get(lower) || 0) + 1)
        }
      }

      const hashtags = [...tagCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([tag, count]) => ({ tag, count }))

      return NextResponse.json({ hashtags })
    }

    // No query — return trending (most used hashtags across all posts)
    const recentPosts = await prisma.post.findMany({
      where: { caption: { not: null } },
      select: { caption: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    })

    const tagCounts = new Map<string, number>()
    for (const post of recentPosts) {
      const tags = (post.caption || "").match(/#[\w]+/g) || []
      for (const t of tags) {
        const lower = t.toLowerCase()
        tagCounts.set(lower, (tagCounts.get(lower) || 0) + 1)
      }
    }

    const trending = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }))

    return NextResponse.json({ hashtags: trending })
  } catch (error) {
    console.error("Hashtags error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
