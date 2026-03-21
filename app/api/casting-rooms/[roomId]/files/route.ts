import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// GET — list files for a casting room
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { roomId } = await params

    const membership = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: roomId, userId: user.id } },
    })
    if (!membership) {
      return NextResponse.json({ error: "Not a member of this room" }, { status: 403 })
    }

    const files = await prisma.roomFile.findMany({
      where: { roomId },
      orderBy: { createdAt: "desc" },
    })

    // Fetch uploader details
    const uploaderIds = [...new Set(files.map((f: typeof files[number]) => f.uploadedBy))]
    const uploaders = await prisma.user.findMany({
      where: { id: { in: uploaderIds } },
      include: { profile: true },
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uploaderMap = new Map<string, any>()
    for (const u of uploaders) uploaderMap.set(u.id, u)

    return NextResponse.json({
      files: files.map((f: typeof files[number]) => {
        const uploader = uploaderMap.get(f.uploadedBy)
        return {
          id: f.id,
          roomId: f.roomId,
          name: f.name,
          type: f.type,
          url: f.url,
          uploadedBy: uploader
            ? {
                id: uploader.id,
                username: uploader.username,
                name: uploader.profile?.displayName || uploader.username,
                avatar: uploader.profile?.avatarUrl,
              }
            : null,
          createdAt: f.createdAt,
        }
      }),
    })
  } catch (error) {
    console.error("Get room files error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST — upload a file to the casting room
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { roomId } = await params

    const membership = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: roomId, userId: user.id } },
    })
    if (!membership) {
      return NextResponse.json({ error: "Not a member of this room" }, { status: 403 })
    }

    const body = await request.json()
    const { name, type, url } = body as { name: string; type: string; url: string }

    if (!name || !url) {
      return NextResponse.json({ error: "name and url are required" }, { status: 400 })
    }

    const file = await prisma.roomFile.create({
      data: {
        roomId,
        name,
        type: type || "other",
        url,
        uploadedBy: user.id,
      },
    })

    return NextResponse.json({ file })
  } catch (error) {
    console.error("Create room file error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
