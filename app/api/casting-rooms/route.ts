import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// GET — get or find casting room for a casting
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const castingId = searchParams.get("castingId")

    if (!castingId) {
      // List all casting rooms the user is a member of
      const rooms = await prisma.conversation.findMany({
        where: {
          type: "casting_room",
          members: { some: { userId: user.id } },
        },
        include: {
          casting: {
            include: {
              creator: { include: { profile: true } },
            },
          },
          members: {
            include: {
              user: { include: { profile: true, modelProfile: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })

      return NextResponse.json({
        rooms: rooms.map((r: typeof rooms[number]) => formatRoom(r)),
      })
    }

    // Find room for specific casting
    const room = await prisma.conversation.findFirst({
      where: {
        type: "casting_room",
        castingId,
      },
      include: {
        casting: {
          include: {
            creator: { include: { profile: true } },
          },
        },
        members: {
          include: {
            user: { include: { profile: true, modelProfile: true } },
          },
        },
      },
    })

    if (!room) {
      return NextResponse.json({ room: null })
    }

    return NextResponse.json({ room: formatRoom(room) })
  } catch (error) {
    console.error("Get casting room error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST — create a casting room for a casting
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { castingId } = body as { castingId: string }

    if (!castingId) {
      return NextResponse.json({ error: "castingId is required" }, { status: 400 })
    }

    // Verify casting exists and user is creator
    const casting = await prisma.casting.findUnique({ where: { id: castingId } })
    if (!casting) {
      return NextResponse.json({ error: "Casting not found" }, { status: 404 })
    }
    if (casting.createdBy !== user.id) {
      return NextResponse.json({ error: "Only the casting creator can create a room" }, { status: 403 })
    }

    // Check if room already exists
    const existing = await prisma.conversation.findFirst({
      where: { type: "casting_room", castingId },
    })
    if (existing) {
      return NextResponse.json({ error: "Room already exists for this casting" }, { status: 409 })
    }

    // Create the room and add creator as member
    const room = await prisma.conversation.create({
      data: {
        type: "casting_room",
        castingId,
        status: "active",
        members: {
          create: { userId: user.id },
        },
        roomEvents: {
          create: {
            type: "created",
            userId: user.id,
          },
        },
      },
      include: {
        casting: {
          include: {
            creator: { include: { profile: true } },
          },
        },
        members: {
          include: {
            user: { include: { profile: true, modelProfile: true } },
          },
        },
      },
    })

    return NextResponse.json({ room: formatRoom(room) })
  } catch (error) {
    console.error("Create casting room error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatRoom(r: any) {
  return {
    id: r.id,
    castingId: r.castingId,
    status: r.status,
    createdAt: r.createdAt,
    casting: r.casting
      ? {
          id: r.casting.id,
          title: r.casting.title,
          type: r.casting.type,
          status: r.casting.status,
          location: r.casting.location,
          creator: {
            id: r.casting.creator.id,
            username: r.casting.creator.username,
            name: r.casting.creator.profile?.displayName || r.casting.creator.username,
            avatar: r.casting.creator.profile?.avatarUrl,
            role: r.casting.creator.role.toLowerCase(),
          },
        }
      : null,
    members: r.members.map((m: any) => ({
      id: m.user.id,
      username: m.user.username,
      name: m.user.profile?.displayName || m.user.username,
      avatar: m.user.profile?.avatarUrl,
      role: m.user.role.toLowerCase(),
      location: m.user.profile?.location,
    })),
  }
}
