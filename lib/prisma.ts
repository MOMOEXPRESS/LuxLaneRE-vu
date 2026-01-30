/**
 * Prisma client is not available in the v0 environment.
 * All database operations now use Neon SQL directly via @/lib/db
 * 
 * If you see this error, please update your imports to use:
 * import { sql } from "@/lib/db"
 */

// Export a proxy that throws helpful errors if any code still tries to use Prisma
const prismaNotAvailable = () => {
  throw new Error(
    "Prisma client is not available. Please use `import { sql } from '@/lib/db'` instead."
  )
}

export const prisma = new Proxy({} as Record<string, unknown>, {
  get() {
    prismaNotAvailable()
    return undefined
  },
})
