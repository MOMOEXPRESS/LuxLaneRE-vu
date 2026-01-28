"use client"

import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { ModelMatch, User } from "@/lib/types"
import { BadgeCheck, Sparkles, ChevronRight, Shield, Scan } from "lucide-react"

interface FitScorePanelProps {
  matches: ModelMatch[]
  onViewProfile: (user: User) => void
  onInvite?: (user: User) => void
  title?: string
}

export function FitScorePanel({ matches, onViewProfile, onInvite, title = "AI Top Matches" }: FitScorePanelProps) {
  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-500"
    if (score >= 70) return "text-sky-500"
    if (score >= 50) return "text-amber-500"
    return "text-muted-foreground"
  }

  const getScoreBarColor = (score: number) => {
    if (score >= 85) return "bg-emerald-500"
    if (score >= 70) return "bg-sky-500"
    if (score >= 50) return "bg-amber-500"
    return "bg-muted-foreground"
  }

  const breakdownLabels = {
    physical: "Physical",
    experience: "Experience",
    reliability: "Reliability",
    brandAffinity: "Brand Fit",
    momentum: "Momentum",
  }

  const getVerificationBadge = (level: string) => {
    switch (level) {
      case "luxlane_verified":
        return (
          <Badge variant="secondary" className="h-5 text-[10px] gap-0.5 bg-foreground/10">
            <Shield className="w-2.5 h-2.5" />
            Luxlane
          </Badge>
        )
      case "agency_verified":
        return (
          <Badge variant="secondary" className="h-5 text-[10px] gap-0.5">
            <BadgeCheck className="w-2.5 h-2.5" />
            Agency
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground">Ranked by fit score</p>
        </div>
      </div>

      <div className="divide-y divide-border">
        {matches.map((match, index) => (
          <motion.div
            key={match.model.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-4"
          >
            <div className="flex items-start gap-3">
              {/* Rank */}
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
                {index + 1}
              </div>

              {/* Avatar */}
              <Avatar className="w-10 h-10 shrink-0 cursor-pointer" onClick={() => onViewProfile(match.model)}>
                <AvatarImage src={match.model.avatar || "/placeholder.svg"} alt={match.model.name} />
                <AvatarFallback>{match.model.name[0]}</AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className="font-medium text-sm truncate cursor-pointer hover:underline"
                    onClick={() => onViewProfile(match.model)}
                  >
                    {match.model.name}
                  </span>
                  {match.model.verified && <BadgeCheck className="w-3.5 h-3.5 shrink-0" />}
                  {getVerificationBadge(match.model.verificationLevel)}
                  {match.model.digitalTwin?.status === "complete" && (
                    <Badge variant="outline" className="h-5 text-[10px] gap-0.5">
                      <Scan className="w-2.5 h-2.5" />
                      Twin
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground truncate">{match.model.location}</p>

                {/* Score Breakdown */}
                <div className="mt-2 space-y-1.5">
                  {Object.entries(match.fitScore.breakdown).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-16 shrink-0">
                        {breakdownLabels[key as keyof typeof breakdownLabels]}
                      </span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${getScoreBarColor(value)}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${value}%` }}
                          transition={{ duration: 0.5, delay: index * 0.05 + 0.2 }}
                        />
                      </div>
                      <span className="text-[10px] font-medium w-7 text-right">{value}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Score */}
              <div className="text-right shrink-0">
                <div className={`text-2xl font-bold ${getScoreColor(match.fitScore.total)}`}>
                  {match.fitScore.total}
                </div>
                <p className="text-[10px] text-muted-foreground">Fit Score</p>
                {onInvite && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 h-7 text-xs bg-transparent"
                    onClick={() => onInvite(match.model)}
                  >
                    Invite
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {matches.length > 0 && (
        <button className="w-full p-3 text-sm text-muted-foreground hover:bg-muted/50 transition-colors flex items-center justify-center gap-1 border-t border-border">
          View all matches
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </Card>
  )
}
