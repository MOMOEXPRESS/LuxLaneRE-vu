"use client"

import { BadgeCheck, MapPin, Star } from "lucide-react"
import type { User } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TalentCardProps {
  user: User
  onClick: () => void
}

export function TalentCard({ user, onClick }: TalentCardProps) {
  const getTierStyle = () => {
    if (user.tier === "black") return "border-foreground"
    if (user.tier === "elite") return "border-gold"
    return "border-border/30"
  }

  return (
    <button onClick={onClick} className={cn("w-full rounded-2xl overflow-hidden border bg-card", getTierStyle())}>
      {/* Image */}
      <div className="relative aspect-[3/4]">
        <img src={user.avatar || "/placeholder.svg"} alt={user.name} className="w-full h-full object-cover" />

        {/* Tier Badge */}
        {user.tier !== "free" && (
          <div className="absolute top-3 left-3">
            <span
              className={cn(
                "px-2 py-1 text-[10px] font-bold rounded",
                user.tier === "black" ? "bg-foreground text-background" : "bg-gold text-primary-foreground",
              )}
            >
              {user.tier.toUpperCase()}
            </span>
          </div>
        )}

        {/* Verified Badge */}
        {user.verified && (
          <div className="absolute top-3 right-3">
            <div className="w-6 h-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <BadgeCheck className="h-4 w-4 text-gold fill-gold/20" />
            </div>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Info */}
      <div className="p-3 -mt-8 relative">
        <h3 className="font-serif text-lg font-medium truncate">{user.name}</h3>
        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{user.location}</span>
        </div>

        {/* Rating - Mock */}
        <div className="flex items-center gap-1 mt-2">
          <Star className="h-4 w-4 text-gold fill-gold" />
          <span className="text-sm font-medium">4.9</span>
          <span className="text-xs text-muted-foreground">(128)</span>
        </div>

        {/* Quick Stats */}
        {user.role === "model" && user.measurements && (
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {user.measurements.height && <span>{user.measurements.height.includes("/") ? user.measurements.height.split("/")[0].trim() : user.measurements.height}</span>}
            {user.measurements.hairColor && <><span className="w-1 h-1 rounded-full bg-muted-foreground" /><span>{user.measurements.hairColor}</span></>}
            {user.measurements.eyeColor && <><span className="w-1 h-1 rounded-full bg-muted-foreground" /><span>{user.measurements.eyeColor}</span></>}
          </div>
        )}
      </div>
    </button>
  )
}
