import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { mediaConfirmSchema } from "@/lib/validations"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const validation = mediaConfirmSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 })
    }

    const { type, url, meta } = validation.data

    const asset = await prisma.mediaAsset.create({
      data: {
        ownerId: user.id,
        type,
        url,
        meta: meta ?? undefined,
      },
    })

    if (type === "AVATAR") {
      await prisma.profile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, displayName: user.username, avatarUrl: url },
        update: { avatarUrl: url },
      })
    }

    return NextResponse.json({
      id: asset.id,
      ownerId: asset.ownerId,
      type: asset.type,
      url: asset.url,
      meta: asset.meta,
      createdAt: asset.createdAt.toISOString(),
    })
  } catch (error) {
    console.error("Confirm media error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
