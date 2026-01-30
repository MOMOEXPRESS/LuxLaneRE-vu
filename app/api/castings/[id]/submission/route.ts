import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { id: castingId } = await params
  const submission = await prisma.submission.findUnique({
    where: { castingId_modelId: { castingId, modelId: user.id } },
  })
  if (!submission) return NextResponse.json({ submission: null })
  return NextResponse.json({
    submission: {
      id: submission.id,
      status: submission.status.toLowerCase(),
      note: submission.note,
      createdAt: submission.createdAt.toISOString(),
    },
  })
}
