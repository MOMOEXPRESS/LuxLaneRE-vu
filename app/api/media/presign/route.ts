import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { mediaPresignSchema } from "@/lib/validations"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const validation = mediaPresignSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 })
    }

    const { type, filename, contentType } = validation.data

    // Generate unique key matching NestJS pattern: userId/type/timestamp-randomhex-filename
    const key = `${user.id}/${type}/${Date.now()}-${crypto.randomBytes(8).toString("hex")}-${filename}`

    // For MVP, use local file upload endpoint; in production, swap for S3 presigned URLs
    const uploadUrl = `/api/media/upload?key=${encodeURIComponent(key)}`
    const publicUrl = `/uploads/${key}`

    return NextResponse.json({ uploadUrl, publicUrl, key })
  } catch (error) {
    console.error("Presign error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
