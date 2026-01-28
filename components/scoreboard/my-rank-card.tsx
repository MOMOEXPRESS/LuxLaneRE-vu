"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Trophy, ChevronRight } from "lucide-react"
import type { User } from "@/lib/types"

interface MyRankCardProps {
  user: User
  onViewScoreboard: () => void
}

export function MyRankCard({ user, onViewScoreboard }: MyRankCardProps) {
  if (!user.metrics) return null

  const getTierLabel = (tier: string) => {
    const labels: Record<string, string> = {
      top10: "Top 10",
      top50: "Top 50",
      top100: "Top 100",
      top500: "Top 500",
      rising: "Rising Star",
      new: "New",
    }
    return labels[tier] || tier
  }

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      top10: "from-amber-500 to-orange-500",
      top50: "from-slate-400 to-slate-500",
      top100: "from-amber-700 to-amber-800",
      rising: "from-emerald-500 to-teal-500",
    }
    return colors[tier] || "from-muted to-muted"
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card
        className={`p-4 cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br ${getTierColor(user.metrics.rankTier)}`}
        onClick={onViewScoreboard}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/80">Your Rank</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">#{user.metrics.rank}</span>
                <Badge className="bg-white/20 text-white border-0 text-[10px]">
                  {getTierLabel(user.metrics.rankTier)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              {user.metrics.trend === "up" && <TrendingUp className="w-4 h-4 text-white" />}
              {user.metrics.trend === "down" && <TrendingUp className="w-4 h-4 text-white rotate-180" />}
              <span className="text-lg font-bold text-white">{user.metrics.luxlaneScore}</span>
            </div>
            <p className="text-[10px] text-white/70">Luxlane Score</p>
          </div>

          <ChevronRight className="w-5 h-5 text-white/60 shrink-0 ml-2" />
        </div>
      </Card>
    </motion.div>
  )
}
