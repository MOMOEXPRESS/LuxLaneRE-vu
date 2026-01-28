import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { addJob, DIGITAL_TWIN_QUEUE } from "@/lib/queue"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check minimum inputs (from NestJS: at least 3 TWIN_INPUT assets)
    const inputsCount = await db`
      SELECT COUNT(*) as count FROM media_assets 
      WHERE owner_id = ${user.id} AND type = 'TWIN_INPUT'
    `

    const count = Number.parseInt(inputsCount[0].count, 10)
    if (count < 3) {
      return NextResponse.json({ error: "Upload at least 3 twin inputs to start processing." }, { status: 400 })
    }

    // Update status to PROCESSING
    await db`
      INSERT INTO digital_twins (id, user_id, status)
      VALUES (gen_random_uuid(), ${user.id}, 'PROCESSING')
      ON CONFLICT (user_id) DO UPDATE SET status = 'PROCESSING', updated_at = NOW()
    `

    // Add job to queue for background processing
    await addJob(DIGITAL_TWIN_QUEUE, "process", { userId: user.id })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Upload complete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
