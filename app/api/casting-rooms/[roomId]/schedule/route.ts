import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// GET — list schedule items for a casting room
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

    const items = await prisma.roomScheduleItem.findMany({
      where: { roomId },
      orderBy: { date: "asc" },
    })

    return NextResponse.json({
      schedule: items.map((s: typeof items[number]) => ({
        id: s.id,
        roomId: s.roomId,
        title: s.title,
        date: s.date,
        time: s.time,
        location: s.location,
        notes: s.notes,
      })),
    })
  } catch (error) {
    console.error("Get room schedule error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST — add a schedule item
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
    const { title, date, time, location, notes } = body as {
      title: string
      date: string
      time: string
      location?: string
      notes?: string
    }

    if (!title || !date || !time) {
      return NextResponse.json({ error: "title, date, and time are required" }, { status: 400 })
    }

    const item = await prisma.roomScheduleItem.create({
      data: {
        roomId,
        title,
        date: new Date(date),
        time,
        location,
        notes,
      },
    })

    return NextResponse.json({ item })
  } catch (error) {
    console.error("Create room schedule item error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
