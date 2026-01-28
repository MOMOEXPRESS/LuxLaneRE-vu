import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getNextJob, DIGITAL_TWIN_QUEUE } from "@/lib/queue"

// Worker endpoint to process digital twin jobs
// In production, this would be a cron job or separate worker service
export async function POST(request: NextRequest) {
  try {
    // Verify internal request (add auth in production)
    const authHeader = request.headers.get("x-internal-key")
    if (authHeader !== process.env.INTERNAL_JOB_KEY && process.env.INTERNAL_JOB_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const job = await getNextJob(DIGITAL_TWIN_QUEUE)
    if (!job) {
      return NextResponse.json({ message: "No jobs in queue" })
    }

    const { userId } = job.data as { userId: string }

    // Set to PROCESSING
    await db`
      INSERT INTO digital_twins (id, user_id, status)
      VALUES (gen_random_uuid(), ${userId}, 'PROCESSING')
      ON CONFLICT (user_id) DO UPDATE SET status = 'PROCESSING', updated_at = NOW()
    `

    // Get input assets
    const inputs = await db`
      SELECT id, url, metadata FROM media_assets 
      WHERE owner_id = ${userId} AND type = 'TWIN_INPUT'
      LIMIT 50
    `

    // v1 placeholder processing (matches NestJS processor)
    // In v2: download TWIN_INPUT, run CV pipeline, generate preview, upload output
    const summary = {
      version: "v1",
      inputsCount: inputs.length,
      generatedAt: new Date().toISOString(),
      notes: "Placeholder summary. Replace with CV pipeline later.",
    }

    // Update to READY with summary
    await db`
      UPDATE digital_twins SET 
        status = 'READY',
        summary = ${JSON.stringify(summary)}::jsonb,
        preview_url = NULL,
        updated_at = NOW()
      WHERE user_id = ${userId}
    `

    return NextResponse.json({ ok: true, processed: userId })
  } catch (error) {
    console.error("Process twin job error:", error)

    // If we have job data, mark as FAILED
    try {
      const job = await getNextJob(DIGITAL_TWIN_QUEUE)
      if (job?.data?.userId) {
        await db`
          UPDATE digital_twins SET status = 'FAILED', updated_at = NOW()
          WHERE user_id = ${job.data.userId}
        `
      }
    } catch {}

    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }
}
