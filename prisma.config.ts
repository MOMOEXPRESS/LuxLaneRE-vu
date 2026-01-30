/**
 * Prisma 7+ uses this so the CLI finds the schema.
 * When this file exists, Prisma skips auto-loading .env, so we load it here.
 */
import dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.join(process.cwd(), ".env") })
dotenv.config({ path: path.join(process.cwd(), ".env.local") })

export default {
  schema: "prisma/schema.prisma",
}
