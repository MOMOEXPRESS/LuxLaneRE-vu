import { Redis } from "@upstash/redis"

// Initialize Redis client using existing Upstash connection
export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

// Queue names
export const DIGITAL_TWIN_QUEUE = "digitalTwin"

// Add a job to the queue
export async function addJob(queue: string, jobType: string, data: Record<string, unknown>) {
  const jobId = `${queue}:${Date.now()}:${Math.random().toString(36).slice(2)}`
  await redis.lpush(
    `queue:${queue}`,
    JSON.stringify({ id: jobId, type: jobType, data, createdAt: new Date().toISOString() }),
  )
  return jobId
}

// Get next job from queue (for worker)
export async function getNextJob(queue: string) {
  const job = await redis.rpop(`queue:${queue}`)
  if (!job) return null
  return typeof job === "string" ? JSON.parse(job) : job
}

// Get queue length
export async function getQueueLength(queue: string) {
  return redis.llen(`queue:${queue}`)
}
