import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { id: castingId } = await params
  const saved = await prisma.savedCasting.findUnique({
    where: { userId_castingId: { userId: user.id, castingId } },
  })
  return NextResponse.json({ saved: !!saved })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { id: castingId } = await params
  const casting = await prisma.casting.findUnique({ where: { id: castingId } })
  if (!casting) return NextResponse.json({ error: "Casting not found" }, { status: 404 })

  await prisma.savedCasting.upsert({
    where: { userId_castingId: { userId: user.id, castingId } },
    create: { userId: user.id, castingId },
    update: {},
  })
  return NextResponse.json({ saved: true })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { id: castingId } = await params
  await prisma.savedCasting.deleteMany({
    where: { userId: user.id, castingId },
  })
  return NextResponse.json({ saved: false })
}
