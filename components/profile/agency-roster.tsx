"use client"

import { BadgeCheck, ChevronRight } from "lucide-react"
import type { User } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AgencyRosterProps {
  roster: User[]
  onModelClick: (userId: string) => void
}

export function AgencyRoster({ roster, onModelClick }: AgencyRosterProps) {
  return (
    <div className="px-4 py-4 border-b border-border/30">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Talent Roster</h3>
        <button className="text-sm text-gold flex items-center gap-1">
          View All <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        {roster.map((model) => (
          <button
            key={model.id}
            onClick={() => onModelClick(model.id)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <div
              className={cn(
                "w-12 h-12 rounded-full p-[2px]",
                model.verified ? "bg-gradient-to-br from-gold to-gold-muted" : "bg-border",
              )}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-background">
                <img src={model.avatar || "/placeholder.svg"} alt={model.name} className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-1">
                <span className="font-medium">{model.name}</span>
                {model.verified && <BadgeCheck className="h-4 w-4 text-gold fill-gold/20" />}
              </div>
              <span className="text-sm text-muted-foreground">{model.location}</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  )
}
