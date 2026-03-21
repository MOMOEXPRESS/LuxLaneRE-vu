import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// GET — earnings dashboard for current user
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    const where: { userId: string; status?: string } = { userId: user.id }
    if (status) where.status = status

    const [earnings, total] = await Promise.all([
      prisma.earning.findMany({
        where,
        include: {
          casting: {
            select: {
              id: true,
              title: true,
              type: true,
              creator: {
                select: {
                  id: true,
                  username: true,
                  profile: { select: { displayName: true, avatarUrl: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.earning.count({ where }),
    ])

    // Summary stats
    const totalEarned = await prisma.earning.aggregate({
      where: { userId: user.id, status: "PAID" },
      _sum: { amount: true },
    })

    const totalPending = await prisma.earning.aggregate({
      where: { userId: user.id, status: "PENDING" },
      _sum: { amount: true },
    })

    // Monthly earnings (last 12 months)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const monthlyEarnings = await prisma.$queryRaw<{ month: string; total: bigint }[]>`
      SELECT TO_CHAR("createdAt", 'YYYY-MM') as month, SUM("amount")::bigint as total
      FROM "earnings"
      WHERE "userId" = ${user.id}
        AND "status" = 'PAID'
        AND "createdAt" >= ${twelveMonthsAgo}
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY month ASC
    `

    return NextResponse.json({
      earnings: earnings.map((e: typeof earnings[number]) => ({
        id: e.id,
        amount: e.amount,
        currency: e.currency,
        description: e.description,
        status: e.status,
        paidAt: e.paidAt,
        createdAt: e.createdAt,
        casting: e.casting
          ? {
              id: e.casting.id,
              title: e.casting.title,
              type: e.casting.type,
              creator: {
                id: e.casting.creator.id,
                username: e.casting.creator.username,
                name: e.casting.creator.profile?.displayName || e.casting.creator.username,
                avatar: e.casting.creator.profile?.avatarUrl || null,
              },
            }
          : null,
      })),
      total,
      summary: {
        totalEarned: totalEarned._sum.amount || 0,
        totalPending: totalPending._sum.amount || 0,
        currency: "EUR",
      },
      monthlyEarnings: monthlyEarnings.map((m: typeof monthlyEarnings[number]) => ({
        month: m.month,
        total: Number(m.total),
      })),
    })
  } catch (error) {
    console.error("Earnings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
