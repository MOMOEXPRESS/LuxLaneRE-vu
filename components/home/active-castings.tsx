"use client"

import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { useStore } from "@/lib/store-context"
import type { Casting } from "@/lib/types"
import { MapPin, Clock, ChevronRight, BadgeCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ActiveCastingsProps {
  onViewCasting: (casting: Casting) => void
  onViewAll: () => void
}

export function ActiveCastings({ onViewCasting, onViewAll }: ActiveCastingsProps) {
  const { user } = useAuth()
  const { getActiveCastings } = useStore()
  const activeCastings = getActiveCastings().slice(0, 6)

  const typeLabels: Record<string, string> = {
    runway: "Runway",
    campaign: "Campaign",
    editorial: "Editorial",
    commercial: "Commercial",
    event: "Event",
    fitting: "Fitting",
  }

  const getActionLabel = () => {
    switch (user?.role) {
      case "model":
        return "Apply"
      case "agency":
        return "Submit"
      case "brand":
        return "Review"
      case "client":
        return "View"
      default:
        return "View"
    }
  }

  return (
    <section className="px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-base">Active Castings</h2>
        <Button variant="ghost" size="sm" className="text-muted-foreground h-8" onClick={onViewAll}>
          View all
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {activeCastings.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground text-sm">No active castings available</p>
        </Card>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
          {activeCastings.map((casting, index) => (
            <motion.div
              key={casting.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="shrink-0"
            >
              <Card
                className="w-[280px] overflow-hidden cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => onViewCasting(casting)}
              >
                {/* Casting image or gradient header */}
                <div className="h-24 bg-gradient-to-br from-muted to-muted/50 relative">
                  {casting.images?.[0] && (
                    <img
                      src={casting.images[0] || "/placeholder.svg"}
                      alt={casting.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <Badge variant="secondary" className="text-[10px] h-5 bg-background/90 backdrop-blur-sm">
                      {typeLabels[casting.type]}
                    </Badge>
                  </div>
                </div>

                <div className="p-3">
                  <h3 className="font-medium text-sm truncate">{casting.title}</h3>

                  {/* Creator */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Avatar className="w-4 h-4">
                      <AvatarImage src={casting.creator.avatar || "/placeholder.svg"} alt={casting.creator.name} />
                      <AvatarFallback className="text-[8px]">{casting.creator.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground truncate">{casting.creator.name}</span>
                    {casting.creator.verified && <BadgeCheck className="w-3 h-3 text-foreground shrink-0" />}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {casting.location.split(",")[0]}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(casting.deadline, { addSuffix: false })}
                    </span>
                  </div>

                  {/* Pay + Action */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="text-sm font-medium">
                      {casting.pay.type === "tbd"
                        ? "TBD"
                        : `${casting.pay.currency} ${casting.pay.amount.toLocaleString()}`}
                    </span>
                    <Button size="sm" variant="outline" className="h-7 text-xs bg-transparent">
                      {getActionLabel()}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  )
}
