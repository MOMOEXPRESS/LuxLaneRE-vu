import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// DELETE — delete a media asset
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params

    const asset = await prisma.mediaAsset.findUnique({ where: { id } })
    if (!asset) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 })
    }
    if (asset.ownerId !== user.id) {
      return NextResponse.json({ error: "Not your media" }, { status: 403 })
    }

    await prisma.mediaAsset.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete media error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
