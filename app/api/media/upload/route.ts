import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Use provided key or generate one from type + random id
    const { searchParams } = new URL(request.url)
    let key = searchParams.get("key")
    if (!key) {
      const mediaType = formData.get("type") as string || "general"
      const ext = file.name.split(".").pop() || "bin"
      const id = crypto.randomUUID().slice(0, 8)
      key = `${mediaType.toLowerCase()}/${user.id}/${id}.${ext}`
    }

    // Write to public/uploads directory
    const uploadDir = path.join(process.cwd(), "public", "uploads", path.dirname(key))
    await mkdir(uploadDir, { recursive: true })

    const filePath = path.join(process.cwd(), "public", "uploads", key)
    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    return NextResponse.json({
      success: true,
      url: `/uploads/${key}`,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
