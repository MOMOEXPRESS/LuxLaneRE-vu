"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Casting, FitScore } from "@/lib/types"
import { Sparkles, MapPin, Clock, BadgeCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface RecommendedCastingsProps {
  recommendations: Array<{ casting: Casting; fitScore: FitScore }>
  onViewCasting: (casting: Casting) => void
  title?: string
  description?: string
}

export function RecommendedCastings({
  recommendations,
  onViewCasting,
  title = "Recommended for You",
  description = "Based on your profile and experience",
}: RecommendedCastingsProps) {
  const typeLabels: Record<string, string> = {
    runway: "Runway",
    campaign: "Campaign",
    editorial: "Editorial",
    commercial: "Commercial",
    event: "Event",
    fitting: "Fitting",
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-500"
    if (score >= 70) return "text-sky-500"
    if (score >= 50) return "text-amber-500"
    return "text-muted-foreground"
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-4">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
        {recommendations.map((rec, index) => (
          <motion.div
            key={rec.casting.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className="w-[280px] shrink-0 overflow-hidden cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => onViewCasting(rec.casting)}
            >
              {/* Image */}
              {rec.casting.images?.[0] && (
                <div className="h-32 bg-muted relative">
                  <img
                    src={rec.casting.images[0] || "/placeholder.svg"}
                    alt={rec.casting.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge
                      className={`${getScoreColor(rec.fitScore.total)} bg-background/90 backdrop-blur border-0 font-bold`}
                    >
                      {rec.fitScore.total}% match
                    </Badge>
                  </div>
                </div>
              )}

              <div className="p-3">
                <Badge variant="secondary" className="text-[10px] h-5 mb-2">
                  {typeLabels[rec.casting.type]}
                </Badge>

                <h4 className="font-medium text-sm truncate">{rec.casting.title}</h4>

                <div className="flex items-center gap-1.5 mt-1">
                  <Avatar className="w-4 h-4">
                    <AvatarImage
                      src={rec.casting.creator.avatar || "/placeholder.svg"}
                      alt={rec.casting.creator.name}
                    />
                    <AvatarFallback className="text-[8px]">{rec.casting.creator.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground truncate">{rec.casting.creator.name}</span>
                  {rec.casting.creator.verified && <BadgeCheck className="w-3 h-3 shrink-0" />}
                </div>

                <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {rec.casting.location.split(",")[0]}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(rec.casting.deadline, { addSuffix: false })}
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
