"use client"

import { ChevronRight, MapPin, Calendar } from "lucide-react"
import type { Casting } from "@/lib/types"

interface AgencyCastingsProps {
  castings: Casting[]
  onViewCasting?: (casting: Casting) => void
}

const typeLabels: Record<string, string> = {
  runway: "Runway",
  campaign: "Campaign",
  editorial: "Editorial",
  commercial: "Commercial",
  event: "Event",
  fitting: "Fitting",
}

export function AgencyCastings({ castings, onViewCasting }: AgencyCastingsProps) {
  return (
    <div className="px-4 py-4 border-b border-border/30">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Castings</h3>
        <span className="text-sm text-muted-foreground">{castings.length}</span>
      </div>

      <div className="space-y-2">
        {castings.map((casting) => (
          <button
            key={casting.id}
            onClick={() => onViewCasting?.(casting)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
          >
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
              <img
                src={casting.images?.[0] || "/placeholder.svg"}
                alt={casting.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{casting.title}</span>
                <span className="shrink-0 rounded bg-zinc-700/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">
                  {typeLabels[casting.type] || casting.type}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {casting.location}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {casting.dates.start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                <span>{casting.applicationsCount} applicants</span>
                {casting.pay.amount > 0 && (
                  <>
                    <span>·</span>
                    <span>
                      {casting.pay.currency} {casting.pay.amount.toLocaleString()}
                    </span>
                  </>
                )}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>
    </div>
  )
}
