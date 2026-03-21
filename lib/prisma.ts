import { createMockPrismaClient } from "./mock-db"

function createPrisma() {
  if (!process.env.DATABASE_URL) {
    return createMockPrismaClient()
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require("@prisma/client")
    return new PrismaClient()
  } catch {
    // Prisma client not generated or unavailable — use mock
    return createMockPrismaClient()
  }
}

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: ReturnType<typeof createPrisma> | undefined
}

const prisma = globalThis.prismaGlobal ?? createPrisma()
if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma

export { prisma }
